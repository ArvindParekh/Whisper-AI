import type { ProjectContext } from '@whisper/shared/types/watcher';

export class AIService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async generateResponse(userMessage: string, projectContext: ProjectContext): Promise<string> {
		try {
			if (!this.env.AI) {
				console.error('[AIService] CRITICAL: env.AI binding is missing!');
				return this.buildFallbackResponse(userMessage, projectContext);
			}

			const systemPrompt = this.buildSystemPrompt(projectContext);
			console.log(`[AIService] System prompt length: ${systemPrompt.length} characters`);

			console.log('[AIService] Calling AI with user message:', userMessage);

			// Add timeout to prevent hanging
			const AI_TIMEOUT = 5000; // 5 seconds
			const startTime = Date.now();

			console.log('[AIService] Starting AI.run...');
			const aiPromise = this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-awq', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage },
				],
			});

			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => {
					console.error('[AIService] Timeout triggered!');
					reject(new Error('AI response timeout'));
				}, AI_TIMEOUT),
			);

			const response = (await Promise.race([aiPromise, timeoutPromise])) as { response: string };
			const duration = Date.now() - startTime;

			console.log(`[AIService] AI response received in ${duration}ms`);
			// console.log('[AIService] Full AI response object:', JSON.stringify(response, null, 2));

			if (!response.response || response.response.trim().length === 0) {
				console.error('[AIService] AI returned empty response, using fallback');
				return this.buildFallbackResponse(userMessage, projectContext);
			}

			return response.response;
		} catch (error) {
			console.error('[AIService] Error generating AI response:', error);
			console.error('[AIService] Error details:', error instanceof Error ? error.message : String(error));
			return this.buildFallbackResponse(userMessage, projectContext);
		}
	}

	private buildSystemPrompt(context: ProjectContext): string {
		const fileCount = Object.keys(context.files).length;
		const fileList = Object.keys(context.files);

		// Only include file list, not full content to avoid token limits
		// The previous approach was sending 4530 tokens causing AI to return 0 completion tokens
		return `You are Whisper, an AI pair programming assistant with access to the user's project files.

Project Context:
- Total files: ${fileCount}
- Available files: ${fileList.join(', ')}

You can help the user with coding questions about their project. Keep responses concise and helpful.`;
	}

	private buildFallbackResponse(userMessage: string, context: ProjectContext): string {
		const fileCount = Object.keys(context.files).length;
		const fileList = Object.keys(context.files).slice(0, 5).join(', ');

		return `I can see your project has ${fileCount} files including: ${fileList}. Regarding "${userMessage}" - I'm having trouble with AI processing right now, but I'd be happy to help you analyze your code!`;
	}
}
