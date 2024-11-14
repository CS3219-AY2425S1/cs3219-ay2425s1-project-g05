import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';

describe('Test healthz', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 200 status code with success message', async function () {
        const res = await request(app)
            .get('/healthz')
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Connected to /healthz route of user-service', 'Response message does not match');
    });
});