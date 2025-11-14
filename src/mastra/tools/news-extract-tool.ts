import { createTool } from '@mastra/core/tools';
import z from 'zod';

export const newsExtract = createTool({
    id: 'newsExtract',
    description: 'Extract lastest new on technology',
    inputSchema: z.object({
        topic: z.string().describe('Topic to search news for, e.g., "technology"'),
    }),
    outputSchema: z.object({
        articles: z.array(z.object({
            header: z.string().describe('News header'),
            author: z.string().describe('News author'),
            date: z.string().describe('News date'),
            content: z.string().describe('News content'),
            url: z.string().optional().describe('News URL'),
        })).describe('List of news articles'),
    }),
    execute: async ({context}) => {
        return await getNews(context.topic);
    },
});

const getNews = async (topic: string) => {
    try {
        const NewsAPI = require('newsapi');
        const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

        if (!process.env.NEWS_API_KEY) {
            throw new Error('NEWS_API_KEY is not defined in environment variables');
        }

        const response = await newsapi.v2.everything({
            q: topic,
            from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // last 14 days
            to: new Date().toISOString().split('T')[0],
            language: 'en',
            sortBy: 'relevancy',
            pageSize: 5,
        })

        console.log('API Response: ', {
            status: response.status,
            totalResults: response.totalResults,
            articlesCount: response.articles.length,
        })

        if (!response.articles || response.articles.length === 0) {
            return {
                articles: [],
                searchTopic: "No articles found for the ${topic}."
            }
        }

        const articles = response.articles.map((article: any) => ({
            header: article.title || 'No title',
            author: article.author || 'N/A',
            date: article.publishedAt || new Date().toISOString(),
            content: article.content || 'No content available',
            url: article.url || '',
        }));

        return {
            articles: articles,
            searchTopic: topic,
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
    
}