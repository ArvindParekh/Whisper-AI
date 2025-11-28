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
		await Promise.all([
			storeVectors(env, sessionId, chunks),
			storeSymbols(env, sessionId, parsed),
			storeChunkContent(env, sessionId, chunks),
		]);

		console.log(`[indexer] done for session ${sessionId}`);
	} catch (err) {
		console.error(`[indexer] failed:`, err);
	}
}

// chunking - one chunk per symbol, + imports
function chunkFile(parsed: ParsedFile, content: string): CodeChunk[] {
	const lines = content.split('\n');
	const chunks: CodeChunk[] = [];

	// imports chunk - find actual line numbers
	if (parsed.imports.length > 0) {
		const importPattern = /^(import|from|const.*require)/;
		let firstImport = -1;
		let lastImport = -1;
		const importContent: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			if (importPattern.test(lines[i].trim())) {
				if (firstImport === -1) firstImport = i + 1;
				lastImport = i + 1;
				importContent.push(lines[i]);
			}
		}

		if (importContent.length > 0) {
			chunks.push({
				id: `${parsed.path}::imports`,
				filePath: parsed.path,
				symbolName: null,
				kind: 'imports',
				content: importContent.join('\n'),
				lineStart: firstImport,
				lineEnd: lastImport,
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

// create short hash for vector IDs (max 64 bytes)
function shortHash(input: string): string {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(36);
}

function makeVectorId(sessionId: string, chunkId: string): string {
	// sessionId is 32 chars, we have 64 max, so ~30 chars for chunk part
	const shortSession = sessionId.slice(0, 16);
	const chunkHash = shortHash(chunkId);
	return `${shortSession}_${chunkHash}_${chunkId.slice(-20)}`.slice(0, 64);
}

// embed chunks and store in vectorize
async function storeVectors(env: Env, sessionId: string, chunks: CodeChunk[]): Promise<void> {
	if (chunks.length === 0) return;
	const BATCH_SIZE = 20;

	for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
		const batch = chunks.slice(i, i + BATCH_SIZE);
		const texts = batch.map((c) => `${c.context}\n\n${c.content}`.slice(0, 2000));

		try {
			const result = (await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: texts })) as { data: number[][] };

			const vectors = batch.map((chunk, idx) => ({
				id: makeVectorId(sessionId, chunk.id),
				values: result.data[idx],
				metadata: {
					sessionId,
					chunkId: chunk.id,
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
	const totalSymbols = parsed.reduce((n, f) => n + f.symbols.length, 0);
	if (totalSymbols === 0) return;

	try {
		// ensure table exists
		await env.DB.prepare(
			`
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
			)
		`,
		).run();

		await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_session ON symbols(session_id)').run();
		await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_name ON symbols(name)').run();
		await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_file ON symbols(session_id, file_path)').run();

		// clear old symbols only for files being updated
		for (const file of parsed) {
			await env.DB.prepare('DELETE FROM symbols WHERE session_id = ? AND file_path = ?').bind(sessionId, file.path).run();
		}

		// batch insert
		const stmt = env.DB.prepare(`
			INSERT OR REPLACE INTO symbols (id, session_id, file_path, name, kind, signature, line_start, line_end, parent)
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

async function storeChunkContent(env: Env, sessionId: string, chunks: CodeChunk[]): Promise<void> {
	if (chunks.length === 0) return;

	try {
		await env.DB.prepare(
			`
		CREATE TABLE IF NOT EXISTS code_chunks (
		  id TEXT PRIMARY KEY,
		  session_id TEXT NOT NULL,
		  file_path TEXT NOT NULL,
		  symbol_name TEXT,
		  kind TEXT NOT NULL,
		  line_start INTEGER,
		  line_end INTEGER,
		  content TEXT NOT NULL
		)
	  `,
		).run();

		await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_chunks_session ON code_chunks(session_id)').run();

		// clear old chunks for files being updated
		const filePaths = [...new Set(chunks.map((c) => c.filePath))];
		for (const fp of filePaths) {
			await env.DB.prepare('DELETE FROM code_chunks WHERE session_id = ? AND file_path = ?').bind(sessionId, fp).run();
		}

		// batch insert
		const stmt = env.DB.prepare(`
		INSERT INTO code_chunks (id, session_id, file_path, symbol_name, kind, line_start, line_end, content)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	  `);

		await env.DB.batch(chunks.map((c) => stmt.bind(c.id, sessionId, c.filePath, c.symbolName, c.kind, c.lineStart, c.lineEnd, c.content)));

		console.log(`[indexer] stored ${chunks.length} chunks in D1`);
	} catch (err) {
		console.error('[indexer] chunk storage failed:', err);
	}
}

// store repo map in kv
async function storeRepoMap(env: Env, sessionId: string, parsed: ParsedFile[]): Promise<void> {
	if (parsed.length === 0) return; // don't update if nothing parsed

	const key = `${sessionId}::repo_map`;

	let existingFiles: { path: string; language: string; symbols: string[] }[] = [];
	try {
		const existing = await env.SUMMARIES.get(key);
		if (existing) {
			const data = JSON.parse(existing);
			existingFiles = data.files || [];
		}
	} catch {
		// ignore parse errors - start fresh
	}

	const newFiles = parsed.map((f) => ({
		path: f.path,
		language: f.language,
		symbols: f.symbols.map((s) => `${s.kind}:${s.name}`),
	}));

	const fileMap = new Map(existingFiles.map((f) => [f.path, f]));
	for (const file of newFiles) {
		fileMap.set(file.path, file);
	}

	const mergedFiles = Array.from(fileMap.values());

	await env.SUMMARIES.put(
		key,
		JSON.stringify({
			files: mergedFiles,
			count: mergedFiles.length,
			totalSymbols: mergedFiles.reduce((n, f) => n + f.symbols.length, 0),
			ts: Date.now(),
		}),
		{ expirationTtl: 86400 * 7 },
	);
}
