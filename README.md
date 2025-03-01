# AGENTIC-AI

API Documentation

Endpoints

1. GET /api/questionary

Description:
Returns a structured questionnaire in JSON format.


2. POST /api/message

Description:
Processes a message request with AI-generated responses.

Accepted Parameters:

model: (string) The AI model to use (e.g., gpt-3.5-turbo)

messages: (array) A list of message objects containing role and content

stream: (boolean) Whether to stream responses (default: true)

temperature: (float) Controls randomness of response

top_p: (float) Sampling parameter

max_tokens: (integer) Maximum response length

presence_penalty: (float) Encourages new topics

frequency_penalty: (float) Discourages repetition

logit_bias: (object) Biasing towards certain words

user: (string) User identifier


-- Example cURL Request:

curl --location 'http://localhost:3000/api/message' \
--header 'Content-Type: application/json' \
--data '{
    "messages": [
        {
            "role": "system",
            "content": "You are a helpful AI assistant."
        },
        {
            "role": "user",
            "content": "write essay for rain"
        }
    ],
    "stream": true
}'