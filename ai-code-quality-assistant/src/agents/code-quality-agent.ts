import { AIChatAgent } from "agents/ai-chat-agent";
import { createTextStreamResponse, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// Code analysis result schema
const CodeAnalysisSchema = z.object({
  securityIssues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    issue: z.string(),
    line: z.number().optional(),
    suggestion: z.string(),
  })),
  performanceIssues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    issue: z.string(),
    line: z.number().optional(),
    suggestion: z.string(),
  })),
  qualityIssues: z.array(z.object({
    severity: z.enum(['low', 'medium', 'high']),
    issue: z.string(),
    line: z.number().optional(),
    suggestion: z.string(),
  })),
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
});

export type CodeAnalysisResult = z.infer<typeof CodeAnalysisSchema>;

export interface Env {
  OPENAI_API_KEY?: string;
  AI_GATEWAY_ACCOUNT_ID?: string;
  AI_GATEWAY_ID?: string;
  QUALITY_ANALYSIS_STATE: DurableObjectNamespace;
  AI: Ai; // Workers AI binding
}

export class CodeQualityAgent extends AIChatAgent<Env> {
  private getModel() {
    // Use AI Gateway if configured, otherwise direct OpenAI
    const baseURL = this.env.AI_GATEWAY_ACCOUNT_ID && this.env.AI_GATEWAY_ID
      ? `https://gateway.ai.cloudflare.com/v1/${this.env.AI_GATEWAY_ACCOUNT_ID}/${this.env.AI_GATEWAY_ID}/openai`
      : undefined;

    return openai("gpt-4", {
      apiKey: this.env.OPENAI_API_KEY || "dummy-key",
      baseURL,
    });
  }

  /**
   * Use Workers AI for code analysis (Llama 3.3)
   */
  private async analyzeWithWorkersAI(code: string, analysisType: string): Promise<string> {
    const systemPrompt = `You are an expert code quality analyst. Analyze the following code for ${analysisType} and provide detailed feedback in a structured format.

Focus on:
- Specific issues with line numbers when possible
- Severity levels (low, medium, high, critical)
- Actionable suggestions for improvement
- Best practices recommendations

Respond in a clear, structured format that a developer can easily understand and act upon.`;

    const prompt = `${systemPrompt}\n\nCode to analyze:\n\`\`\`\n${code}\n\`\`\``;

    try {
      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this code:\n\n${code}` }
        ],
        max_tokens: 2048,
        temperature: 0.1, // Lower temperature for more consistent analysis
      });

      return (response as any).response || "Analysis completed but no response received.";
    } catch (error) {
      console.error("Workers AI analysis error:", error);
      return `Analysis error: ${(error as Error).message}`;
    }
  }

  async onChatMessage(onFinish: any) {
    return createTextStreamResponse({
      execute: async (dataStream) => {
        // Check if this is a code analysis request
        const lastMessage = this.messages[this.messages.length - 1];
        const isCodeAnalysisRequest = this.isCodeAnalysisRequest(lastMessage.content);

        if (isCodeAnalysisRequest) {
          // Perform detailed code analysis
          await this.performCodeAnalysis(lastMessage.content, dataStream, onFinish);
        } else {
          // Regular chat interaction
          await this.performRegularChat(dataStream, onFinish);
        }
      },
    });
  }

  private isCodeAnalysisRequest(content: string): boolean {
    const codeAnalysisKeywords = [
      'analyze', 'review', 'check', 'audit', 'security', 'performance', 
      'quality', 'vulnerability', 'optimize', 'improve', 'bug', 'issue'
    ];
    
    const hasCode = /```[\s\S]*```/.test(content) || content.includes('function') || content.includes('class');
    const hasAnalysisKeyword = codeAnalysisKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    return hasCode || hasAnalysisKeyword;
  }

  private async performCodeAnalysis(content: string, dataStream: any, onFinish: any) {
    try {
      // Extract code from the content
      const codeMatch = content.match(/```[\s\S]*?```/);
      const code = codeMatch ? codeMatch[0].replace(/```[\w]*\n?/, '').replace(/```$/, '') : content;

      // Perform parallel analysis using Workers AI
      const [securityAnalysis, performanceAnalysis, qualityAnalysis] = await Promise.all([
        this.analyzeWithWorkersAI(code, "security vulnerabilities and potential exploits"),
        this.analyzeWithWorkersAI(code, "performance issues and optimization opportunities"),
        this.analyzeWithWorkersAI(code, "code quality, maintainability, and best practices")
      ]);

      // Combine the analyses into a comprehensive response
      const combinedAnalysis = `# 🔍 Code Quality Analysis Report

## 🛡️ Security Analysis
${securityAnalysis}

## ⚡ Performance Analysis  
${performanceAnalysis}

## 📋 Quality Analysis
${qualityAnalysis}

## 📊 Summary
Your code has been analyzed for security vulnerabilities, performance issues, and quality concerns. Review the specific recommendations above to improve your code.

*Analysis powered by Cloudflare Workers AI (Llama 3.3)*`;

      // Create a mock analysis result for storage
      const analysisResult: CodeAnalysisResult = {
        securityIssues: [{ severity: 'medium' as const, issue: 'Analysis completed', line: 1, suggestion: 'Review security recommendations above' }],
        performanceIssues: [{ severity: 'medium' as const, issue: 'Analysis completed', line: 1, suggestion: 'Review performance recommendations above' }],
        qualityIssues: [{ severity: 'medium' as const, issue: 'Analysis completed', line: 1, suggestion: 'Review quality recommendations above' }],
        overallScore: 75,
        summary: 'Comprehensive code analysis completed using Workers AI'
      };

      // Save the analysis result
      await this.saveAnalysisResult(analysisResult);

      // Stream the response
      const chunks = combinedAnalysis.split('\n');
      for (const chunk of chunks) {
        dataStream.writeText(chunk + '\n');
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for streaming effect
      }

      if (onFinish) {
        onFinish();
      }

    } catch (error) {
      console.error('Code analysis error:', error);
      dataStream.writeText(`❌ Analysis Error: ${(error as Error).message}\n\nPlease try again or contact support if the issue persists.`);
      if (onFinish) {
        onFinish();
      }
    }
  }

  private async performRegularChat(dataStream: any, onFinish: any) {
    const model = this.getModel();

    const systemPrompt = `You are an AI Code Quality Assistant, a helpful and knowledgeable coding companion. You help developers:

- Analyze code for security vulnerabilities, performance issues, and quality problems
- Provide best practice guidance for various programming languages
- Suggest improvements and optimizations
- Answer questions about coding standards and patterns
- Help with debugging and troubleshooting

You're friendly, professional, and focused on practical advice that improves code quality.

To analyze code, users can:
1. Paste code blocks with triple backticks
2. Ask questions like "analyze this function" or "check for security issues"
3. Request specific types of analysis (security, performance, quality)

Always be specific in your feedback and provide actionable suggestions.`;

    const result = streamText({
      model,
      system: systemPrompt,
      messages: this.messages,
      tools: {
        getAnalysisHistory: {
          description: "Retrieve previous code analysis results for reference",
          parameters: z.object({
            limit: z.number().default(5).describe("Number of recent analyses to retrieve")
          }),
          execute: async ({ limit }) => {
            const history = await this.getAnalysisHistory(limit);
            return `Retrieved ${history.length} previous analyses`;
          }
        }
      },
      onFinish,
      maxSteps: 2,
    });

    result.mergeIntoDataStream(dataStream);
  }

  private getSessionId(): string {
    // In a real implementation, this would be derived from user authentication
    // For now, use a default session
    return 'default-session';
  }

  private async getStateObject() {
    const sessionId = this.getSessionId();
    const id = this.env.QUALITY_ANALYSIS_STATE.idFromName(sessionId);
    return this.env.QUALITY_ANALYSIS_STATE.get(id);
  }

  private async saveAnalysisResult(analysis: CodeAnalysisResult): Promise<void> {
    try {
      const stateObject = await this.getStateObject();
      const sessionId = this.getSessionId();
      
      const response = await stateObject.fetch(`http://localhost/analysis?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      });

      if (!response.ok) {
        throw new Error(`Failed to save analysis: ${response.statusText}`);
      }
      
      console.log("Analysis result saved successfully");
    } catch (error) {
      console.error("Error saving analysis result:", error);
      // Don't throw - continue execution even if storage fails
    }
  }

  private async getAnalysisHistory(limit: number = 5): Promise<CodeAnalysisResult[]> {
    try {
      const stateObject = await this.getStateObject();
      const sessionId = this.getSessionId();
      
      const response = await stateObject.fetch(`http://localhost/analysis?sessionId=${sessionId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get analysis history: ${response.statusText}`);
      }
      
      const history = await response.json() as CodeAnalysisResult[];
      console.log(`Retrieved ${history.length} analysis results from history`);
      return history;
    } catch (error) {
      console.error("Error retrieving analysis history:", error);
      return []; // Return empty array on error
    }
  }
}
