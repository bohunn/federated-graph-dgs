// __tests__/mockSubgraph.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { gql } = require('graphql-tag');

/**
 * Creates a mock subgraph server on the specified port
 * @param {number} port
 * @returns {Promise<{ server: ApolloServer, stop: function }>}
 */
async function startMockSubgraph(port) {
    const typeDefs = gql`
        type Query {
            hello: String
        }
    `;

    const resolvers = {
        Query: {
            hello: () => `Hello from mock subgraph on port ${port}!`,
        },
    };

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });

    // Start a standalone server (so we can stop it manually later)
    const { url } = await startStandaloneServer(server, {
        listen: { port },
    });

    console.log(`Mock subgraph is running at ${url}`);

    // Return server & a stop function
    return {
        server,
        stop: async () => {
            await server.stop();
            console.log(`Mock subgraph on port ${port} stopped`);
        },
    };
}

module.exports = { startMockSubgraph };

