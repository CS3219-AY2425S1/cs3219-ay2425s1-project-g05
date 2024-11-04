import { io } from 'socket.io-client';
import assert from 'assert';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import { server } from '../server.js';

describe('Test connection', function () {

    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    const URL = 'http://localhost:8002';

    it('should establish a WebSocket connection', function (done) {
        this.timeout(5000); // Increase timeout to 5000ms
        const client = io(URL, {
            path: '/api/matching-service',  // specify the custom path
            transports: ['websocket'],      // enforce websocket transport
            withCredentials: true,          // allow credentials for CORS
        });
        client.on('disconnect', () => {
            console.log(`Client disconnected`);
            assert.strictEqual(client.connected, false);
            done();
        });
        client.on('connect', () => {
            console.log(`Client connected: ${client.id}`);
            assert.strictEqual(client.connected, true);
            client.disconnect();
        });

    });

});
