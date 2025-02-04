import OpenAI from "openai";

const promptAI = async(req, res) => {
    try {
        const prompt = req.body.prompt;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{role: "user", content: prompt}],
            temperature: 0.5,
            stream: false,
        });

        return res.status(200).json({
            response: response.choices[0].message.content
        });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return res.status(500).json({
            error: 'Failed to process the request',
            details: error.message
        });
    }
}

export default promptAI;