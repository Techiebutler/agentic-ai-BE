import { PassThrough } from 'stream';
import OpenAI from 'openai';
import fs from "fs"
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.CHAT_GPT_API_KEY
});

const message = async (req, res) => {
    try {
        const {
            model = "gpt-3.5-turbo",
            messages,
            stream = true,
            temperature,
            top_p,
            max_tokens,
            presence_penalty,
            frequency_penalty,
            logit_bias,
            user

        } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: "Messages array is required and cannot be empty" });
        }

        const response = await openai.chat.completions.create({
            model,
            messages,
            stream,
            ...(temperature !== undefined && { temperature }),
            ...(top_p !== undefined && { top_p }),
            ...(max_tokens !== undefined && { max_tokens }),
            ...(presence_penalty !== undefined && { presence_penalty }),
            ...(frequency_penalty !== undefined && { frequency_penalty }),
            ...(logit_bias !== undefined && { logit_bias }),
            ...(user !== undefined && { user })
        });

        let fullResponse = "";

        for await (const part of response) {
            if (part.choices[0]?.delta?.content) {
                const messageChunk = part.choices[0].delta.content;

                const formattedChunk = messageChunk.replace(/\n\n/g, "\n");

                fullResponse += formattedChunk;
                res.write(formattedChunk);
            }
        }

        res.end();
    } catch (error) {
        console.error("Error in message handler:", error);
        return res.status(error.response?.status || 500).json({
            error: error.response?.data?.error?.message || "Internal Server Error",
        });
    }
};


const questionary = (req, res) => {
    try {
        const jsonData = fs.readFileSync('data.json', 'utf-8');
        const parsedData = JSON.parse(jsonData);

        return res.status(200).json({ status: "success", message: "Get details", data: parsedData });

    } catch (error) {
        console.error("Error in message handler:", error);
        return res.status(error.response?.status || 500).json({
            error: error.response?.data?.error?.message || "Internal Server Error",
        });
    }
};
export {
    questionary,
    message
}