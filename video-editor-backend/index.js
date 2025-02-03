import express from 'express';
import cors from 'cors';
import routes from './routes/videos.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors({
    origin:"*",
    credentials: true
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Main routes
app.use('/', routes);



// Start server
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
