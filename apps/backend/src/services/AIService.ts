import type { RetrievalContext, RetrievalService } from './RetrievalService';
import type { StateManagerService } from './StateManagerService';
import type { FocusContext } from '@whisper/shared/types/watcher';

export class AIService {
	private env: Env;
	private retrievalService: RetrievalService;
	private stateManagerService: StateManagerService;

	constructor(env: Env, retrievalService: RetrievalService, stateManagerService: StateManagerService) {
		this.env = env;
		this.retrievalService = retrievalService;
		this.stateManagerService = stateManagerService;
	}

	async generateResponse(userMessage: string, context: RetrievalContext, sessionId: string, focusContext?: FocusContext): Promise<string> {
		if (!this.env.AI) {
			console.error('[AIService] CRITICAL: env.AI binding is missing!');
			return this.buildFallbackResponse(userMessage, context);
		}

		const MAX_TURNS = 5;
		const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

		// this is beautiful! transform the ai from a passive answer generator into an agentic loop that can make tool calls to explore codebase and answer questions - sort of like how cursor does it!
		// 1. build initial system prompt with tools
		const systemPrompt = this.buildSystemPrompt(context, focusContext);
		messages.push({ role: 'system', content: systemPrompt });
		messages.push({ role: 'user', content: userMessage });

		console.log('[AIService] Starting Agentic Loop...');

		for (let turn = 0; turn < MAX_TURNS; turn++) {
			try {
				// 2. call ai with messages array
				const response = await this.callAI(messages);
				console.log(`[AIService] Turn ${turn + 1} response:`, response.slice(0, 100));

				// 3. check for tool call in ai's current response
				const toolCall = this.parseToolCall(response);

				if (!toolCall) {
					return response; // the final answer
				}

				// 4. if tool call found, execute tool and add result to messages array
				console.log(`[AIService] Executing tool: ${toolCall.name} with args: ${toolCall.args}`);
				messages.push({ role: 'assistant', content: response });

				const toolResult = await this.executeTool(toolCall.name, toolCall.args, sessionId);
				messages.push({ role: 'user', content: `Tool Output:\n${toolResult}` });
			} catch (error) {
				console.error('[AIService] Error in loop:', error);
				return 'I encountered an error while processing your request.';
			}
		}

		return "I reached my step limit and couldn't find a final answer.";
	}

	private async callAI(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]): Promise<string> {
		const response = (await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages,
		})) as { response: string };
		return response.response;
		// todo: better would be to make ai return structured outputs containing tool calls, text response, and other metadata - need a better model :(
	}

	private parseToolCall(response: string): { name: string; args: string } | null {
		// pattern: [TOOL: tool_name "args"]
		const match = response.match(/\[TOOL:\s*(\w+)(?:\s+"([^"]*)")?\]/);
		if (match) {
			return { name: match[1] || '', args: match[2] || '' };
		}
		return null;
	}

	private async executeTool(name: string, args: string, sessionId: string): Promise<string> {
		try {
			switch (name) {
				case 'read_file':
					const content = await this.stateManagerService.getFile(args);
					return content ? `Content of ${args}:\n${content}` : `File ${args} not found.`;
				case 'search_code':
					return await this.retrievalService.searchCode(args, sessionId);
				case 'list_files':
					return await this.retrievalService.listFiles(sessionId, args || undefined);
				default:
					return `Unknown tool: ${name}`;
			}
		} catch (err) {
			return `Error executing tool ${name}: ${err instanceof Error ? err.message : String(err)}`;
		}
	}

	private buildSystemPrompt(ctx: RetrievalContext, focus?: FocusContext): string {
		const parts: string[] = [];

		parts.push(
			'You are Whisper, an AI pair programming assistant with cursor-level awareness.',
			'You can use tools to explore the codebase. To use a tool, output a single line: [TOOL: tool_name "arguments"]',
			'Available Tools:',
			'- read_file "path/to/file": Read full file content.',
			'- search_code "query": Search for code snippets.',
			'- list_files "path": List files in the project.',
			'',
			'Examples:',
			'- User: "What files do I have?" -> [TOOL: list_files ""]',
			'- User: "What does auth.ts do?" -> [TOOL: read_file "src/auth.ts"]',
			'',
			'When you have the answer, just reply normally without the tool tag.',
			'If the user asks a question that can be answered by the "Project Files" list below, answer directly.',
		);

		if (focus) {
			parts.push('\n--- FOCUS CONTEXT ---', `User is looking at: ${focus.filePath}`);
			if (focus.selectionContent) {
				// this won't be available as long as we're using chokidar - need to shift to vscode extension for this
				parts.push(`Selection:\n${focus.selectionContent}`);
			} else {
				// maybe we can show the code around user's cursor position?
				// todo: think about this
			}
		}

		// project structure from repo map
		if (ctx.repoMap?.files) {
			const files = ctx.repoMap.files
				.filter((f) => !f.path.includes('node_modules'))
				.slice(0, 50)
				.map((f) => f.path)
				.join(', ');
			parts.push(`\n--- PROJECT FILES ---\nYou have access to the following files in the project:\n${files}`);
		} else {
			parts.push('\nNo files found in the project repository map.');
		}

		// relevant code content from vector search
		const chunksWithContent = ctx.chunks.filter((c) => c.content);
		if (chunksWithContent.length > 0) {
			parts.push('\n--- RELEVANT CODE ---');
			for (const chunk of chunksWithContent.slice(0, 3)) {
				const header = `// ${chunk.filePath}:${chunk.lineStart}-${chunk.lineEnd} [${chunk.kind}] ${chunk.symbolName || 'module'}`;
				parts.push(`\n${header}\n${chunk.content}`);
			}
		}

		return parts.join('\n');
	}

	private buildFallbackResponse(userMessage: string, ctx: RetrievalContext): string {
		return "I'm having trouble connecting to the AI model.";
	}
}
