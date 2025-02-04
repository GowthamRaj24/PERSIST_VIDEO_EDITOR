import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// HTML email template
const createEmailTemplate = (videoTitle, downloadLink, thumbnailUrl) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Video is Ready!</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                padding: 20px 0;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                color: white;
                border-radius: 8px 8px 0 0;
            }
            .content {
                padding: 20px;
                color: #333;
            }
            .video-preview {
                width: 100%;
                max-width: 500px;
                margin: 20px auto;
                border-radius: 8px;
                overflow: hidden;
            }
            .video-preview img {
                width: 100%;
                height: auto;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                margin: 20px 0;
                text-align: center;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
            }
            .footer {
                text-align: center;
                padding: 20px;
                color: #666;
                font-size: 0.9em;
            }
            @media only screen and (max-width: 600px) {
                .container {
                    margin: 10px;
                    width: auto;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Your Video is Ready! 🎉</h1>
            </div>
            <div class="content">
                <h2>Hello!</h2>
                <p>Great news! Your video "${videoTitle}" has been successfully generated and is ready for download.</p>
                
                ${thumbnailUrl ? `
                <div class="video-preview">
                    <img src="${thumbnailUrl}" alt="Video Thumbnail">
                </div>
                ` : ''}
                
                <p>Click the button below to download your video:</p>
                
                <a href="${downloadLink}" class="button">
                    Download Video
                </a>
                
                <p>This download link will expire in 24 hours for security reasons.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} Persist Clip Smart AI. All rights reserved.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const sendEmail = async (req, res) => {
    try {
        const { email, videoTitle, downloadLink, thumbnailUrl } = req.body;

        if (!email || !videoTitle || !downloadLink) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const transporter = createTransporter();

        const info = await transporter.sendMail({
            from: `"Persist Clip Smart AI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🎥 Your Video is Ready for Download! 🎉',
            html: createEmailTemplate(videoTitle, downloadLink, thumbnailUrl),
            headers: {
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                Importance: 'high'
            }
        });

        console.log('Email sent successfully:', info.messageId);

        res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Email sending error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: process.env.NODE_ENV === 'production' ? 'Email service error' : error.message
        });
    }
};

export default sendEmail;
