import { DurableObject } from "cloudflare:workers";
import { CodeAnalysisResult } from "../agents/code-quality-agent";

export interface AnalysisSession {
  id: string;
  userId?: string;
  createdAt: number;
  lastActivity: number;
  analyses: CodeAnalysisResult[];
  totalAnalyses: number;
  averageScore: number;
}

/**
 * Durable Object for managing code quality analysis state
 * Stores analysis history, user sessions, and quality metrics over time
 */
export class QualityAnalysisState extends DurableObject {
  private sessions: Map<string, AnalysisSession> = new Map();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      try {
        // Load existing sessions from storage
        const stored = await this.ctx.storage.get<Map<string, AnalysisSession>>("sessions");
        if (stored) {
          this.sessions = stored;
        }
        console.log(`QualityAnalysisState initialized with ${this.sessions.size} sessions`);
      } catch (error) {
        console.error('Error initializing QualityAnalysisState:', error);
        // Initialize with empty state on error
        this.sessions = new Map();
      }
    });
  }

  /**
   * Create or get a session for analysis tracking
   */
  async getSession(sessionId: string, userId?: string): Promise<AnalysisSession> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      session = {
        id: sessionId,
        userId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        analyses: [],
        totalAnalyses: 0,
        averageScore: 0,
      };
      this.sessions.set(sessionId, session);
      await this.saveState();
    } else {
      // Update last activity
      session.lastActivity = Date.now();
      await this.saveState();
    }

    return session;
  }

  /**
   * Save a new code analysis result
   */
  async saveAnalysis(sessionId: string, analysis: CodeAnalysisResult): Promise<void> {
    try {
      if (!sessionId || !analysis) {
        throw new Error('Session ID and analysis result are required');
      }

      const session = await this.getSession(sessionId);
      
      // Validate analysis structure
      if (typeof analysis.overallScore !== 'number' || analysis.overallScore < 0 || analysis.overallScore > 100) {
        console.warn('Invalid analysis score, using default value');
        analysis.overallScore = 50; // Default neutral score
      }
      
      // Add the analysis to the session
      session.analyses.push(analysis);
      session.totalAnalyses += 1;
      session.lastActivity = Date.now();
      
      // Update average score
      const totalScore = session.analyses.reduce((sum, a) => sum + (a.overallScore || 50), 0);
      session.averageScore = Math.round(totalScore / session.totalAnalyses);
      
      // Keep only the last 50 analyses to prevent unbounded growth
      if (session.analyses.length > 50) {
        session.analyses = session.analyses.slice(-50);
      }

      await this.saveState();
      console.log(`Analysis saved for session ${sessionId}, total analyses: ${session.totalAnalyses}`);
    } catch (error) {
      console.error(`Error saving analysis for session ${sessionId}:`, error);
      throw new Error(`Failed to save analysis: ${(error as Error).message}`);
    }
  }

  /**
   * Get analysis history for a session
   */
  async getAnalysisHistory(sessionId: string, limit: number = 10): Promise<CodeAnalysisResult[]> {
    try {
      if (!sessionId) {
        console.warn('getAnalysisHistory called without sessionId');
        return [];
      }

      // Validate limit parameter
      const validLimit = Math.max(1, Math.min(limit, 100)); // Between 1 and 100
      
      const session = this.sessions.get(sessionId);
      if (!session) {
        console.log(`No session found for ${sessionId}, returning empty history`);
        return [];
      }

      const history = session.analyses.slice(-validLimit);
      console.log(`Retrieved ${history.length} analyses from session ${sessionId}`);
      return history;
    } catch (error) {
      console.error(`Error retrieving analysis history for session ${sessionId}:`, error);
      return [];
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<{
    totalAnalyses: number;
    averageScore: number;
    lastActivity: number;
    createdAt: number;
    securityIssuesFound: number;
    performanceIssuesFound: number;
    qualityIssuesFound: number;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        totalAnalyses: 0,
        averageScore: 0,
        lastActivity: 0,
        createdAt: 0,
        securityIssuesFound: 0,
        performanceIssuesFound: 0,
        qualityIssuesFound: 0,
      };
    }

    // Calculate aggregate issue counts
    const securityIssuesFound = session.analyses.reduce(
      (sum, a) => sum + a.securityIssues.length, 0
    );
    const performanceIssuesFound = session.analyses.reduce(
      (sum, a) => sum + a.performanceIssues.length, 0
    );
    const qualityIssuesFound = session.analyses.reduce(
      (sum, a) => sum + a.qualityIssues.length, 0
    );

    return {
      totalAnalyses: session.totalAnalyses,
      averageScore: session.averageScore,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      securityIssuesFound,
      performanceIssuesFound,
      qualityIssuesFound,
    };
  }

  /**
   * Clean up old sessions (called periodically)
   */
  async cleanupOldSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now();
    let removedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAgeMs) {
        this.sessions.delete(sessionId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveState();
    }

    return removedCount;
  }

  /**
   * Handle HTTP requests to the Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') || 'default';

    try {
      switch (url.pathname) {
        case '/session':
          if (request.method === 'GET') {
            const session = await this.getSession(sessionId);
            return new Response(JSON.stringify(session), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;

        case '/analysis':
          if (request.method === 'POST') {
            const analysis = await request.json() as CodeAnalysisResult;
            await this.saveAnalysis(sessionId, analysis);
            return new Response(JSON.stringify({ success: true }), {
              headers: { 'Content-Type': 'application/json' }
            });
          } else if (request.method === 'GET') {
            const limit = parseInt(url.searchParams.get('limit') || '10');
            const history = await this.getAnalysisHistory(sessionId, limit);
            return new Response(JSON.stringify(history), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;

        case '/stats':
          if (request.method === 'GET') {
            const stats = await this.getSessionStats(sessionId);
            return new Response(JSON.stringify(stats), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;

        case '/cleanup':
          if (request.method === 'POST') {
            const maxAge = parseInt(url.searchParams.get('maxAge') || '604800000'); // 7 days
            const removedCount = await this.cleanupOldSessions(maxAge);
            return new Response(JSON.stringify({ removedSessions: removedCount }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          break;

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Durable Object error:', error);
      return new Response('Internal Server Error: ' + (error as Error).message, { 
        status: 500 
      });
    }

    return new Response('Method Not Allowed', { status: 405 });
  }

  /**
   * Save state to persistent storage
   */
  private async saveState(): Promise<void> {
    try {
      await this.ctx.storage.put("sessions", this.sessions);
      console.log(`State saved successfully, ${this.sessions.size} sessions`);
    } catch (error) {
      console.error('Error saving state to persistent storage:', error);
      // Re-throw to ensure calling code knows about the failure
      throw new Error(`Failed to save state: ${(error as Error).message}`);
    }
  }
}
