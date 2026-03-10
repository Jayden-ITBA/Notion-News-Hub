import Parser from 'rss-parser';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@notionhq/client";

import { kv } from '@vercel/kv';

const parser = new Parser();
const CONFIG_KEY = 'notion_news_hub_config';

export default async function handler(req, res) {
    // 1. Load configuration from Vercel KV
    const storedConfig = await kv.get(CONFIG_KEY);

    const config = {
        sources: storedConfig?.sources || [
            { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' }
        ],
        keywords: storedConfig?.keywords || ['AI', 'Tech', 'Economy'],
        geminiKey: process.env.GEMINI_API_KEY,
        notionKey: process.env.NOTION_API_KEY,
        notionDbId: process.env.NOTION_DATABASE_ID
    };

    if (!config.geminiKey || !config.notionKey) {
        return res.status(500).json({ error: 'System missing API keys' });
    }

    const genAI = new GoogleGenerativeAI(config.geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const notion = new Client({ auth: config.notionKey });

    const results = [];
    const SYNCED_URLS_KEY = 'synced_news_urls';

    // Load already synced URLs to prevent duplicates
    const syncedUrls = await kv.get(SYNCED_URLS_KEY) || [];

    try {
        for (const source of config.sources) {
            try {
                const feed = await parser.parseURL(source.url);

                for (const item of feed.items) {
                    // Deduplication check
                    if (syncedUrls.includes(item.link)) continue;

                    const textToSearch = `${item.title} ${item.contentSnippet || item.content || ''}`.toLowerCase();
                    const matches = config.keywords.some(kw => textToSearch.includes(kw.toLowerCase()));

                    if (matches) {
                        // 2. Generate AI Summary
                        const prompt = `
            Làm nhiệm vụ tóm tắt tin tức chuyên nghiệp. 
            Tiêu đề: ${item.title}
            Nội dung: ${item.contentSnippet || item.content}
            
            Yêu cầu:
            1. Cung cấp đúng 3 gạch đầu dòng ngắn gọn bằng tiếng Việt.
            2. Mỗi ý tập trung vào một thông tin quan trọng nhất.
            3. Trả về định dạng JSON: {"summary": ["ý 1", "ý 2", "ý 3"]}
          `;

                        const aiResponse = await model.generateContent(prompt);
                        const aiText = aiResponse.response.text();
                        let insight;
                        try {
                            insight = JSON.parse(aiText.substring(aiText.indexOf('{'), aiText.lastIndexOf('}') + 1));
                        } catch (e) {
                            insight = { summary: ["Could not parse AI summary"] };
                        }

                        // 3. Sync to Notion
                        await notion.pages.create({
                            parent: { database_id: config.notionDbId },
                            properties: {
                                Title: { title: [{ text: { content: item.title } }] },
                                Link: { url: item.link },
                                Source: { select: { name: source.name } },
                                Date: { date: { start: new Date(item.pubDate).toISOString() } },
                                Insights: { rich_text: [{ text: { content: insight.summary.join('\n') } }] }
                            },
                            children: [
                                {
                                    object: 'block',
                                    type: 'paragraph',
                                    paragraph: {
                                        rich_text: [{ text: { content: 'Key Insights (30s):' }, annotations: { bold: true } }]
                                    }
                                },
                                ...insight.summary.map(point => ({
                                    object: 'block',
                                    type: 'bulleted_list_item',
                                    bulleted_list_item: {
                                        rich_text: [{ text: { content: point } }]
                                    }
                                }))
                            ]
                        });

                        results.push({ title: item.title, status: 'Synced' });
                        syncedUrls.push(item.link);
                    }
                }
            } catch (sourceError) {
                console.error(`Error processing source ${source.name}:`, sourceError);
            }
        }

        // Update synced URLs list (keep last 200 items to manage KV size)
        await kv.set(SYNCED_URLS_KEY, syncedUrls.slice(-200));

        return res.status(200).json({ status: 'Success', processed: results.length, details: results });
    } catch (error) {
        console.error('Crawl Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
