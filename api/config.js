// This would ideally use Vercel KV or a DB
// For the demo/initial Phase, we can use an internal variable (not persistent across cold starts)
// or read from environment variables.

let mockStore = {
    sources: [
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' }
    ],
    keywords: ['AI', 'Tech', 'Economy', 'Nvidia'],
    interval: { value: 1, unit: 'Hours' }
};

export default async function handler(req, res) {
    const { method } = req;

    switch (method) {
        case 'GET':
            return res.status(200).json(mockStore);

        case 'POST':
            const { sources, keywords, interval, adminPin } = req.body;

            // Basic security check (NFR S-02)
            if (adminPin !== process.env.ADMIN_PIN && process.env.ADMIN_PIN) {
                return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN' });
            }

            if (sources) mockStore.sources = sources;
            if (keywords) mockStore.keywords = keywords;
            if (interval) mockStore.interval = interval;

            return res.status(200).json({ status: 'Success', config: mockStore });

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}
