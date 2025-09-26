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

export class SimpleCodeAgent extends AIChatAgent<Env> {
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
    if (!code?.trim()) {
      throw new Error('Code input is required for analysis');
    }

    const systemPrompt = `You are an expert code quality analyst. Analyze the following code for ${analysisType} and provide detailed feedback in a structured format.

Focus on:
- Specific issues with line numbers when possible
- Severity levels (low, medium, high, critical)
- Actionable suggestions for improvement
- Best practices recommendations

Respond in a clear, structured format that a developer can easily understand and act upon.`;

    try {
      if (!this.env.AI) {
        throw new Error('Workers AI binding not available');
      }

      const response = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this code:\n\n${code}` }
        ],
        max_tokens: 2048,
        temperature: 0.1, // Lower temperature for more consistent analysis
      });

      const result = (response as any).response;
      if (!result) {
        throw new Error('No response received from Workers AI');
      }

      return result;
    } catch (error) {
      console.error("Workers AI analysis error:", error);
      
      // Provide fallback analysis if Workers AI fails
      const fallbackAnalysis = this.getFallbackAnalysis(analysisType, error as Error);
      return fallbackAnalysis;
    }
  }

  /**
   * Provide a fallback analysis when Workers AI is unavailable
   */
  private getFallbackAnalysis(analysisType: string, error: Error): string {
    const fallbackMessage = `🔧 **Analysis Service Temporarily Unavailable**

I'm currently unable to connect to the AI analysis service. Here's what I can tell you about ${analysisType} analysis:

**${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Analysis Guidelines:**

${this.getAnalysisGuidelines(analysisType)}

**Error Details:** ${error.message}

**What you can do:**
- Check your code against the guidelines above
- Try again in a few moments
- If the issue persists, please contact support

I'll be back to full functionality soon!`;

    return fallbackMessage;
  }

  /**
   * Get basic analysis guidelines for different types
   */
  private getAnalysisGuidelines(analysisType: string): string {
    switch (analysisType.toLowerCase()) {
      case 'security':
        return `
• **Input Validation**: Always validate and sanitize user inputs
• **SQL Injection**: Use parameterized queries, never concatenate SQL
• **XSS Prevention**: Escape output, use Content Security Policy
• **Authentication**: Implement proper session management
• **Authorization**: Check permissions for all sensitive operations
• **Data Encryption**: Encrypt sensitive data at rest and in transit`;

      case 'performance':
        return `
• **Algorithm Efficiency**: Choose appropriate data structures and algorithms
• **Database Queries**: Avoid N+1 queries, use indexing properly
• **Memory Management**: Prevent memory leaks, use efficient data structures
• **Caching**: Implement appropriate caching strategies
• **Async Operations**: Use asynchronous programming for I/O operations
• **Resource Optimization**: Minimize CPU and memory usage`;

      case 'quality':
        return `
• **Code Readability**: Use clear variable names and consistent formatting
• **Function Design**: Keep functions small and focused on single responsibilities
• **Error Handling**: Implement comprehensive error handling
• **Testing**: Write unit tests and integration tests
• **Documentation**: Add comments and documentation where needed
• **Code Duplication**: Eliminate duplicate code through refactoring`;

      default:
        return `
• **Best Practices**: Follow language-specific coding standards
• **Maintainability**: Write code that's easy to understand and modify
• **Error Handling**: Implement proper error handling and logging
• **Testing**: Ensure adequate test coverage
• **Documentation**: Document complex logic and APIs`;
    }
  }

  async onChatMessage(onFinish: any) {
    return createTextStreamResponse({
      execute: async (dataStream) => {
        // Get the last message
        const lastMessage = this.messages[this.messages.length - 1];
        const content = typeof lastMessage === 'string' ? lastMessage : lastMessage.content || '';

        // Check if this is a code analysis request
        const isCodeAnalysisRequest = this.isCodeAnalysisRequest(content);

        if (isCodeAnalysisRequest) {
          // Perform detailed code analysis
          await this.performCodeAnalysis(content, dataStream, onFinish);
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
      onFinish,
      maxSteps: 2,
    });

    result.mergeIntoDataStream(dataStream);
  }
}
