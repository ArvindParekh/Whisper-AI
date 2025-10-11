import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from '@whisper/shared/types/watcher';

interface SessionState {
	files: Map<string, { content: string; lastModified: number }>;
	conversationHistory: ConversationMessage[];
	createdAt: number;
	lastActivity: number;
}

export class SessionService {
	private ctx: DurableObjectState;
	private sessionState: SessionState | null = null;

	constructor(ctx: DurableObjectState) {
		this.ctx = ctx;
	}

	private async ensureSessionState(): Promise<SessionState> {
		if (!this.sessionState) {
			const stored = await this.ctx.storage.get<SessionState>('sessionState');

			if (stored) {
				this.sessionState = {
					...stored,
					files: new Map(Object.entries(stored.files || {})),
					lastActivity: Date.now(),
				};
			} else {
				this.sessionState = {
					files: new Map(),
					conversationHistory: [],
					createdAt: Date.now(),
					lastActivity: Date.now(),
				};
			}
		}

		this.sessionState.lastActivity = Date.now();
		return this.sessionState;
	}

	private async saveSessionState(): Promise<void> {
		if (this.sessionState) {
			const stateToSave = {
				...this.sessionState,
				files: Object.fromEntries(this.sessionState.files),
			};
			await this.ctx.storage.put('sessionState', stateToSave);
		}
	}

	async syncFile(
		filePath: string,
		fileContent: string,
		type: syncFileType,
		timestamp: number,
	): Promise<syncFileResponseBody> {
		try {
			const state = await this.ensureSessionState();

			switch (type) {
				case 'add':
				case 'change':
					state.files.set(filePath, { content: fileContent, lastModified: timestamp });
					break;
				case 'delete':
					state.files.delete(filePath);
					break;
				default:
					throw new Error(`Unknown sync type: ${type}`);
			}

			await this.saveSessionState();

			return {
				success: true,
				message: `File ${type} operation completed for ${filePath}`,
			};
		} catch (error) {
			return {
				success: false,
				message: `Failed to sync file: ${error instanceof Error ? error.message : 'Unknown error'}`,
			};
		}
	}

	async getProjectContext(): Promise<ProjectContext> {
		const state = await this.ensureSessionState();
		return {
			files: Object.fromEntries(state.files),
		};
	}

	async addConversationMessage(
		type: 'user' | 'assistant',
		content: string,
		metadata?: Record<string, any>,
	): Promise<void> {
		const state = await this.ensureSessionState();

		const message: ConversationMessage = {
			id: crypto.randomUUID(),
			type,
			content,
			timestamp: Date.now(),
			...(metadata && { metadata }),
		};

		state.conversationHistory.push(message);
		await this.saveSessionState();
	}

	async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
		const state = await this.ensureSessionState();
		const history = state.conversationHistory;

		if (limit && limit > 0) {
			return history.slice(-limit);
		}

		return history;
	}

	async getSessionStats(): Promise<SessionStats> {
		const state = await this.ensureSessionState();

		return {
			filesCount: state.files.size,
			conversationLength: state.conversationHistory.length,
			createdAt: state.createdAt,
			lastActivity: state.lastActivity,
		};
	}

	async clearSession(): Promise<void> {
		await this.ctx.storage.delete('sessionState');
		this.sessionState = null;
	}
}
