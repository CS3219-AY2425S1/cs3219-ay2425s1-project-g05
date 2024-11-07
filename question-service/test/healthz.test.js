import app from '../index.js';
import request from 'supertest';
import assert from 'assert';

describe('Test healthz', function () {
    it('Respond with 200 status code with success message', async function () {
        const res = await request(app)
            .get('/healthz')
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Connected to /healthz route of question-service', 'Response message does not match');
    });
});