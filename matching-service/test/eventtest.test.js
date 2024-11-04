import { io } from 'socket.io-client';
import assert from 'assert';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import { server } from '../server.js';

describe('WebSocket Server with Multiple Clients', function () {

    let client;

    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    beforeEach(async () => {
        client = io(URL, {
            path: '/api/matching-service',  // specify the custom path
            transports: ['websocket'],      // enforce websocket transport
            withCredentials: true,          // allow credentials for CORS
        });
        client.on('connect', () => {
            console.log(`Client connected: ${client.id}`);
            assert.strictEqual(client.connected, true);
        });
    });
    afterEach(async () => {
        await clearMockDb() // Clear the database after each test
        client.on('disconnect', () => {
            console.log(`Client disconnected`);
            assert.strictEqual(client.connected, false);
        });
        client.disconnect();
    });

    const URL = 'http://localhost:8002';

    it('check test event', function (done) {
        client.on('test', (data) => {
            console.log('data in test:', data);
            assert.strictEqual(data, `Test event received with data: testdata`);
            done();
        });
        client.emit('test', 'testdata');
    });

    it('check test event 2', function (done) {
        client.on('test', (data) => {
            console.log('data in test:', data);
            assert.strictEqual(data, `Test event received with data: testdata222`);
            done();
        });
        client.emit('test', 'testdata222');
    });

});