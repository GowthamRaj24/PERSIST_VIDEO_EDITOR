import { GoogleGenerativeAI } from "@google/generative-ai";
import getPlaylistVideos from "./getAllVideos.js";
import getTranscript from "./getTranscript.js";

import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const generateVideoScript = async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const Details = req.body.gotDetails;
        const customization = req.body.customization;
        const customPrompt = req.body.customPrompt;

        const basePrompt = `
I have multiple video transcripts, and I need you to create a cohesive video script by selecting and combining the most relevant segments.

IMPORTANT - Format your response as a JSON array with this exact structure:
[
  {
    "videoId": "string",
    "transcriptText": "exact quote from transcript",
    "startTime": number,
    "endTime": number
  }
]

Key requirements:
1. Only use exact quotes from the provided transcripts
2. Each segment must include videoId and precise timestamps
3. Maintain logical flow between segments
4. Keep original timestamps in their exact format
5. Ensure quotes are copied verbatim from source

Source Transcripts:
${JSON.stringify(Details, null, 2)}

Remember: Your response must be a valid JSON array following the specified structure exactly.` + customPrompt;

const enhancedPrompt = customization ? 
    `${basePrompt}

Style this selection according to:
- Tone: ${customization.tone}
- Length: ${customization.length}
- Style: ${customization.style}

Maintain the same JSON structure while incorporating these style preferences.`
    : basePrompt;


        
            console.log("Prompt-->" + enhancedPrompt)

        const result = await model.generateContent(enhancedPrompt);
        console.log("------")
        // console.log(result)

        const scriptContent = await result.response.text();
        // console.log(">>>>")
        // console.log(scriptContent);

        return res.status(200).json({
            success: true,
            data: {
                script: scriptContent
            },
            message: "Video script generated successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate video script",
            error: error.message
        });
    }
};

export const customizeScript = async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { script, options } = req.body;
        const {
            tone = 'professional',
            length = 'default',
            style = 'narrative',
            format = 'standard',
            targetAudience = 'general'
        } = options;

        const customizationPrompt = `
            Modify this script according to these parameters:
            - Tone: ${tone}
            - Target Length: ${length}
            - Style: ${style}
            - Format: ${format}
            - Target Audience: ${targetAudience}
            
            Original Script:
            ${script}
        `;

        const result = await model.generateContent(customizationPrompt);
        const customizedScript = result.response.text();

        return res.status(200).json({
            success: true,
            data: {
                originalScript: script,
                customizedScript,
                appliedOptions: options
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Script customization failed",
            error: error.message
        });
    }
};

export const translateScript = async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const { script, targetLanguages, preserveFormatting = true } = req.body;

        const translations = await Promise.all(
            targetLanguages.map(async (language) => {
                const translationPrompt = `
                    Translate this script to ${language}, maintaining the original formatting and style:
                    ${script}
                `;
                
                const result = await model.generateContent(translationPrompt);
                return {
                    language,
                    content: result.response.text()
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                originalScript: script,
                translations,
                supportedLanguages: getSupportedLanguages()
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Script translation failed",
            error: error.message
        });
    }
};

// Helper functions
const getPlaylistId = (url) => {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('list');
};

const getSupportedLanguages = () => {
    return [
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' }
    ];
};

