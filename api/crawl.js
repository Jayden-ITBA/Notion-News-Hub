import Parser from 'rss-parser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@notionhq/client";

import { kv } from '@vercel/kv';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Notion-News-Hub/1.0; +https://notionnewshub.vercel.app)',
    }
});
const CONFIG_KEY = 'notion_news_hub_config';

const parser = new Parser();
const CONFIG_KEY = 'notion_news_hub_config';
const APP_VERSION = '1.0.4 - Diagnostic Mode';

export default async function handler(req, res) {
    console.log(`Crawl triggered - Version: ${APP_VERSION}`);
    
    // 1. Load configuration from Vercel KV
    let storedConfig;
    try {
        storedConfig = await kv.get(CONFIG_KEY);
    } catch (kvError) {
        return res.status(500).json({ error: 'Failed to access Vercel KV', details: kvError.message });
    }

    const config = {
        sources: Array.isArray(storedConfig?.sources) ? storedConfig.sources : [
            { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' }
        ],
        keywords: Array.isArray(storedConfig?.keywords) ? storedConfig.keywords : ['AI', 'Tech', 'Economy'],
        geminiKey: process.env.GEMINI_API_KEY,
        notionKey: process.env.NOTION_API_KEY,
        notionDbId: process.env.NOTION_DATABASE_ID
    };

    if (!config.geminiKey || !config.notionKey || !config.notionDbId) {
        return res.status(500).json({ 
            error: 'System missing configuration', 
            missing: { 
                gemini: !config.geminiKey, 
                notion: !config.notionKey, 
                db: !config.notionDbId 
            } 
        });
    }

    const genAI = new GoogleGenerativeAI(config.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const notion = new Client({ auth: config.notionKey });

    const results = [];
    const errors = [];
    const SYNCED_URLS_KEY = 'synced_news_urls';

    const syncedUrls = (await kv.get(SYNCED_URLS_KEY)) || [];

    try {
        for (const source of config.sources) {
            if (!source?.url) continue;
            
            console.log(`Processing source: ${source.name} (${source.url})`);
            
            try {
                // Fetch manually first to see what we're getting
                const response = await fetch(source.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Notion-News-Hub/1.0)' }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                }
                
                const xmlText = await response.text();
                
                // Basic check if it's HTML instead of XML
                if (xmlText.trim().toLowerCase().startsWith('<!doctype html') || xmlText.includes('<html')) {
                    throw new Error('Received HTML instead of RSS. The source might be blocking the request or the URL is incorrect.');
                }

                const feed = await parser.parseString(xmlText);

                for (const item of feed.items) {
                    if (!item.link || syncedUrls.includes(item.link)) continue;

                    const textToSearch = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase();
                    const matches = config.keywords.some(kw => textToSearch.includes(kw.toLowerCase()));

                    if (matches) {
                        const prompt = `
            Làm nhiệm vụ tóm tắt tin tức chuyên nghiệp. 
            Tiêu đề: ${item.title}
            Nội dung: ${item.contentSnippet || item.content}
            Yêu cầu: 3 gạch đầu dòng ngắn gọn tiếng Việt. Trả về JSON: {"summary": ["..."]}
          `;

                        const aiResponse = await model.generateContent(prompt);
                        const aiText = aiResponse.response.text();
                        let insight;
                        try {
                            insight = JSON.parse(aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1));
                        } catch (e) {
                            insight = { summary: ["Could not parse AI summary"] };
                        }

                        await notion.pages.create({
                            parent: { database_id: config.notionDbId },
                            properties: {
                                Title: { title: [{ text: { content: item.title } }] },
                                Link: { url: item.link },
                                Source: { select: { name: source.name || 'Unknown' } },
                                Date: { date: { start: new Date(item.pubDate || new Date()).toISOString() } },
                                Insights: { rich_text: [{ text: { content: (insight.summary || []).join('\n') } }] }
                            }
                        });

                        results.push({ title: item.title, status: 'Synced' });
                        syncedUrls.push(item.link);
                    }
                }
            } catch (sourceError) {
                console.error(`Error in source ${source.name}:`, sourceError.message);
                errors.push({ source: source.name || source.url, error: sourceError.message });
            }
        }

        await kv.set(SYNCED_URLS_KEY, syncedUrls.slice(-200));

        return res.status(200).json({ 
            version: APP_VERSION,
            status: 'Done', 
            processed: results.length, 
            synced: results,
            errors: errors.length > 0 ? errors : undefined 
        });
    } catch (error) {
        console.error('Core Crawl Error:', error);
        return res.status(500).json({ version: APP_VERSION, error: error.message });
    }
}
