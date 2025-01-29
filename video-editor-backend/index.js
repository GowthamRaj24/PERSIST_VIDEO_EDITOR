import express from 'express';
import cors from 'cors';
import routes from './routes/videos.js';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Configure CORS for both development and production
app.use(cors({
    origin:"*",
    credentials: true
}));

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Main routes
app.use('/', routes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
