import assert from 'assert';
import app from '../server.js';
import request from 'supertest';
import { clearMockDb, connectMockDb, disconnectMockDb } from './mockdb.js';
import sinon from 'sinon';
import UserModel from '../models/user-model.js';

describe('Test getUser', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 400 status code when invalid user Id given', async function () {
        const res = await request(app)
            .get('/api/user-service/users/123')
            .expect(400)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Invalid user Id given', 'Response message does not match');
    });

    it('Respond with 404 status code when user is not found', async function () {
        const res = await request(app)
            .get('/api/user-service/users/313233343536373839303132') // valid id but not in mock db
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'User not found', 'Response message does not match');
    });

    it('Respond with 200 status code when user is found', async function () {

        // Register a user first
        await request(app)
            .post('/api/user-service/users/')
            .send({
                email: 'test1@email.com',
                displayName: 'test1',
                password: 'abcde123'
            })
            .expect(201)

        // Get the mongoose user object id
        const user = await UserModel.findOne({ email: 'test1@email.com' });
        const userId = user._id.toString();

        const res = await request(app)
            .get(`/api/user-service/users/${userId}`)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'User found by id', 'Response message does not match');

        // Deep equal to compare user object from response and user object from mock db
        assert.deepEqual({
            email: res.body.data.user.email,
            displayName: res.body.data.user.displayName,
            _id: res.body.data.user._id.toString(),
            __v: res.body.data.user.__v,
            isAdmin: res.body.data.user.isAdmin,
            isDeleted: res.body.data.user.isDeleted
        }, {
            email: user.email,
            displayName: user.displayName,
            _id: user._id.toString(),
            __v: user.__v,
            isAdmin: user.isAdmin,
            isDeleted: user.isDeleted
        }, 'Response data does not match');


    });

    it('Respond with 500 status code when there is a server error', async function () {
        // Stub the findOne method to throw an error
        const findStub = sinon.stub(UserModel, 'findOne').throws(new Error('Simulated Mongoose error'));

        const res = await request(app)
            .get('/api/user-service/users/313233343536373839303132') // valid id but not in mock db
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Unknown server error', 'Response message does not match');

        findStub.restore();
    });
});