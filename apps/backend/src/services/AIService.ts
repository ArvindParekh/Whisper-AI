import type { ProjectContext } from '@whisper/shared/types/watcher';
import { ContextService } from './ContextService';

export class AIService {
	private env: Env;
	private contextService: ContextService;

	constructor(env: Env) {
		this.env = env;
		this.contextService = new ContextService();
	}

	async generateResponse(userMessage: string, projectContext: ProjectContext): Promise<string> {
		try {
			const systemPrompt = this.contextService.buildSystemPrompt(projectContext);

			const response = (await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userMessage },
				],
			})) as { response: string };

			return response.response || 'I apologize, but I encountered an issue generating a response.';
		} catch (error) {
			console.error('Error generating AI response:', error);
			return this.contextService.buildFallbackResponse(userMessage, projectContext);
		}
	}
}
