# 🔍 AI Code Quality Assistant

An intelligent AI agent built on Cloudflare's platform that analyzes code for security vulnerabilities, performance issues, and quality problems through natural chat interaction.

## ✨ Features

- **🛡️ Security Analysis**: Detects vulnerabilities, injection attacks, and authentication issues
- **⚡ Performance Review**: Identifies bottlenecks, memory leaks, and optimization opportunities  
- **📋 Quality Assessment**: Evaluates code structure, maintainability, and best practices
- **💬 Natural Language Interface**: Chat-based interaction for easy code analysis
- **📊 Persistent State**: Tracks analysis history and quality metrics over time
- **🌐 Real-time Streaming**: Live analysis results with streaming responses

## 🏗️ Architecture

Built entirely on Cloudflare's platform using:

- **Workers AI (Llama 3.3)**: Primary AI model for code analysis
- **Cloudflare Agents SDK**: Framework for building intelligent agents
- **Durable Objects**: Persistent state management and analysis history
- **Workers**: Serverless compute platform
- **AI Gateway**: Optional request caching and analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo>
   cd ai-code-quality-assistant
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and add your API keys (see Configuration section)
   ```

3. **Configure Cloudflare account**:
   ```bash
   wrangler login
   # Update wrangler.jsonc with your account ID
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

5. **Visit the application**:
   Open [http://localhost:8787](http://localhost:8787) in your browser

### Configuration

#### Required Environment Variables

Create a `.dev.vars` file with the following:

```bash
# Optional: OpenAI API Key for fallback (if Workers AI is unavailable)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Cloudflare AI Gateway for request caching and analytics
AI_GATEWAY_ACCOUNT_ID=your_cloudflare_account_id
AI_GATEWAY_ID=your_ai_gateway_id
```

#### Wrangler Configuration

Update `wrangler.jsonc` with your Cloudflare account details:

```json
{
  "account_id": "your_cloudflare_account_id_here",
  "vars": {
    "AI_GATEWAY_ACCOUNT_ID": "your_account_id",
    "AI_GATEWAY_ID": "your_gateway_id"
  }
}
```

## 💻 Usage

### Chat Interface

1. Open the web application
2. Use the example prompts or type your own questions
3. Paste code blocks using triple backticks (\`\`\`)
4. Get instant analysis results

### Example Interactions

**Security Analysis**:
```
Analyze this JavaScript function for security issues:

\`\`\`javascript
function login(username, password) {
  const query = "SELECT * FROM users WHERE username='" + username + "' AND password='" + password + "'";
  return db.query(query);
}
\`\`\`
```

**Performance Review**:
```
Check this React component for performance problems:

\`\`\`jsx
function UserList({ users }) {
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          {expensiveCalculation(user.data)}
        </div>
      ))}
    </div>
  );
}
\`\`\`
```

**Quality Assessment**:
```
Review this Python code for quality improvements:

\`\`\`python
def process_data(data):
    result = []
    for i in range(len(data)):
        if data[i] > 0:
            result.append(data[i] * 2)
    return result
\`\`\`
```

### API Endpoints

- `GET /` - Chat interface
- `GET /health` - Health check
- `POST /api/analyze` - Direct code analysis API
- `/agents/*` - Agent communication endpoints

## 🔧 Development

### Project Structure

```
src/
├── agents/
│   └── code-quality-agent.ts    # Main AI agent implementation
├── durable-objects/
│   └── quality-analysis-state.ts # Persistent state management
└── index.ts                     # Worker entry point and routing
```

### Key Components

#### CodeQualityAgent
- Handles chat interactions
- Performs code analysis using Workers AI
- Integrates with persistent state

#### QualityAnalysisState (Durable Object)
- Stores analysis history
- Tracks quality metrics over time
- Manages user sessions

### Local Development

```bash
# Start development server
npm start

# Run tests
npm test

# Type checking
npm run cf-typegen
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## 🎯 Technical Highlights

### AI-Powered Analysis
- Uses Cloudflare Workers AI with Llama 3.3 70B model
- Parallel analysis for security, performance, and quality
- Structured output with actionable recommendations

### Scalable Architecture
- Serverless and edge-optimized
- Durable Objects for consistent state management
- Smart placement for optimal performance

### Developer Experience
- Natural language interface
- Real-time streaming responses
- Persistent analysis history
- Modern, responsive UI

## 🔮 Future Enhancements

- **Workflow Integration**: Automated PR reviews and CI/CD integration
- **Multi-language Support**: Enhanced analysis for more programming languages
- **Team Collaboration**: Shared analysis sessions and team dashboards
- **Custom Rules**: User-defined analysis criteria and standards
- **GitHub Integration**: Direct repository analysis and issue creation

## 📚 Documentation

- [Cloudflare Agents Documentation](https://developers.cloudflare.com/agents/)
- [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [Durable Objects Documentation](https://developers.cloudflare.com/durable-objects/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Built for Cloudflare Internship Application

This project demonstrates:
- ✅ **LLM Integration**: Llama 3.3 on Workers AI
- ✅ **Workflow/Coordination**: Durable Objects and Workers
- ✅ **User Input**: Chat interface with natural language processing
- ✅ **Memory/State**: Persistent analysis history and session management

---

**Made with ❤️ using Cloudflare's cutting-edge AI platform**
