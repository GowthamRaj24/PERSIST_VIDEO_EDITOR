import axios from 'axios';
import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { ApifyClient } from 'apify-client';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';

ffmpeg.setFfmpegPath('C:\\ffmpeg\\bin\\ffmpeg.exe');

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
    const { videoId, startTime, endTime } = req.query;
    let originalFilePath, trimmedFilePath;
    const tempId = uuidv4(); 
    const cleanupFiles = () => {
        try {
            [originalFilePath, trimmedFilePath].forEach(filePath => {
                if (filePath && fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up: ${filePath}`);
                }
            });
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    };

    try {
        // Validate mandatory parameters
        if (!videoId) {
            return res.status(400).json({ error: 'Missing videoId parameter' });
        }

        // Validate time parameters if provided
        if (startTime || endTime) {
            if (!startTime || !endTime) {
                return res.status(400).json({ error: 'Both startTime and endTime are required for trimming' });
            }
            
            const start = parseFloat(startTime);
            const end = parseFloat(endTime);
            if (isNaN(start) || isNaN(end) || start < 0 || end <= start) {
                return res.status(400).json({ error: 'Invalid time parameters' });
            }
        }

        // Initialize Apify client
        const client = new ApifyClient({
            token: 'apify_api_nab0lCh4gbecmhTUOU9SeORpvXHuIy0pI0LN'
        });

        // Generate unique filenames to prevent conflicts
        originalFilePath = path.join(__dirname, `temp-${tempId}-original.mp4`);
        trimmedFilePath = path.join(__dirname, `temp-${tempId}-trimmed.mp4`);

        // Fetch video info from Apify
        const run = await client.actor("y1IMcEPawMQPafm02").call({
            startUrls: [`https://www.youtube.com/watch?v=${videoId}`],
            proxy: { useApifyProxy: true }
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        if (!items?.[0]?.downloadUrl) {
            return res.status(404).json({ error: 'Video download URL not found' });
        }

        // Download the video
        const videoUrl = items[0].downloadUrl;
        console.log(`Downloading from: ${videoUrl}`);
        
        const response = await axios({
            url: videoUrl,
            method: 'GET',
            responseType: 'stream',
            timeout: 30000 // 30-second timeout
        });

        // Save to file with error handling
        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(originalFilePath);
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.pipe(writer);
        });

        // Verify downloaded file
        const stats = fs.statSync(originalFilePath);
        if (stats.size === 0) {
            throw new Error('Downloaded file is empty');
        }

        // Process trimming if requested
        if (startTime && endTime) {
            const start = parseFloat(startTime);
            const end = parseFloat(endTime);
            const duration = end - start;

            console.log(`Trimming from ${start}s to ${end}s...`);
            
            await new Promise((resolve, reject) => {
                ffmpeg(originalFilePath)
                    .inputOptions([`-ss ${start}`])
                    .outputOptions([`-t ${duration}`])
                    .on('start', (cmd) => console.log(`FFmpeg command: ${cmd}`))
                    .on('progress', (p) => console.log(`Processing: ${Math.round(p.percent)}%`))
                    .on('end', resolve)
                    .on('error', reject)
                    .save(trimmedFilePath);
            });

            // Verify trimmed file
            if (!fs.existsSync(trimmedFilePath) || fs.statSync(trimmedFilePath).size === 0) {
                throw new Error('Trimmed file creation failed');
            }
        }

        // Send appropriate file
        const outputFile = startTime && endTime ? trimmedFilePath : originalFilePath;
        const fileName = startTime && endTime 
            ? `trimmed-${videoId}.mp4` 
            : `full-${videoId}.mp4`;

        res.download(outputFile, fileName, (err) => {
            cleanupFiles();
            if (err) console.error('Download completion error:', err);
        });

    } catch (error) {
        console.error('Processing failed:', error);
        cleanupFiles();
        
        if (!res.headersSent) {
            const statusCode = error.response?.status || 500;
            res.status(statusCode).json({ 
                error: error.message || 'Video processing failed',
                details: error.response?.data || undefined
            });
        }
    }
}