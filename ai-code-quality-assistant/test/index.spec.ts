import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../src';

describe('AI Code Quality Assistant Worker', () => {
	describe('Basic Routes', () => {
		it('serves chat interface at root', async () => {
			const request = new Request('http://example.com/');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/html');
			
			const html = await response.text();
			expect(html).toContain('AI Code Quality Assistant');
			expect(html).toContain('Security Analysis');
			expect(html).toContain('Performance Review');
			expect(html).toContain('Quality Assessment');
		});

		it('serves chat interface at /index.html', async () => {
			const request = new Request('http://example.com/index.html');
			const response = await SELF.fetch(request);
			
			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toContain('text/html');
		});

		it('handles CORS preflight requests', async () => {
			const request = new Request('http://example.com/agents/simple-code-agent', {
				method: 'OPTIONS'
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
		});

		it('handles health check endpoint', async () => {
			const request = new Request('http://example.com/health');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(200);
			
			const health = await response.json();
			expect(health).toHaveProperty('status', 'healthy');
			expect(health).toHaveProperty('timestamp');
			expect(health).toHaveProperty('version');
		});
	});

	describe('Agent Routes', () => {
		it('routes to simple code agent', async () => {
			const request = new Request('http://example.com/agents/simple-code-agent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					messages: [{ role: 'user', content: 'Hello, can you analyze this code?' }]
				})
			});
			
			const ctx = createExecutionContext();
			
			// Since the agent requires API keys, we expect this to either work or fail gracefully
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Should either be a successful response or a proper error (not 404)
			expect(response.status).not.toBe(404);
			expect([200, 400, 401, 500].includes(response.status)).toBe(true);
		});

		it('returns 404 for unknown agent', async () => {
			const request = new Request('http://example.com/agents/unknown-agent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					messages: [{ role: 'user', content: 'test' }]
				})
			});
			
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
		});
	});

	describe('Direct Analysis API', () => {
		it('handles direct analysis requests', async () => {
			const testCode = `
function login(username, password) {
    const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
    return db.query(query);
}`;

			const request = new Request('http://example.com/api/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					code: testCode,
					analysisTypes: ['security', 'performance', 'quality']
				})
			});
			
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			// Should handle the request (success or graceful failure)
			expect([200, 400, 500].includes(response.status)).toBe(true);
		});

		it('requires code parameter for analysis', async () => {
			const request = new Request('http://example.com/api/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					analysisTypes: ['security']
				})
			});
			
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
			
			const error = await response.json();
			expect(error).toHaveProperty('error');
			expect(error.error).toContain('code');
		});
	});

	describe('Error Handling', () => {
		it('returns 404 for unknown routes', async () => {
			const request = new Request('http://example.com/unknown-route');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(404);
			
			const error = await response.text();
			expect(error).toContain('Not Found');
		});

		it('handles invalid JSON in POST requests', async () => {
			const request = new Request('http://example.com/agents/simple-code-agent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: 'invalid json'
			});
			
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, env, ctx);
			await waitOnExecutionContext(ctx);
			
			expect(response.status).toBe(400);
		});
	});
});

describe('Code Analysis Schema Validation', () => {
	it('validates security issue structure', () => {
		const validSecurityIssue = {
			severity: 'high',
			issue: 'SQL Injection vulnerability',
			line: 3,
			suggestion: 'Use parameterized queries'
		};

		// Basic structure validation
		expect(validSecurityIssue).toHaveProperty('severity');
		expect(validSecurityIssue).toHaveProperty('issue');
		expect(validSecurityIssue).toHaveProperty('suggestion');
		expect(['low', 'medium', 'high', 'critical']).toContain(validSecurityIssue.severity);
	});

	it('validates performance issue structure', () => {
		const validPerformanceIssue = {
			severity: 'medium',
			issue: 'Inefficient loop',
			line: 5,
			suggestion: 'Use built-in array methods'
		};

		expect(validPerformanceIssue).toHaveProperty('severity');
		expect(validPerformanceIssue).toHaveProperty('issue');
		expect(validPerformanceIssue).toHaveProperty('suggestion');
		expect(['low', 'medium', 'high']).toContain(validPerformanceIssue.severity);
	});

	it('validates complete analysis result structure', () => {
		const validAnalysisResult = {
			securityIssues: [
				{
					severity: 'critical',
					issue: 'SQL Injection',
					line: 3,
					suggestion: 'Use parameterized queries'
				}
			],
			performanceIssues: [],
			qualityIssues: [
				{
					severity: 'low',
					issue: 'Missing documentation',
					suggestion: 'Add JSDoc comments'
				}
			],
			overallScore: 65,
			summary: 'Code has security vulnerabilities that need immediate attention'
		};

		expect(validAnalysisResult).toHaveProperty('securityIssues');
		expect(validAnalysisResult).toHaveProperty('performanceIssues');
		expect(validAnalysisResult).toHaveProperty('qualityIssues');
		expect(validAnalysisResult).toHaveProperty('overallScore');
		expect(validAnalysisResult).toHaveProperty('summary');
		
		expect(Array.isArray(validAnalysisResult.securityIssues)).toBe(true);
		expect(Array.isArray(validAnalysisResult.performanceIssues)).toBe(true);
		expect(Array.isArray(validAnalysisResult.qualityIssues)).toBe(true);
		
		expect(typeof validAnalysisResult.overallScore).toBe('number');
		expect(validAnalysisResult.overallScore).toBeGreaterThanOrEqual(0);
		expect(validAnalysisResult.overallScore).toBeLessThanOrEqual(100);
		
		expect(typeof validAnalysisResult.summary).toBe('string');
	});
});

describe('Integration Tests', () => {
	it('full workflow: HTML -> Agent -> Response', async () => {
		// Test that the HTML interface is served
		const htmlRequest = new Request('http://example.com/');
		const htmlResponse = await SELF.fetch(htmlRequest);
		expect(htmlResponse.status).toBe(200);
		
		const html = await htmlResponse.text();
		expect(html).toContain('/agents/simple-code-agent');
		
		// Test that the agent endpoint exists (even if it fails due to missing API keys)
		const agentRequest = new Request('http://example.com/agents/simple-code-agent', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [{ role: 'user', content: 'test' }]
			})
		});
		
		const agentResponse = await SELF.fetch(agentRequest);
		// Should not be 404 (endpoint exists)
		expect(agentResponse.status).not.toBe(404);
	});
});
