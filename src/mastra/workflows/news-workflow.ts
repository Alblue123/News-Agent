import { createOllama } from "ollama-ai-provider-v2";
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { newsAgent } from "../agents/news-agent";
import { writerAgent } from "../agents/writer-agent";

const newsExtract = createStep({
    id: 'newsExtract',
    description: 'Extract lastest new on technology',
    inputSchema: z.object({
        topic: z.string().describe('Topic to search news for, e.g., "technology"'),
    }),
    outputSchema: z.object({
        articles: z.string().describe('Raw news articles data'),
    }),
    execute: async ({ inputData }) => {
        const { topic } = inputData;
        if (!topic) {
            throw new Error('Topic is required');
        }

        const message1 = "Start fetching latest technology news articles on the topic: " + topic;
        console.log(message1);

        const response = await newsAgent.generateVNext([
            {
                role: 'user',
                content: topic,
            },
        ]);

        console.log("Finished fetching news articles.");

        const articlesData = response.text || JSON.stringify(response.response || {}, null, 2);

        return {
            articles: articlesData,
        };
    },
});

const formatArticles = createStep({
    id: 'format-articles',
    description: 'Format and summarize news articles',
    inputSchema: z.object({
        articles: z.string().describe('Raw news articles data'),
    }),
    outputSchema: z.object({
        articles: z.string().describe('Formatted news articles'),
    }),
    execute: async ({ inputData }) => {
        const articles = inputData.articles;

        if (articles.length === 0) {
            return { articles: 'No articles found.' };
        }

        const prompt = `Summarize the following news articles into a concise report highlighting the key points and trends:\n\n${articles}\n\nSummary:`;

        const response = await writerAgent.generateVNext([
            {
                role: 'user',
                content: prompt,
            },
        ]);

        //console.dir(response, { depth: null });

        const articlesSummary = response.text || 'No summary available.';

        return { articles: articlesSummary };
    },
});

const newsWorkflow = createWorkflow({
    id: 'newsWorkflow',
    inputSchema: z.object({
        topic: z.string().describe('Topic to search news for, e.g., "technology"'),
    }),
    outputSchema: z.object({
        newsSummary: z.string().describe('Summarized news articles'),
    })
})
 .then(newsExtract)
 .then(formatArticles);

newsWorkflow.commit();

export { newsWorkflow };