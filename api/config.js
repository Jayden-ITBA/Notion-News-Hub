import { kv } from '@vercel/kv';

const DEFAULT_CONFIG = {
    sources: [
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ],
    keywords: ['AI', 'Tech', 'Economy', 'Nvidia'],
    interval: { value: 1, unit: 'Hours' }
};

export default async function handler(req, res) {
    const { method } = req;
    const CONFIG_KEY = 'notion_news_hub_config';

    switch (method) {
        case 'GET':
            let config = await kv.get(CONFIG_KEY);
            if (!config) {
                config = DEFAULT_CONFIG;
                await kv.set(CONFIG_KEY, config);
            }
            return res.status(200).json(config);

        case 'POST':
            const { sources, keywords, interval, adminPin } = req.body;

            // Basic security check (NFR S-02)
            if (adminPin !== process.env.ADMIN_PIN && process.env.ADMIN_PIN) {
                return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
            }

            const currentConfig = (await kv.get(CONFIG_KEY)) || DEFAULT_CONFIG;
            
            if (sources) currentConfig.sources = sources;
            if (keywords) currentConfig.keywords = keywords;
            if (interval) currentConfig.interval = interval;

            await kv.set(CONFIG_KEY, currentConfig);

            return res.status(200).json({ status: 'Success', config: currentConfig });

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
