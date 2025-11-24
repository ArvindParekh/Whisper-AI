import { RealtimeAgent, TextComponent, RealtimeKitTransport, DeepgramSTT, ElevenLabsTTS } from '@cloudflare/realtime-agents';
import { AIService } from '../services/AIService';
import { StateManagerService } from '../services/StateManagerService';
import type { ConversationMessage, ProjectContext, SessionStats, syncFileType, syncFileResponseBody } from '@whisper/shared/types/watcher';

class WhisperTextProcessor extends TextComponent {
	private aiService: AIService;
	private stateManagerService: StateManagerService;

	constructor(env: Env, stateManagerService: StateManagerService) {
		super();
		this.aiService = new AIService(env);
		this.stateManagerService = stateManagerService;
	}

	async speak(text: string, contextId?: string) {
		console.log(`[Agent] Speaking: "${text}"`);
		console.error(`[Agent] Speaking: "${text}"`);
		await super.speak(text, contextId);
	}

	async onTranscript(text: string, reply: (text: string) => void) {
		// Log IMMEDIATELY - even before any checks
		console.log(`[Agent] *** onTranscript CALLED *** text="${text}" length=${text?.length || 0}`);
		console.error(`[Agent] *** onTranscript CALLED *** text="${text}" length=${text?.length || 0}`);
		
		console.log(`[Agent] Received transcript: "${text}"`);
		console.error(`[Agent] Received transcript: "${text}"`);
		if (!text || text.trim().length === 0) {
			console.log('[Agent] Empty transcript received, ignoring');
			return;
		}
		try {
			const context = await this.stateManagerService.getProjectContext();
			// console.log('Context is: ', context);
			const aiResponse = await this.aiService.generateResponse(text, context);

			console.log(`[Agent] AI response: "${aiResponse}"`);
			console.error(`[Agent] AI response: "${aiResponse}"`);
			reply(aiResponse);

			await this.addConversationMessages(text, aiResponse);
		} catch (error) {
			console.error('[Agent] Error generating AI response:', error);
			reply('Sorry, I encountered an error processing your request.');
		}
	}

	private async addConversationMessages(text: string, aiResponse: string) {
		try {
			await this.stateManagerService.addConversationMessage('user', text);
			await this.stateManagerService.addConversationMessage('assistant', aiResponse);
		} catch (error) {
			console.error('[Agent] Error adding conversation messages:', error);
		}
	}
}

export class WhisperSessionDurableObject extends RealtimeAgent<Env> {
	private stateManagerService: StateManagerService;
	private rtkTransport: RealtimeKitTransport | undefined;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.stateManagerService = new StateManagerService(ctx);
	}

	// ===== SESSION STATE METHODS =====
	async syncFile(filePath: string, fileContent: string, type: syncFileType, timestamp: number): Promise<syncFileResponseBody> {
		return this.stateManagerService.syncFile(filePath, fileContent, type, timestamp);
	}

	async getProjectContext(): Promise<ProjectContext> {
		return this.stateManagerService.getProjectContext();
	}

	async getConversationHistory(limit?: number): Promise<ConversationMessage[]> {
		return this.stateManagerService.getConversationHistory(limit);
	}

	async getSessionStats(): Promise<SessionStats> {
		return this.stateManagerService.getSessionStats();
	}

	async clearSession(): Promise<void> {
		return this.stateManagerService.clearSession();
	}

	// ===== VOICE/MEETING METHODS =====
	async init(
		agentId: string,
		meetingId: string,
		authToken: string,
		workerUrlHost: string,
		accountId: string,
		apiToken: string,
	): Promise<void> {
		console.log('[Agent] Starting init');
		console.error('[Agent] Starting init with params:', {
			agentId,
			meetingId,
			workerUrlHost,
			hasDeepgramKey: !!this.env.DEEPGRAM_API_KEY,
			hasElevenLabsKey: !!this.env.ELEVENLABS_API_KEY,
			hasAccountId: !!accountId,
			hasApiToken: !!apiToken,
		});

		// If we are already connected or have a transport, clean it up to ensure a fresh start
		if (this.rtkTransport || this.rtkTransport?.meeting?.self?.roomState === 'joined') {
			console.warn('[Agent] Found existing session, deinitializing for fresh start');
			try {
				await this.deinit();
				// Also explicitly clear the transport reference if deinit didn't
				if (this.rtkTransport) {
					await this.rtkTransport.meeting.leave();
					this.rtkTransport = undefined;
				}
			} catch (err) {
				console.warn('[Agent] Error during cleanup:', err);
				// Force clear transport
				this.rtkTransport = undefined;
			}
		}

		try {
			// Validate required environment variables
			if (!this.env.DEEPGRAM_API_KEY) {
				throw new Error('DEEPGRAM_API_KEY is not set');
			}
			if (!this.env.ELEVENLABS_API_KEY) {
				throw new Error('ELEVENLABS_API_KEY is not set');
			}
			if (!accountId) {
				throw new Error('Account ID is not provided');
			}
			if (!apiToken) {
				throw new Error('API Token is not provided');
			}

			console.log('[Agent] Creating text processor and transport');
			const textProcessor = new WhisperTextProcessor(this.env, this.stateManagerService);
			// Use default transport filters (library defaults handle in/out streams)
			this.rtkTransport = new RealtimeKitTransport(meetingId, authToken);

			console.log('[Agent] Initializing pipeline');
			console.error('[Agent] Initializing pipeline with components', {
				agentId,
				workerUrlHost,
				accountId: accountId.substring(0, 8) + '...',
			});

			try {
				console.log('[Agent] Initializing pipeline with components (matching official example)');
				await this.initPipeline(
					[
						this.rtkTransport,
						new DeepgramSTT(this.env.DEEPGRAM_API_KEY),
						textProcessor,
						new ElevenLabsTTS(
							this.env.ELEVENLABS_API_KEY,
							(this.env as any).ELEVENLABS_VOICE_ID ? { voice_id: (this.env as any).ELEVENLABS_VOICE_ID } : undefined,
						),
						this.rtkTransport,
					],
					agentId,
					workerUrlHost,
					accountId,
					apiToken,
				);
				console.log('[Agent] initPipeline completed successfully');
				console.error('[Agent] initPipeline completed successfully');
			} catch (pipelineError) {
				console.error('[Agent] initPipeline failed:', pipelineError);
				throw pipelineError;
			}

			console.log('[Agent] Pipeline initialized, setting up meeting handlers');
			const { meeting } = this.rtkTransport;

		// Set up event handlers exactly like official Cloudflare example
		meeting.participants.joined.on('participantJoined', (participant) => {
			textProcessor.speak(`Participant Joined ${participant.name}`);
		});
		
		meeting.participants.joined.on('participantLeft', (participant) => {
			textProcessor.speak(`Participant Left ${participant.name}`);
		});

		// Join the meeting (official example does this AFTER setting up handlers)
		await meeting.join();

		// Send initial chat message
		await meeting.chat.sendTextMessage('Hello, how are you?');

		console.log('[Agent] Init complete');
	} catch (error) {
		console.error('[Agent] Error during init:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`Failed to initialize agent: ${errorMessage}`);
	}
}

	async deinit(): Promise<void> {
		console.log('[Agent] Deinitializing voice pipeline...');
		await this.deinitPipeline();
		console.log('[Agent] Voice pipeline deinitialized successfully');
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		console.log('[Agent] WebSocket message received');
		console.error('[Agent] WebSocket message received');
		
		// Debug: Check what we have before calling parent
		console.error('[Agent] DEBUG: pipeline exists?', !!this.pipeline);
		console.error('[Agent] DEBUG: pipeline components count:', this.pipeline?.components?.length || 0);
		
		if (this.pipeline?.components) {
			console.error('[Agent] DEBUG: Component types:', this.pipeline.components.map(c => c.constructor.name));
			
			// Check if TextComponent can be found
			const textProcessor = this.pipeline.components.filter((c) => c instanceof TextComponent)[0];
			console.error('[Agent] DEBUG: textProcessor found via instanceof?', !!textProcessor);
			console.error('[Agent] DEBUG: textProcessor type:', textProcessor?.constructor?.name);
		}
		
		try {
			if (typeof message === 'string') {
				console.log('[Agent] WebSocket message payload:', message);
				console.error('[Agent] WebSocket message payload:', message);
				
				// Parse and debug the message structure
				try {
					const parsed = JSON.parse(message);
					console.error('[Agent] DEBUG: Parsed message type:', parsed.type);
					console.error('[Agent] DEBUG: Has payload?', !!parsed.payload);
					console.error('[Agent] DEBUG: payload.data:', parsed.payload?.data);
					console.error('[Agent] DEBUG: payload.context_id:', parsed.payload?.context_id);
				} catch (parseErr) {
					console.error('[Agent] DEBUG: Failed to parse message as JSON:', parseErr);
				}
			} else {
				console.log('[Agent] WebSocket binary message received, length:', message.byteLength);
				console.error('[Agent] WebSocket binary message received, length:', message.byteLength);
			}
		} catch (err) {
			console.error('[Agent] Error logging WebSocket message:', err);
		}
		
		// CRITICAL: Call parent implementation to trigger onTranscript callback
		console.error('[Agent] DEBUG: About to call super.webSocketMessage...');
		try {
			await super.webSocketMessage(ws, message);
			console.error('[Agent] DEBUG: super.webSocketMessage completed successfully');
		} catch (superErr) {
			console.error('[Agent] ERROR: super.webSocketMessage threw error:', superErr);
			throw superErr;
		}
	}
}
