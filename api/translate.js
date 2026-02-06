export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { q, sl = 'auto', tl = 'en' } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Query text (q) is required' });
    }

    try {
        const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(q)}`;

        const response = await fetch(googleUrl);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Upstream Translation API failed' });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Translation proxy error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
