import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Internal API Documentation',
            version: '1.0.0',
            description: 'API documentation for the Internal project including CMMS, Authentication, and Internal modules.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/authentication/**/*.js', './src/routes/**/*.js', './src/internal/**/*.js', './src/cmms/**/*.js', './src/cmms/**/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`🚀 Swagger UI available at http://localhost:3009/api-docs`);
};
