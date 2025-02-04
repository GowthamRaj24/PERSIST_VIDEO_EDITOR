import { YoutubeTranscript } from 'youtube-transcript';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import { SpeechClient } from '@google-cloud/speech';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let proxyAgent;
try {
    const proxyConfig = {
        host: process.env.PROXY_HOST || 'gate.smartproxy.com',
        port: process.env.PROXY_PORT || '10002',
        username: process.env.PROXY_USERNAME || 'spjlxr4ogb',
        password: process.env.PROXY_PASSWORD || 'tB3bf_1f0kjRGdMx9o'
    };

    const proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
    proxyAgent = new HttpsProxyAgent(proxyUrl);

    console.log('Proxy agent created successfully');
} catch (error) {
    console.error('Error creating proxy agent:', error);
    proxyAgent = null;
}

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

// Create proxy configuration
const createProxyAgent = () => {
    try {
        const proxyConfig = {
            host: process.env.PROXY_HOST || 'gate.smartproxy.com',
            port: process.env.PROXY_PORT || '10004',
            username: process.env.PROXY_USERNAME || 'spjlxr4ogb',
            password: process.env.PROXY_PASSWORD || 'tB3bf_1f0kjRGdMx9o'
        };

        const proxyUrl = `http://${proxyConfig.username}:${proxyConfig.password}@${proxyConfig.host}:${proxyConfig.port}`;
        console.log('Creating proxy agent with URL pattern:', 
            `http://[username]:[password]@${proxyConfig.host}:${proxyConfig.port}`);
        
        return new HttpsProxyAgent(proxyUrl);
    } catch (error) {
        console.error('Error creating proxy agent:', error);
        return null;
    }
};

// Create custom axios instance with proxy
const createAxiosInstance = (proxyAgent) => {
    return axios.create({
        httpsAgent: proxyAgent,
        timeout: 30000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
};

export const getTranscript = async (req, res) => {
    const proxyAgent = createProxyAgent();
    const axiosInstance = createAxiosInstance(proxyAgent);

    try {
        const { videoId } = req.body;
        console.log('Received video ID:', videoId);

        const cleanVideoId = videoId.includes('watch?v=') 
            ? videoId.split('watch?v=')[1].split('&')[0] 
            : videoId;

        console.log('Cleaned video ID:', cleanVideoId);
        const cleanVideoUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;

        // Configure request options with proxy
        const requestOptions = {
            country: 'US',
            requestOptions: {
                agent: proxyAgent,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                },
                timeout: 30000,
                httpsAgent: proxyAgent
            }
        };

        console.log('Attempting to fetch transcript with proxy...');

        // Fetch transcript with proxy
        const rawTranscript = await YoutubeTranscript.fetchTranscript(cleanVideoUrl, requestOptions);

        console.log('Transcript fetched successfully, formatting response...');

        const formattedCaptions = rawTranscript.map((caption, index) => ({
            id: index,
            text: caption.text,
            startTime: (caption.offset / 1000).toFixed(2),
            endTime: ((caption.offset + caption.duration) / 1000).toFixed(2),
            duration: caption.duration,
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
            message: "Captions with timestamps fetched successfully",
            proxyUsed: !!proxyAgent
        });

    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            stack: error.stack,
            proxyStatus: !!proxyAgent,
            axiosStatus: !!axiosInstance
        });

        return res.status(500).json({
            success: false,
            message: "Failed to fetch transcript",
            error: error.message,
            details: {
                errorType: error.name,
                proxyUsed: !!proxyAgent,
                errorDetails: error.response?.data || undefined
            }
        });
    }
};

export default getTranscript;
