require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        maxOutputTokens: 1024
    }
});

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Generate and display QR code for WhatsApp Web authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Please scan the QR code with your WhatsApp app');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Handle incoming messages
client.on('message', async (message) => {
    try {
        // Ignore messages from groups and broadcast lists
        if (message.isGroupMsg || message.broadcast) return;

        console.log(`Received message from ${message.from}: ${message.body}`);

        // Generate AI response using Gemini
        const prompt = `As a helpful AI assistant, please provide a concise response to this message: ${message.body}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text().trim();

        // Send the AI-generated response
        await message.reply(text);
        console.log(`Sent response to ${message.from}: ${text}`);

    } catch (error) {
        console.error('Error processing message:', error);
        await message.reply('Sorry, I encountered an error while processing your message.');
    }
});

// Handle errors
client.on('auth_failure', () => {
    console.error('Authentication failed');
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
});

// Initialize the client
client.initialize();