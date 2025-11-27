import type { RetrievalContext } from './RetrievalService';

export class AIService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async generateResponse(userMessage: string, context: RetrievalContext): Promise<string> {
		try {
			if (!this.env.AI) {
				console.error('[AIService] CRITICAL: env.AI binding is missing!');
				return this.buildFallbackResponse(userMessage, context);
			}

			const systemPrompt = this.buildSystemPrompt(context);
			console.log(`[AIService] System prompt length: ${systemPrompt.length} characters`);

			console.log('[AIService] Calling AI with user message:', userMessage);

			// Add timeout to prevent hanging
			const AI_TIMEOUT = 8000; // 8 seconds
			const startTime = Date.now();

			console.log('[AIService] Starting AI.run...');
			const aiPromise = this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-awq', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage },
				],
			});

			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('AI timeout')), AI_TIMEOUT),
			);

			const response = (await Promise.race([aiPromise, timeoutPromise])) as { response: string };
			console.log(`[AIService] AI response received in ${Date.now() - startTime}ms`);

			if (!response.response?.trim()) {
				console.error('[AIService] Empty response from AI');
				return this.buildFallbackResponse(userMessage, context);
			}

			return response.response;
		} catch (error) {
			console.error('[AIService] Error:', error instanceof Error ? error.message : error);
			return this.buildFallbackResponse(userMessage, context);
		}
	}

	private buildSystemPrompt(ctx: RetrievalContext): string {
		const parts: string[] = [];

		parts.push('You are Whisper, an AI pair programming assistant. Answer concisely based on the context provided.');

		// project structure from repo map
		if (ctx.repoMap) {
			const files = ctx.repoMap.files.slice(0, 20).map((f) => f.path).join(', ');
			parts.push(`\nProject: ${ctx.repoMap.count} files, ${ctx.repoMap.totalSymbols} symbols`);
			parts.push(`Files: ${files}`);
		}

		// relevant code locations from vector search
		if (ctx.chunks.length > 0) {
			parts.push('\nRelevant code:');
			for (const chunk of ctx.chunks) {
				const name = chunk.symbolName || 'module';
				parts.push(`- ${chunk.filePath}:${chunk.lineStart}-${chunk.lineEnd} [${chunk.kind}] ${name}`);
			}
		}

		// symbol definitions from d1
		if (ctx.symbols.length > 0) {
			parts.push('\nSymbol definitions:');
			for (const sym of ctx.symbols) {
				parts.push(`- ${sym.kind} ${sym.name}: ${sym.signature}`);
			}
		}

		return parts.join('\n');
	}

	private buildFallbackResponse(userMessage: string, ctx: RetrievalContext): string {
		const fileCount = ctx.repoMap?.count || 0;
		const files = ctx.repoMap?.files.slice(0, 3).map((f) => f.path).join(', ') || 'none';

		return `I can see ${fileCount} files (${files}). Regarding "${userMessage}" - I'm having trouble with AI processing, but I can help analyze your code!`;
	}
}
