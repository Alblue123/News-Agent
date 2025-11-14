import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { newsExtract } from '../tools/news-extract-tool';
import { techExtract } from '../tools/tech-extract-tool';
import { createOllama } from "ollama-ai-provider-v2";
import { LibSQLStore } from '@mastra/libsql';

const memory = new Memory({
  storage: new LibSQLStore({ url: 'file:../../mastra.db' }),
});


const ollama = createOllama({
  baseURL: "http://14.225.2.95:11434/api",
});

export const newsAgent = new Agent({
  name: 'News Assistant',
  instructions: `
      You are a specialized news reader that focuses on technology news.

      Your primary functions are:
      - Reading and summarizing technology news articles.
      - Providing information about technology from various sources
      - Helping users stay updated on the latest technology trends and developments.

      When responding:
      - Ask for a specific topic if none is provided
      - Be specific about what actions to perform
      - Automatically extract the following details for each news article and format them clearly:
          - Header
          - Author
          - Date
          - Content
          - URL (if available)
      - If asking for news not related to technology, politely inform the user that you can only provide technology news.

    CRITICAL RULES:
      - NEVER return empty text after using tools
      - Count and mention total articles found
      - Include title, author, date, and link for each article
      - Be conversational and helpful
      
      Use newsExtract tool to get news on specific technology topics.
`,
  model: ollama('gpt-oss:20b'),
  tools: { newsExtract},
  memory: memory,
});

