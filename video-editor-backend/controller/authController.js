import { getAuthUrl, getTokens } from './googleAuth.js';

export const getGoogleAuthUrl = (req, res) => {
    const url = getAuthUrl();
    res.json({ url });
};

export const handleGoogleCallback = async (req, res) => {
    try {
        const { code } = req.body;
        const tokens = await getTokens(code);
        res.json({ tokens });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
