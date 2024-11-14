import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import sinon from 'sinon';
import UserModel from '../models/user-model.js';

describe('Test login', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 400 status code when email is missing', async function () {
        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                password: 'abcde123'
            })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email and password are required', 'Response message does not match');
    });

    it('Respond with 400 status code when password is missing', async function () {
        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com'
            })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email and password are required', 'Response message does not match');
    });

    it('Respond with 401 status code when email is incorrect', async function () {
        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'wrong@email.com',
                password: 'abcde123'
            })
            .expect(401)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Incorrect email or password', 'Response message does not match');
    });

    it('Respond with 401 status code when password is incorrect', async function () {
        // Create a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201);

        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'wrongpassword'
            })
            .expect(401)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Incorrect email or password', 'Response message does not match');
    });

    it('Respond with 200 status code with success message', async function () {
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201);
            
        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(200)
            .expect('Content-Type', /json/);

        assert.equal(res.header['set-cookie'][0].includes('accessToken'), true, 'Access token cookie not found');        
        assert.equal(res.body.message, 'Login successful', 'Response message does not match');
    });

    it('Respond with 500 status code when there is an unknown server error', async function () {
        // Stub the findOne method of UserModel to throw an error
        const findOneStub = sinon.stub(UserModel, 'findOne').throws(new Error('Simulated Mongoose error'));

        const res = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Unknown server error', 'Response message does not match');

        findOneStub.restore(); // Restore the stub
    });
});