import { OAuth2Client } from 'google-auth-library';

const CLIENT_ID = "512985968225-spjsieiujhbnjcbi8cf1l7lfnpqnles0.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
// const REDIRECT_URI = "https://persist-video-editing-studio.netlify.app";
const REDIRECT_URI = "http://localhost:3000";

const oauth2Client = new OAuth2Client(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Generate authentication URL
export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.force-ssl']
    });
};

// Get tokens from code
export const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
};

export default oauth2Client;
