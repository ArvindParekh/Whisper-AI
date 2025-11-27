// whisper indexer - code ingestion pipeline
// parse → chunk → embed → store

import { parseFile, type ParsedFile, type Symbol } from './parser';

interface IndexRequest {
	sessionId: string;
	files: { path: string; content: string }[];
}

interface CodeChunk {
	id: string;
	filePath: string;
	symbolName: string | null;
	kind: 'function' | 'class' | 'module' | 'imports';
	content: string;
	lineStart: number;
	lineEnd: number;
	context: string;
}

export interface Env {
	AI: Ai;
	VECTORIZE: VectorizeIndex;
	DB: D1Database;
	SUMMARIES: KVNamespace;
}

// re-export types for other modules
export type { ParsedFile, Symbol };

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/index' && request.method === 'POST') {
			const req: IndexRequest = await request.json();
			console.log(`[indexer] received ${req.files.length} files`);

			ctx.waitUntil(indexFiles(env, req)); // spin up a non-blocking thread, pretty smart cf has this!
			return Response.json({ ok: true, queued: req.files.length });
		}

		if (url.pathname === '/health') {
			return Response.json({ status: 'ok' });
		}

		return new Response('not found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;

// main pipeline
async function indexFiles(env: Env, req: IndexRequest): Promise<void> {
	const { sessionId, files } = req;

	try {
		// step 1: parse all files (with regex)
		const parsed = files.map((f) => parseFile(f.path, f.content)).filter((p): p is ParsedFile => p !== null);
		console.log(`[indexer] parsed ${parsed.length}/${files.length} files`);

		// step 2: generate chunks
		const chunks = parsed.flatMap((p) => {
			const file = files.find((f) => f.path === p.path);
			return file ? chunkFile(p, file.content) : [];
		});
		console.log(`[indexer] created ${chunks.length} chunks`);

		// step 3: embed and store (process parallelly)
		await Promise.all([storeVectors(env, sessionId, chunks), storeSymbols(env, sessionId, parsed), storeRepoMap(env, sessionId, parsed)]);

		console.log(`[indexer] done for session ${sessionId}`);
	} catch (err) {
		console.error(`[indexer] failed:`, err);
	}
}

// chunking - one chunk per symbol, + imports
function chunkFile(parsed: ParsedFile, content: string): CodeChunk[] {
	const lines = content.split('\n');
	const chunks: CodeChunk[] = [];

	// imports chunk
	if (parsed.imports.length > 0) {
		const importLines = lines.filter((l) => /^(import|from|const.*require)/.test(l.trim()));
		if (importLines.length > 0) {
			chunks.push({
				id: `${parsed.path}::imports`,
				filePath: parsed.path,
				symbolName: null,
				kind: 'imports',
				content: importLines.join('\n'),
				lineStart: 1,
				lineEnd: importLines.length,
				context: `imports from ${parsed.path}`,
			});
		}
	}

	// one chunk per top-level symbol
	const topLevel = parsed.symbols.filter((s) => !s.parent);
	for (const sym of topLevel) {
		const symContent = lines.slice(sym.lineStart - 1, sym.lineEnd).join('\n');
		if (!symContent.trim()) continue;

		const kind = sym.kind === 'class' ? 'class' : 'function';
		const methods =
			sym.kind === 'class'
				? parsed.symbols
						.filter((s) => s.parent === sym.name)
						.map((s) => s.name)
						.join(', ')
				: null;

		chunks.push({
			id: `${parsed.path}::${sym.name}`,
			filePath: parsed.path,
			symbolName: sym.name,
			kind,
			content: symContent,
			lineStart: sym.lineStart,
			lineEnd: sym.lineEnd,
			context: methods ? `class ${sym.name} { ${methods} }` : sym.signature,
		});
	}

	// fallback: if no symbols, chunk entire file
	if (chunks.length === 0 && content.trim()) {
		chunks.push({
			id: `${parsed.path}::module`,
			filePath: parsed.path,
			symbolName: null,
			kind: 'module',
			content: content.slice(0, 4000),
			lineStart: 1,
			lineEnd: lines.length,
			context: parsed.path,
		});
	}

	return chunks;
}

// embed chunks and store in vectorize
async function storeVectors(env: Env, sessionId: string, chunks: CodeChunk[]): Promise<void> {
	const BATCH_SIZE = 20;

	for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
		const batch = chunks.slice(i, i + BATCH_SIZE);
		const texts = batch.map((c) => `${c.context}\n\n${c.content}`.slice(0, 2000));

		try {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts })) as { data: number[][] };

			const vectors = batch.map((chunk, idx) => ({
				id: `${sessionId}::${chunk.id}`,
				values: result.data[idx],
				metadata: {
					sessionId,
					filePath: chunk.filePath,
					symbolName: chunk.symbolName || '',
					kind: chunk.kind,
					lineStart: chunk.lineStart,
					lineEnd: chunk.lineEnd,
				},
			}));

			await env.VECTORIZE.upsert(vectors);
		} catch (err) {
			console.error(`[indexer] vector batch failed:`, err);
		}
	}
}

// store symbols in d1
async function storeSymbols(env: Env, sessionId: string, parsed: ParsedFile[]): Promise<void> {
	try {
		// ensure table exists
		await env.DB.exec(`
			CREATE TABLE IF NOT EXISTS symbols (
				id TEXT PRIMARY KEY,
				session_id TEXT NOT NULL,
				file_path TEXT NOT NULL,
				name TEXT NOT NULL,
				kind TEXT NOT NULL,
				signature TEXT,
				line_start INTEGER,
				line_end INTEGER,
				parent TEXT
			);
			CREATE INDEX IF NOT EXISTS idx_session ON symbols(session_id);
			CREATE INDEX IF NOT EXISTS idx_name ON symbols(name);
		`);

		// clear old data for this session
		await env.DB.prepare('DELETE FROM symbols WHERE session_id = ?').bind(sessionId).run();

		// batch insert
		const stmt = env.DB.prepare(`
			INSERT INTO symbols (id, session_id, file_path, name, kind, signature, line_start, line_end, parent)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`);

		const inserts: D1PreparedStatement[] = [];
		for (const file of parsed) {
			for (const sym of file.symbols) {
				inserts.push(
					stmt.bind(
						`${sessionId}::${file.path}::${sym.name}::${sym.lineStart}`,
						sessionId,
						file.path,
						sym.name,
						sym.kind,
						sym.signature,
						sym.lineStart,
						sym.lineEnd,
						sym.parent,
					),
				);
			}
		}

		if (inserts.length > 0) {
			await env.DB.batch(inserts);
		}
	} catch (err) {
		console.error(`[indexer] d1 store failed:`, err);
	}
}

// store repo map in kv
async function storeRepoMap(env: Env, sessionId: string, parsed: ParsedFile[]): Promise<void> {
	const repoMap = parsed.map((f) => ({
		path: f.path,
		language: f.language,
		symbols: f.symbols.map((s) => `${s.kind}:${s.name}`),
	}));

	await env.SUMMARIES.put(
		`${sessionId}::repo_map`,
		JSON.stringify({
			files: repoMap,
			count: repoMap.length,
			totalSymbols: parsed.reduce((n, f) => n + f.symbols.length, 0),
			ts: Date.now(),
		}),
		{ expirationTtl: 86400 * 7 },
	);
}
