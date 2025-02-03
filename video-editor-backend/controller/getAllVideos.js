import fetch from "node-fetch";

import dotenv from 'dotenv';
dotenv.config();

const getPlaylistVideos = async (req, res) => {
    const { playlistUrl } = req.body;
    
    const getPlaylistId = (url) => {
        const urlParams = new URL(url).searchParams;
        return urlParams.get("list");
    };

    const playlistId = getPlaylistId(playlistUrl);
    if (!playlistId) {
        return res.status(400).json({
            success: false,
            message: "Invalid playlist URL. Could not extract playlist ID."
        });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    const baseUrl = `https://www.googleapis.com/youtube/v3/playlistItems`;
    const url = `${baseUrl}?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;
    let nextPageToken = "";
    let videoLinks = [];

    console.log(url)
    try {
        do {
            const response = await fetch(`${url}&pageToken=${nextPageToken}`);
            const data = await response.json();
            console.log(data);

            if (!data.items) {
                return res.status(400).json({
                    success: false,
                    message: "Error fetching playlist videos",
                    error: data.error
                });
            }

            data.items.forEach((item) => {
                const videoId = item.snippet.resourceId.videoId;
                videoLinks.push({
                    videoId,
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    title: item.snippet.title
                });
            });

            nextPageToken = data.nextPageToken || "";
        } while (nextPageToken);

        return res.status(200).json({
            success: true,
            videos: videoLinks,
            message: "Playlist videos fetched successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch playlist videos",
            error: error.message
        });
    }
};

export default getPlaylistVideos;
