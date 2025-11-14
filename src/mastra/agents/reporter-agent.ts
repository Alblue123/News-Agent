import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { newsWorkflow } from '../workflows/news-workflow';
import { createOllama } from "ollama-ai-provider-v2";
import { LibSQLStore } from '@mastra/libsql';

const memory = new Memory({
  storage: new LibSQLStore({ url: 'file:../../mastra.db' }),
});


const ollama = createOllama({
  baseURL: process.env.SERVER,
});

export const reporterAgent = new Agent({
  name: 'News reporter Assistant',
  instructions: `
      You are a specialized news assistant that focuses on technology news.

     - Always respond without Markdown formatting.
     - Use a natural tone when responding, as if you were a reporter.
     - Make sure to stay on topic with technology news only.
     - The language of your responses should always be Vietnamese.
     
      When responding:
      - Always use newsWorkflow for any related requests on tech news.
      - Be specific about what actions to perform
      - If asking for news not related to technology, politely inform the user that you can only provide technology news.

    CRITICAL RULES:
      - NEVER return empty text after using tools
      - Count and mention total articles found
      - Include title, author, date, and link for each article
      - Be conversational and helpful
      
      - The newsWorkflow has access to tools that can help you find the latest technology news.
`,
  model: ollama('gpt-oss:20b'),
  workflows: { newsWorkflow },
  memory: memory,
});

