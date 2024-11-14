import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import sinon from 'sinon';

describe('Test logout', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 200 status code when logout is successful', async function () {
        const res = await request(app)
            .post('/api/user-service/users/logout')
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Logout successful', 'Response message does not match');
    });

    it('Respond with 500 status code when there is an unknown server error', async function () {
        // Stub the clearCookie method to throw an error
        const clearCookieStub = sinon.stub(app.response, 'clearCookie').throws(new Error('Simulated clear cookie error'));

        const res = await request(app)
            .post('/api/user-service/users/logout')
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Unknown server error', 'Response message does not match');

        clearCookieStub.restore(); // Restore the stub
    });
});