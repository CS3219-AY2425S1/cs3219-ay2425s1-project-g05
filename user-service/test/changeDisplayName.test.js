import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import sinon from 'sinon';
import UserModel from '../models/user-model.js';
import { accessTokensNoExpiry } from './constants/testTokens.js';

describe('Test changeDisplayName', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 400 status code when email is missing from token', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changeDisplayName')
            .send({ newDisplayName: 'newDisplayName' })
            .set('Cookie', `accessToken=${accessTokensNoExpiry.missingEmail}`)
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email and newDisplayName are required', 'Response message does not match');
    });
    //

    it('Respond with 400 status code when newDisplayName is missing', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changeDisplayName')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Email and newDisplayName are required', 'Response message does not match');
    });

    it('Respond with 404 status code when user is not found', async function () {
        const res = await request(app)
            .put('/api/user-service/users/changeDisplayName')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .send({ email: 'nonexistent@email.com', newDisplayName: 'newDisplayName' })
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'User not found', 'Response message does not match');
    });

    it('Respond with 200 status code when display name is changed successfully', async function () {
        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201);

        // Get the mongoose user object id
        const user = await UserModel.findOne({ email: 'test1@email.com' });
        const userId = user._id.toString();

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

        const res2 = await request(app)
            .put('/api/user-service/users/changeDisplayName')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ newDisplayName: 'newDisplayName' })
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res2.body.message, 'User display name updated successfully', 'Response message does not match');

        // Check if the display name is updated in the database
        const updatedUser = await UserModel.findById(userId);
        assert.equal(updatedUser.displayName, 'newDisplayName', 'Display name is not updated in the database');
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
            .expect(201);

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

        const res2 = await request(app)
            .put('/api/user-service/users/changeDisplayName')
            .set('Cookie', `accessToken=${accessToken}`)
            .send({ newDisplayName: 'newDisplayName' })
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res2.body.message, 'Unknown server error', 'Response message does not match');

        updateStub.restore(); // Restore the stub
    });
});