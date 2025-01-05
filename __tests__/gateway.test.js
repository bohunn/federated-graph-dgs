// __tests__/gateway.test.js
const request = require('supertest');
const { startApolloGateway } = require('../index');
const { startMockSubgraph } = require('./mockSubgraph');

let gatewayServer;
let subgraph;

beforeAll(async () => {
    // 1. Start Mock Subgraph on port 4010
    subgraph = await startMockSubgraph(4010);

    // 2. Start Gateway
    gatewayServer = await startApolloGateway();
});

afterAll(async () => {
    // 1. Stop the Gateway
    if (gatewayServer && gatewayServer.close) {
        gatewayServer.close();
    }
    // 2. Stop Mock Subgraph
    if (subgraph && subgraph.stop) {
        await subgraph.stop();
    }
});

describe('Apollo Gateway Tests', () => {
    test('GET /actuator should return 200', async () => {
        const response = await request(gatewayServer).get('/actuator');
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
    });

    test('GET /actuator/gateway-health should return 200 and status: "UP"', async () => {
        const response = await request(gatewayServer).get('/actuator/gateway-health');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'UP');
    });

    test('POST /graphql (Gateway -> Mock Subgraph) should return valid result', async () => {
        const query = `
      query {
        hello
      }
    `;
        const response = await request(gatewayServer)
            .post('/graphql')
            .send({ query });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toEqual({ hello: 'Hello from mock subgraph on port 4010!' });
    });
});