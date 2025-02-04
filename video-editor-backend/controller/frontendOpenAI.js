import OpenAI from "openai";

const promptAI = async(req , res) => {
    const {prompt} = req.body;

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
    });

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{role: "user", content: prompt}],
        temperature: 0.5,
        stream: true,
    });
    return res.status(200).json({response: response.choices[0].message.content});
}

export default promptAI;