import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agentic AI API',
      version: '1.0.0',
      description: 'API documentation for Agentic AI Backend',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Development Server',
      },
      {
        url: 'https://agentic-ai-be.onrender.com',
        description: 'Production Server',
      },
    ],
  },
  apis: ['./router/*.js'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);
