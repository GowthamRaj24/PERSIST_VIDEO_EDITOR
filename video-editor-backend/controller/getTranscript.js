import { YoutubeTranscript } from 'youtube-transcript';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import { SpeechClient } from '@google-cloud/speech';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proxy configuration with error handling
let proxyAgent;
try {
    const proxyUrl = process.env.PROXY_LINK;
    if (!proxyUrl) {
        console.warn('Warning: PROXY_LINK environment variable is not set');
        proxyAgent = null;
    } else {
        // Ensure the proxy URL starts with http:// or https://
        const formattedProxyUrl = proxyUrl.startsWith('http') ? proxyUrl : `http://${proxyUrl}`;
        proxyAgent = new HttpsProxyAgent(formattedProxyUrl);
        console.log('Proxy agent created successfully');
    }
} catch (error) {
    console.error('Error creating proxy agent:', error);
    proxyAgent = null;
}

// Test proxy connection function
const testProxyConnection = async () => {
    if (!proxyAgent) {
        console.log('No proxy agent available, skipping proxy test');
        return true;
    }

    try {
        const response = await axios.get('https://ip.smartproxy.com/json', {
            httpsAgent: proxyAgent,
            timeout: 5000 // 5 second timeout
        });
        console.log('Proxy connection successful:', response.data);
        return true;
    } catch (error) {
        console.error('Proxy connection failed:', error.message);
        return false;
    }
};

const extractFileId = (driveLink) => {
    const match = driveLink.match(/[-\w]{25,}/);
    return match ? match[0] : null;
};

const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
};

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

const speechClient = new SpeechClient({ credentials });

const proxyConfig = {
    host: 'gate.smartproxy.com',
    port: 10001,
    auth: {
        username: 'spjlxr4ogb',
        password: 'tB3bf_1f0kjRGdMx9o'
    }
};

export const getDriveTranscript = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const fileId = extractFileId(videoUrl);

        if (!fileId) {
            return res.status(400).json({
                success: false,
                message: "Invalid Google Drive URL. Could not extract file ID."
            });
        }

        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY;

        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            response.data,
            {
                headers: {
                    'authorization': ASSEMBLY_API_KEY,
                    'content-type': 'application/octet-stream'
                }
            }
        );

        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            { audio_url: uploadResponse.data.upload_url },
            {
                headers: {
                    'authorization': ASSEMBLY_API_KEY,
                    'content-type': 'application/json'
                }
            }
        );

        const transcriptId = transcriptResponse.data.id;
        let transcriptResult;

        while (true) {
            const pollingResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                { headers: { 'authorization': ASSEMBLY_API_KEY } }
            );

            if (pollingResponse.data.status === 'completed') {
                transcriptResult = pollingResponse.data;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        const formattedCaptions = transcriptResult.words.map((word, index) => ({
            id: index,
            text: word.text,
            startTime: word.start / 1000,
            endTime: word.end / 1000,
            duration: (word.end - word.start) / 1000
        }));

        return res.json({
            success: true,
            data: formattedCaptions,
            message: "Captions with timestamps fetched successfully"
        });

    } catch (error) {
        console.error('Error in getDriveTranscript:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transcript",
            error: error.message
        });
    }
};

// YouTube Video Details Handler
export const getVideoDetails = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoUrl}&key=${apiKey}`
        );
        
        const data = await response.json();
        
        return res.json({
            success: true,
            data: {
                videoId: videoUrl,
                title: data.items[0].snippet.title,
                thumbnail: data.items[0].snippet.thumbnails.high.url
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch video details",
            error: error.message
        });
    }
};

export const getTranscript = async (req, res) => {
    try {
        const { videoId } = req.body;
        const cleanVideoId = videoId.includes('watch?v=') 
            ? videoId.split('watch?v=')[1].split('&')[0] 
            : videoId;

        const cleanVideoUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

        // Create axios instance with proxy if available
        const axiosConfig = {
            timeout: 30000 // 30 second timeout
        };

        if (proxyAgent) {
            axiosConfig.httpsAgent = proxyAgent;
            axiosConfig.proxy = false; // Disable default proxy handling
        }

        const axiosInstance = axios.create(axiosConfig);

        // Configure request options
        const requestOptions = {
            country: 'US',
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        };

        // Add proxy agent to request options if available
        if (proxyAgent) {
            requestOptions.requestOptions.agent = proxyAgent;
        }

        const rawTranscript = await YoutubeTranscript.fetchTranscript(cleanVideoUrl, requestOptions);

        console.log('Transcript fetched successfully');

        const formattedCaptions = rawTranscript.map((caption, index) => ({
            id: index,
            text: caption.text,
            startTime: (caption.offset / 1).toFixed(2),
            endTime: ((caption.offset + caption.duration) / 1).toFixed(2),
            duration: caption.duration / 1,
            formattedTime: {
                start: {
                    hours: Math.floor(caption.offset / 3600000),
                    minutes: Math.floor((caption.offset % 3600000) / 60000),
                    seconds: Math.floor((caption.offset % 60000) / 1000),
                    milliseconds: caption.offset % 1000
                },
                end: {
                    hours: Math.floor((caption.offset + caption.duration) / 3600000),
                    minutes: Math.floor(((caption.offset + caption.duration) % 3600000) / 60000),
                    seconds: Math.floor(((caption.offset + caption.duration) % 60000) / 1000),
                    milliseconds: (caption.offset + caption.duration) % 1000
                }
            }
        }));

        return res.json({
            success: true,
            data: formattedCaptions,
            message: "Captions with timestamps fetched successfully"
        });

    } catch (error) {
        console.error('Transcript fetch error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transcript",
            error: error.message,
            details: error.response?.data || undefined,
            proxyError: proxyAgent ? 'Using proxy' : 'No proxy in use'
        });
    }
};

export default getTranscript;
