const {ApolloServer} = require('@apollo/server');
const {expressMiddleware} = require('@apollo/server/express4');
const {ApolloGateway, IntrospectAndCompose} = require('@apollo/gateway');
const express = require('express');
const actuator = require('express-actuator');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

// Create gateway instance
const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
        subgraphs: config.subgraphs,
        debug: config.gateway.debug
    })
});

const app = express();

// Configure actuator options
const actuatorOptions = {
    basePath: '/actuator', // Base path for actuator endpoints
    infoGitMode: 'simple', // Include git information in /info endpoint
    infoBuildOptions: null, // Additional build information
    customEndpoints: [
        {
            id: 'gateway-health', // Custom endpoint id
            controller: async (req, res) => {
                // Custom health check logic for the gateway
                try {
                    // You can add custom health checks here
                    const health = {
                        status: 'UP',
                        gateway: {
                            status: 'UP',
                            timestamp: new Date().toISOString()
                        },
                        details: {
                            subgraphCount: config.subgraphs.length
                        }
                    };
                    res.json(health);
                } catch (error) {
                    res.status(503).json({
                        status: 'DOWN',
                        error: error.message
                    });
                }
            }
        }
    ]
};

// Add actuator middleware before other routes
app.use(actuator(actuatorOptions));

(async () => {
    const server = new ApolloServer({
        gateway,
        subscriptions: false,
        debug: true,
        tracing: true,
    });

    await server.start();

    app.use(
        '/graphql',
        cors(),
        bodyParser.json(),
        expressMiddleware(server),
    );

    const httpServer = http.createServer(app);

    httpServer.listen({port: config.gateway.port}, () => {
        console.log(`🚀 Apollo Gateway is running at http://localhost:${config.gateway.port}/graphql`);
        console.log(`Health endpoints available at http://localhost:${config.gateway.port}/actuator`);
    });
})();