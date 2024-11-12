const {ApolloServer} = require('@apollo/server');
const {expressMiddleware} = require('@apollo/server/express4');
const {ApolloGateway, IntrospectAndCompose} = require('@apollo/gateway');
const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');

const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
        subgraphs: config.subgraphs,
        debug: config.gateway.debug
    })
});;

const app = express();
(async () => {
    const server = new ApolloServer({
        gateway,
        // Disable subscriptions (Apollo Gateway does not support subscriptions)
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
    });
})();

