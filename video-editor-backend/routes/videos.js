import express from 'express';
import multer from 'multer';
import { getDriveTranscript, getTranscript } from '../controller/getTranscript.js';
import { generateVideoScript, customizeScript, translateScript } from '../controller/claudAI.js';
import { handleExternalVideo, handleLocalVideo, handleYoutubePlaylist, handleYoutubeVideo } from '../controller/uploadVideo.js';
import handler from '../controller/download-clip.js';

const router = express.Router();
import generateVideo from '../controller/generateVideo.js';

// Configure multer storage
const storage = multer.diskStorage({
    destination: './uploads/videos',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Configure multer upload
const upload = multer({ 
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'));
        }
    }
});


// Video Processing Routes
router.post('/video/youtube', handleYoutubeVideo);
router.post('/video/playlist', handleYoutubePlaylist);
router.post('/video/upload', upload.single('video'), handleLocalVideo);
router.post('/video/generate', generateVideo);

// Transcript Generation Routes
router.post('/transcript/generate', getTranscript);
router.post('/transcript/drive', getDriveTranscript);
router.get('/download-clip', handler);


router.post('/script/generate', generateVideoScript);
router.post('/script/customize', customizeScript);
router.post('/script/translate', translateScript);

export default router;
