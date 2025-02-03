import youtubedl from 'youtube-dl-exec';
import ffmpeg from "fluent-ffmpeg";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs-extra";

const generateVideo = async (req, res) => {
    const { clips } = req.body;
    const outputDir = path.join(process.cwd(), "temp", uuidv4()); // Create unique directory for each request
    const outputFileName = `merged-${uuidv4()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    try {
        // Create fresh directory
        await fs.ensureDir(outputDir);
        
        // Process clips sequentially instead of parallel
        const trimmedPaths = [];
        for (let i = 0; i < clips.length; i++) {
            const clip = clips[i];
            const tempPath = path.join(outputDir, `temp-${i}.mp4`);
            const trimmedPath = path.join(outputDir, `temp-${i}-trimmed.mp4`);

            console.log(`Processing clip ${i + 1}...`);

            try {
                // Download with better options
                await youtubedl(`https://www.youtube.com/watch?v=${clip.videoId}`, {
                    output: tempPath,
                    format: 'b',
                    noCheckCertificates: true,
                    noWarnings: true,
                    preferFreeFormats: true
                });
                console.log("Downloaded video", tempPath);

                console.log()
                await new Promise(resolve => setTimeout(resolve, 1000));

                await new Promise((resolve, reject) => {
                    ffmpeg(tempPath)
                        .setStartTime(parseFloat(clip.startTime))
                        .setDuration(parseFloat(clip.endTime) - parseFloat(clip.startTime))
                        .output(trimmedPath)
                        .on('end', resolve)
                        .on('error', reject)
                        .run();
                });

                // Clean up original file
                await fs.remove(tempPath);
                trimmedPaths.push(trimmedPath);

            } catch (error) {
                console.error(`Failed to process clip ${i + 1}:`, error);
                console.log("Error" , error);
                throw error;
            }
        }

        // Merge videos
        const command = ffmpeg();
        trimmedPaths.forEach(path => {
            command.input(path);
        });

        await new Promise((resolve, reject) => {
            command
                .on('end', resolve)
                .on('error', reject)
                .mergeToFile(outputPath, outputDir);
        });

        const videoBuffer = await fs.readFile(outputPath);

        // Clean up all files
        await fs.remove(outputDir);
        console.log("Video generated successfully");

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': videoBuffer.length
        });
        res.end(videoBuffer);

    } catch (error) {
        // Clean up in case of error
        await fs.remove(outputDir).catch(console.error);
        console.log("Error" , error);
        
        return res.status(500).json({
            success: false,
            message: "Failed to generate video",
            error: error.message
        });
    }
};

export default generateVideo;
