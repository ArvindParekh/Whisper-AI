import type { FocusContext } from '@whisper/shared/types/watcher';
// retrieval service - fetches relevant context from vectorize, d1, kv
// all queries scoped by sessionId for data isolation

interface VectorMatch {
	id: string;
	score: number;
	metadata: {
		sessionId: string;
		filePath: string;
		symbolName: string;
		kind: string;
		lineStart: number;
		lineEnd: number;
	};
}

interface CodeChunk {
	filePath: string;
	symbolName: string | null;
	kind: string;
	lineStart: number;
	lineEnd: number;
	score: number;
	content?: string;
}

interface SymbolInfo {
	name: string;
	kind: string;
	signature: string;
	filePath: string;
	lineStart: number;
	lineEnd: number;
}

interface RepoMap {
	files: { path: string; language: string; symbols: string[] }[];
	count: number;
	totalSymbols: number;
}

export interface RetrievalContext {
	chunks: CodeChunk[];
	repoMap: RepoMap | null;
	symbols: SymbolInfo[];
}

export class RetrievalService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async retrieveContext(query: string, sessionId: string, focusContext?: FocusContext): Promise<RetrievalContext> {
		const [chunks, repoMap] = await Promise.all([this.searchVectorize(query, sessionId), this.getRepoMap(sessionId)]);

		// extract potential symbol names from query for d1 lookup
		const symbols = await this.lookupMentionedSymbols(query, sessionId);

		console.log(`[Retrieval] SessionID: ${sessionId} | Found ${chunks.length} chunks, repoMap: ${repoMap ? repoMap.count + ' files (' + repoMap.files.map(f => f.path).join(', ') + ')' : 'null'}, ${symbols.length} symbols`);
		return { chunks, repoMap, symbols };
	}

	// tool methods used by the agentic loop
	async searchCode(query: string, sessionId: string): Promise<string> {
		const chunks = await this.searchVectorize(query, sessionId);
		return chunks
			.map((c) => `${c.filePath}:${c.lineStart}-${c.lineEnd}\n${c.content}`)
			.join('\n\n');
	}

	async listFiles(sessionId: string): Promise<string> {
		const repoMap = await this.getRepoMap(sessionId);
		if (!repoMap) return 'No files found.';
		return repoMap.files.map((f) => f.path).join('\\n');
	}

	private async searchVectorize(query: string, sessionId: string): Promise<CodeChunk[]> {
		try {
			// embed the query
			const embedResult = (await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: [query],
			})) as { data: number[][] };

			const queryVector = embedResult.data[0];

			// search vectorize with session filter
			const results = await this.env.VECTORIZE.query(queryVector!, {
				topK: 5,
				filter: { sessionId },
				returnMetadata: 'all',
			});

			if (results.matches.length === 0) return [];

			// fetch content from d1
			const chunkIds = results.matches.map((m) => (m.metadata as any)?.chunkId).filter(Boolean);

			if (chunkIds.length === 0) return [];

			const placeholders = chunkIds.map(() => '?').join(',');
			const contentResult = await this.env.SYMBOLS_DB.prepare(
				`
      SELECT id, content FROM code_chunks 
      WHERE session_id = ? AND id IN (${placeholders})
    `,
			)
				.bind(sessionId, ...chunkIds)
				.all();

			const contentMap = new Map((contentResult.results || []).map((r: any) => [r.id, r.content]));

			return results.matches.map((match) => {
				const meta = match.metadata as VectorMatch['metadata'];
				return {
					filePath: meta?.filePath || '',
					symbolName: meta?.symbolName || null,
					kind: meta?.kind || 'unknown',
					lineStart: meta?.lineStart || 0,
					lineEnd: meta?.lineEnd || 0,
					score: match.score,
					content: contentMap.get(match.id) || undefined,
				};
			});
		} catch (err) {
			console.error('[retrieval] vectorize search failed:', err);
			return [];
		}
	}

	private async getRepoMap(sessionId: string): Promise<RepoMap | null> {
		try {
			// const key = `${sessionId}::repo_map`;
			// const data = await this.env.CODE_SUMMARIES.get(key);
			// if (!data) return nsull;
			// build repo map from D1 for now
			const result = await this.env.SYMBOLS_DB.prepare(`SELECT file_path, name, kind FROM symbols WHERE session_id = ?`)
				.bind(sessionId)
				.all();

			if (!result.results || result.results.length === 0) return null;

			// group by file
			const fileMap = new Map<string, { path: string; language: string; symbols: string[] }>();
			for (const row of result.results) {
				const filePath = row.file_path as string;
				if (!fileMap.has(filePath)) {
					const ext = filePath.split('.').pop() || '';
					const language = { ts: 'typescript', js: 'javascript', tsx: 'typescript', jsx: 'javascript', py: 'python' }[ext] || ext;
					fileMap.set(filePath, { path: filePath, language, symbols: [] });
				}
				fileMap.get(filePath)!.symbols.push(`${row.kind}:${row.name}`);
			}

			const files = Array.from(fileMap.values());
			return {
				files,
				count: files.length,
				totalSymbols: result.results.length,
			};
		} catch (err) {
			console.error('[retrieval] d1 repo map failed:', err);
			return null;
		}
	}

	private async lookupMentionedSymbols(query: string, sessionId: string): Promise<SymbolInfo[]> {
		try {
			// extract potential symbol names (camelCase, PascalCase, snake_case patterns)
			const symbolPattern = /\b([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*(?:_[a-z][a-zA-Z0-9]*)*)\b/g;
			const potentialSymbols = [...new Set(query.match(symbolPattern) || [])];

			if (potentialSymbols.length === 0) return [];

			// filter out common words
			const commonWords = new Set([
				'the',
				'a',
				'an',
				'is',
				'are',
				'was',
				'were',
				'be',
				'been',
				'being',
				'have',
				'has',
				'had',
				'do',
				'does',
				'did',
				'will',
				'would',
				'could',
				'should',
				'may',
				'might',
				'must',
				'can',
				'this',
				'that',
				'these',
				'those',
				'what',
				'which',
				'who',
				'whom',
				'where',
				'when',
				'why',
				'how',
				'all',
				'each',
				'every',
				'both',
				'few',
				'more',
				'most',
				'other',
				'some',
				'such',
				'no',
				'nor',
				'not',
				'only',
				'own',
				'same',
				'so',
				'than',
				'too',
				'very',
				'just',
				'also',
				'now',
				'here',
				'there',
				'then',
				'once',
				'always',
				'function',
				'class',
				'method',
				'file',
				'code',
				'error',
				'bug',
				'fix',
			]);

			const filtered = potentialSymbols.filter((s) => s.length > 2 && !commonWords.has(s.toLowerCase()));

			if (filtered.length === 0) return [];

			const placeholders = filtered.map(() => '?').join(', ');
			const result = await this.env.SYMBOLS_DB.prepare(
				`
				SELECT name, kind, signature, file_path, line_start, line_end
				FROM symbols
				WHERE session_id = ? AND name IN (${placeholders})
				LIMIT 10
			`,
			)
				.bind(sessionId, ...filtered)
				.all();

			return (result.results || []).map((row) => ({
				name: row.name as string,
				kind: row.kind as string,
				signature: row.signature as string,
				filePath: row.file_path as string,
				lineStart: row.line_start as number,
				lineEnd: row.line_end as number,
			}));
		} catch (err) {
			console.error('[retrieval] d1 lookup failed:', err);
			return [];
		}
	}

	// helper to format context for llm prompt
	formatContextForPrompt(ctx: RetrievalContext): string {
		const parts: string[] = [];

		// repo structure
		if (ctx.repoMap) {
			const fileList = ctx.repoMap.files
				.slice(0, 15)
				.map((f) => `  ${f.path} (${f.symbols.length} symbols)`)
				.join('\n');
			parts.push(`Project structure (${ctx.repoMap.count} files):\n${fileList}`);
		}

		// relevant code chunks
		if (ctx.chunks.length > 0) {
			const codeBlocks = ctx.chunks
				.filter((c) => c.content)
				.map((c) => {
					const header = `// ${c.filePath}:${c.lineStart}-${c.lineEnd} [${c.kind}] ${c.symbolName || 'module'}`;
					return `${header}\n${c.content}`;
				})
				.join('\n\n---\n\n');

			if (codeBlocks) {
				parts.push(`Relevant code:\n\n${codeBlocks}`);
			}
		}

		// symbol signatures - for additional context now
		if (ctx.symbols.length > 0) {
			const sigList = ctx.symbols.map((s) => `  ${s.kind} ${s.name}: ${s.signature}`).join('\n');
			parts.push(`Symbol definitions:\n${sigList}`);
		}

		return parts.join('\n\n');
	}
}
