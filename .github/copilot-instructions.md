# Copilot Instructions for News Mastra

## Architecture Overview
This is a **Mastra-based AI news aggregation system** with Discord bot integration. The system follows a multi-agent workflow pattern where specialized AI agents collaborate to fetch, process, and format technology news.

**Key Components:**
- `src/mastra/index.ts` - Main entry point with Discord bot and Mastra configuration
- `src/mastra/agents/` - AI agents with distinct roles (news extraction, writing, reporting)
- `src/mastra/workflows/` - Orchestrated multi-step processes using Zod schemas
- `src/mastra/tools/` - External API integrations (NewsAPI)

## Essential Patterns

### Agent Design Pattern
All agents use **Ollama with custom remote endpoint** (`http://14.225.2.95:11434/api`) and have Vietnamese language requirements:
```typescript
const ollama = createOllama({
  baseURL: "http://14.225.2.95:11434/api",
});
// All reporter responses must be in Vietnamese
```

### Workflow Architecture
Workflows use **sequential step chaining** with Zod validation:
```typescript
const newsWorkflow = createWorkflow({...})
 .then(newsExtract)
 .then(formatArticles);
newsWorkflow.commit(); // Always commit workflows
```

### Tool Context Pattern
Tools receive context via `{context}` parameter, not direct parameters:
```typescript
execute: async ({context}) => {
    return await getNews(context.topic); // Access via context
}
```

## Development Workflows

### Local Development
```bash
npm run dev    # Start Mastra dev server
npm run build  # Build for production
npm run start  # Start production server
```

### Required Environment Variables
- `NEWS_API_KEY` - NewsAPI.org API key for article fetching
- `DISCORD_TOKEN` - Discord bot token for slash commands
- `NODE_ENV` - Controls logging level (debug/info)

## Project-Specific Conventions

### Agent Responsibilities
- **newsAgent** - Fetches raw articles using NewsAPI tool
- **writerAgent** - Summarizes and translates content to Vietnamese
- **reporterAgent** - Orchestrates workflow and formats Discord responses

### Database Integration
Uses LibSQL with file-based storage: `'file:../../mastra.db'` (relative to src/mastra/)

### Discord Integration
- Slash command: `/technews [topic]` triggers full workflow
- Embeds limited to 5 articles max (Discord API constraints)
- Error handling with graceful Discord embed responses

### NewsAPI Integration Patterns
- 14-day lookback window for relevant articles
- 5 articles max per request to stay within rate limits
- English language articles only, Vietnamese translation via AI
- Relevancy-based sorting for better quality results

## Common Issues & Solutions

### Ollama Connection
If agents fail, verify the remote Ollama endpoint is accessible at `14.225.2.95:11434`

### Memory Management
All agents use shared `Memory()` instance - consider this for state persistence

### Discord Rate Limits
Embed responses are capped at 5 articles to avoid Discord API limits

## Integration Points
- **NewsAPI** → `newsExtract` tool → `newsAgent` → workflow
- **Mastra workflows** → `reporterAgent` → Discord bot responses
- **LibSQL storage** → observability and agent memory persistence