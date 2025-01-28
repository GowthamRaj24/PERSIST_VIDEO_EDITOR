import ytdl from 'ytdl-core';
import { google } from 'googleapis';
import multer from 'multer';
import fetch from 'node-fetch';
import path from 'path';

import dotenv from 'dotenv';
dotenv.config();

const youtube = google.youtube('v3');
const API_KEY = process.env.YOUTUBE_API_KEY;

const storage = multer.diskStorage({
    destination: './uploads/videos',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg|mov/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Error: Videos Only!'));
    }
});

export const handleYoutubeVideo = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        const videoId = ytdl.getVideoID(videoUrl);
        
        // Get video details using YouTube API
        const videoResponse = await youtube.videos.list({
            key: API_KEY,
            part: 'snippet,contentDetails',
            id: videoId
        });
        
        const videoInfo = videoResponse.data.items[0];
        
        return res.status(200).json({
            success: true,
            video: {
                id: videoId,
                title: videoInfo.snippet.title,
                thumbnail: videoInfo.snippet.thumbnails.high.url,
                duration: videoInfo.contentDetails.duration,
                description: videoInfo.snippet.description
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to process YouTube video',
            error: error.message
        });
    }
};

export const handleYoutubePlaylist = async (req, res) => {
    try {
        const  playlistUrl  = req.body.videoUrl;
        console.log(playlistUrl);
        const playlistId = new URL(playlistUrl).searchParams.get('list');
        
        console.log(playlistId);
        const videos = [];
        let nextPageToken = '';
        
        do {
            const playlistResponse = await youtube.playlistItems.list({
                key: API_KEY,
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50,
                pageToken: nextPageToken
            });
            
            videos.push(...playlistResponse.data.items.map(item => ({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high.url,
                position: item.snippet.position
            })));
            
            nextPageToken = playlistResponse.data.nextPageToken;
        } while (nextPageToken);
        
        return res.status(200).json({
            success: true,
            videos
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to process YouTube playlist',
            error: error.message
        });
    }
};

export const handleLocalVideo = async (req, res) => {
    const uploadMiddleware = upload.single('video');
    
    uploadMiddleware(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error uploading video',
                error: err.message
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file provided'
            });
        }
        
        try {
            // Process the uploaded video
            const videoPath = req.file.path;
            
            return res.status(200).json({
                success: true,
                video: {
                    id: path.basename(videoPath),
                    path: videoPath,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimeType: req.file.mimetype
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to process local video',
                error: error.message
            });
        }
    });
};

export const handleExternalVideo = async (req, res) => {
    try {
        const { videoUrl } = req.body;
        
        // Validate URL
        const url = new URL(videoUrl);
        
        // Download video to temporary storage
        const response = await fetch(videoUrl);
        const fileName = `${Date.now()}-external-video${path.extname(url.pathname)}`;
        const filePath = path.join('./uploads/videos', fileName);
        
        // Save video file
        const fileStream = fs.createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            response.body.pipe(fileStream);
            response.body.on('error', reject);
            fileStream.on('finish', resolve);
        });
        
        return res.status(200).json({
            success: true,
            video: {
                id: fileName,
                path: filePath,
                originalUrl: videoUrl
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to process external video',
            error: error.message
        });
    }
};
