import { createTool } from '@mastra/core/tools';
import z from 'zod';

export const techExtract = createTool({
    id: 'techExtract',
    description: 'Extract latest tweets on technology',
    inputSchema: z.object({
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
    execute: async () => {
        return await getTech();
    },
});

const getTech = async () => {
    try {
        const NewsAPI = require('newsapi');
        const newsapi = new NewsAPI(process.env.NEWS_API_KEY);

        if (!process.env.NEWS_API_KEY) {
            throw new Error('NEWS_API_KEY is not defined in environment variables');
        }

        const response = await newsapi.v2.everything({
            q: 'artificial intelligence',
            pageSize: 10,
            from: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
            to: new Date().toISOString().split('T')[0],
            sortBy: 'publishedAt',
            language: 'en',
        })

        console.log('API Response: ', {
            status: response.status,
            totalResults: response.totalResults,
            articlesCount: response.articles.length,
        })

        if (!response.articles || response.articles.length === 0) {
            return {
                articles: [],
                searchTopic: "No articles found."
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
        }
    } catch (error) {
        console.error('Error fetching news:', error);
        throw new Error('Failed to fetch news');
    }
    
}