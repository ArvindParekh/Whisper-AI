import type { ProjectContext } from '@whisper/shared/types/watcher';

export class ContextService {
	buildSystemPrompt(context: ProjectContext): string {
		const fileCount = Object.keys(context.files).length;
		const fileList = Object.keys(context.files).slice(0, 5);

		return `You are an AI pair programming assistant with access to the user's project files.

                Project Context:
                - Total files: ${fileCount}
                - Key files: ${fileList.join(', ')}

                File contents preview:
                ${fileList
                    .map((filename) => {
                        const file = context.files[filename];
                        if (!file) return `${filename}: (file not found)`;
                        const preview = file.content.substring(0, 500);
                        return `${filename}:\n${preview}${file.content.length > 500 ? '...' : ''}`;
                    })
                    .join('\n\n')}

                Please help the user with their coding question in the context of this project.`;
	}

	buildFallbackResponse(userMessage: string, context: ProjectContext): string {
		const fileCount = Object.keys(context.files).length;
		const fileList = Object.keys(context.files).slice(0, 5).join(', ');

		return `I can see your project has ${fileCount} files including: ${fileList}. Regarding "${userMessage}" - I'm having trouble with AI processing right now, but I'd be happy to help you analyze your code!`;
	}
}
