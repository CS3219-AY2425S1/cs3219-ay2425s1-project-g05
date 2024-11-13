import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import sinon from 'sinon';
import UserModel from '../models/user-model.js';
import { accessTokensNoExpiry } from './constants/testTokens.js';

describe('Test changePassword', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 400 status code when email is missing from token', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.missingEmail}`)
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email, password and newPassword are required', 'Response message does not match');
    });

    it('Respond with 400 status code when password is missing', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .send({ newPassword: 'newPassword123' })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email, password and newPassword are required', 'Response message does not match');
    });

    it('Respond with 400 status code when newPassword is missing', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .send({ password: 'oldPassword' })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email, password and newPassword are required', 'Response message does not match');
    });


    it('Respond with 404 status code when user is not found', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .send({ password: 'oldPassword', newPassword: 'newPassword123' })
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'User not found', 'Response message does not match');
    });

    it('Respond with 401 status code when old password is incorrect', async function () {
        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201)

        // Login the user to get the access token
        const res1 = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(200)
            .expect('Content-Type', /json/);
        const accessToken = res1.headers['set-cookie'].find(cookie => cookie.startsWith('accessToken=')).split(';')[0].split('=')[1];

        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'wrongOldPassword', newPassword: 'newPassword123' })
            .expect(401)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Incorrect old password needed to change password', 'Response message does not match');
    });

    it('Respond with 400 status code when new password does not meet strength requirements', async function () {
        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201)

        // Login the user to get the access token
        const res1 = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(200)
            .expect('Content-Type', /json/);
        const accessToken = res1.headers['set-cookie'].find(cookie => cookie.startsWith('accessToken=')).split(';')[0].split('=')[1];

        // New password is too short
        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'abcde123', newPassword: 'short' })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');

        // New password does not have alphabets
        const res2 = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'abcde123', newPassword: '12345678' })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res2.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');

        // New password does not have numbers
        const res3 = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'abcde123', newPassword: 'abcdefgh' })
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res3.body.message, 'Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers', 'Response message does not match');
    });

    it('Respond with 200 status code when password is changed successfully', async function () {
        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201)

        // Login the user to get the access token
        const res1 = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(200)
            .expect('Content-Type', /json/);
        const accessToken = res1.headers['set-cookie'].find(cookie => cookie.startsWith('accessToken=')).split(';')[0].split('=')[1];

        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'abcde123', newPassword: 'newPassword123' })
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'User password updated successfully', 'Response message does not match');
    });

    it('Respond with 500 status code when there is an unknown server error', async function () {
        // Stub the update method of the UserModel to throw an error
        const updateStub = sinon.stub(UserModel, 'findOneAndUpdate').throws(new Error('Simulated Mongoose error'));

        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201)

        // Login the user to get the access token
        const res1 = await request(app)
            .post('/api/user-service/users/login')
            .send({
                email: 'test1@email.com',
                password: 'abcde123'
            })
            .expect(200)
            .expect('Content-Type', /json/);
        const accessToken = res1.headers['set-cookie'].find(cookie => cookie.startsWith('accessToken=')).split(';')[0].split('=')[1];

        const res = await request(app)
            .put('/api/user-service/users/changePassword')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ password: 'abcde123', newPassword: 'newPassword123' })
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Unknown server error', 'Response message does not match');

        updateStub.restore(); // Restore the stub
    });
});