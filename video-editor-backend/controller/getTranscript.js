import { YoutubeTranscript } from 'youtube-transcript';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import { SpeechClient } from '@google-cloud/speech';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config();

const extractFileId = (driveLink) => {
    const match = driveLink.match(/[-\w]{25,}/); 
    return match ? match[0] : null;
};


const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
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

const speechClient = new SpeechClient({
    credentials
});



import axios from 'axios';
export const getDriveTranscript = async (req, res) => {
    try {
        const driveLink = req.body.videoUrl;
        const fileId = extractFileId(driveLink);
        
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

        console.log(uploadResponse.data.upload_url);

        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: uploadResponse.data.upload_url
            },
            {
                headers: {
                    'authorization': ASSEMBLY_API_KEY,
                    'content-type': 'application/json'
                }
            }
        );
        

        console.log("--> " + transcriptResponse)
        const transcriptId = transcriptResponse.data.id;

        console.log(transcriptId)
        let transcriptResult;

        while (true) {
            const pollingResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': ASSEMBLY_API_KEY
                    }
                }
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

        console.log(formattedCaptions);

        return res.json({
            success: true,
            data: formattedCaptions,
            message: "Captions with timestamps fetched successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transcript",
            error: error.message
        });
    }
};




export const getVideoDetails = async (req, res) => {
    try {
        const videoId = req.body.videoUrl;
        const apiKey = process.env.YOUTUBE_API_KEY;
        
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
        );
        
        const data = await response.json();
        
        return res.status(200).json({
            success: true,
            data: {
                videoId,
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
        // Extract video ID from full URL
        const videoUrl = req.body.videoId;
        const videoId = videoUrl.split('watch?v=')[1].split('&')[0];
        const cleanVideoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        console.log('Processing video:', cleanVideoUrl);
        
        const rawTranscript = await YoutubeTranscript.fetchTranscript(cleanVideoUrl, {
            lang: 'en',
            country: 'US'
        });

        

        console.log(rawTranscript)

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
        console.error('Transcript Error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transcript",
            error: error
        });
    }
};




export default getTranscript;
