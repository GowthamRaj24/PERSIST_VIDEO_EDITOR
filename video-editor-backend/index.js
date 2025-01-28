import express from 'express';
import cors from 'cors';
import routes from './routes/videos.js';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use("/" , (req, res) => {
    res.send("Welcome to Video Editor Backend");
});

app.use('/api/v1', routes);



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
