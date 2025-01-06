// index.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const actuator = require('express-actuator');
const bodyParser = require('body-parser');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloGateway } = require('@apollo/gateway');

async function startApolloGateway() {
    // Load entire config
    const configFilePath = path.join(__dirname, 'gateway-config.json');
    const configFile = fs.readFileSync(configFilePath, 'utf8');
    const config = JSON.parse(configFile);

    // Create gateway
    const gateway = new ApolloGateway({
        serviceList: config.subgraphs,
    });

    // Actuator options
    const actuatorOptions = {
        basePath: '/actuator',
        infoGitMode: 'simple',
        infoBuildOptions: null,
        customEndpoints: [
            {
                id: 'gateway-health',
                controller: async (req, res) => {
                    try {
                        // Minimal custom check
                        const health = {
                            status: 'UP',
                            gateway: {
                                status: 'UP',
                                timestamp: new Date().toISOString(),
                            },
                            details: {
                                subgraphCount: config.subgraphs.length,
                            },
                        };
                        res.json(health);
                    } catch (error) {
                        res.status(503).json({
                            status: 'DOWN',
                            error: error.message,
                        });
                    }
                },
            },
        ],
    };

    // Init Apollo Server
    const server = new ApolloServer({
        gateway,
        subscriptions: false,
        debug: true,
    });

    // Start Apollo
    await server.start();

    // Express app
    const app = express();
    app.use(actuator(actuatorOptions));

    app.use('/graphql', bodyParser.json(), expressMiddleware(server));

    // Start listening
    const port = config?.gateway?.port || 4000;
    // Return the server instance so we can close it in tests
    return app.listen(port, () => {
        console.log(`\n🚀 Apollo Gateway is running at http://localhost:${port}/graphql`);
        console.log(`Health endpoints available at http://localhost:${port}/actuator`);
    });
}

module.exports = { startApolloGateway };

(async () => {
    try {
      await startApolloGateway();
    } catch (err) {
      console.error('Failed to start Apollo Gateway:', err);
    }
  })();