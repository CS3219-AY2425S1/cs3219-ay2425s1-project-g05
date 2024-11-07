import app from '../index.js';
import request from 'supertest';
import assert from 'assert';
import { connectMockDb, disconnectMockDb, clearMockDb } from './mockdb.js';
import { sampleQuestions, accessTokensNoExpiry } from './constants/data.js';
import Question from '../models/model.js';
import sinon from 'sinon';

describe('Test geQuestionById', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 403 status code when no token is provided', async function () {
        const res = await request(app)
            .delete('/api/question-service/id/123')
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Access Token not found', 'Response message does not match');
    });

    it('Respond with 403 status code when non-admin token is provided', async function () {
        const res = await request(app)
            .delete('/api/question-service/id/123')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Non-admin users are not allowed to perform this action', 'Response message does not match');
    });

    it('Respond with 404 status code when given invalid id', async function () {
        const res = await request(app)
            .delete('/api/question-service/id/123')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Question not found', 'Response message does not match');
    });

    it('Respond with 404 status code when valid id but nonexistent question', async function () {
        const res = await request(app)
            .delete('/api/question-service/id/313233343536373839303132')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Question not found', 'Response message does not match');
    });

    it('Respond with 404 status code when only deleted questions in db', async function () {
        // Insert a deleted question into the database
        const question = await Question.create({ ...sampleQuestions.validQuestion1, isDeleted: true });
        const id = question._id.toString();

        const res = await request(app)
            .delete(`/api/question-service/id/${id}`)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Question not found', 'Response message does not match');
    });

    it("Respond with 200 status code with valid question id, check if categories and meta is added in response and isDeleted is true", async function () {
        // Insert a question into the database
        const question = await Question.create(sampleQuestions.validQuestion1);
        const id = question._id.toString();

        const res = await request(app)
            .delete(`/api/question-service/id/${id}`)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.deepEqual(res.body.data.question.categories, ['ARRAYS', 'ALGORITHMS'], 'Wrong categories mapped');
        assert(res.body.data.question.hasOwnProperty('meta'), 'Field "meta" does not exist');
        assert.equal(res.body.data.question.isDeleted, true, 'Question is not deleted successfully');
        assert.equal(res.body.message, "Question deleted successfully", 'Response length does not match');
    });

    it('Respond with 500 status code when there is an unknown server error, find method stub', async function () {
        // Stub the findOne method of model to throw an error
        const findStub = sinon.stub(Question, 'find').throws(new Error('Simulated Mongoose error'));

        const res = await request(app)
            .delete('/api/question-service/id/313233343536373839303132')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Error deleting question', 'Response message does not match');

        findStub.restore(); // Restore the stub
    });

    it('Respond with 500 status code when there is an unknown server error, findByIdAndUpdate method stub', async function () {
        // Stub the findOne method of model to throw an error
        const findByIdAndUpdateStub = sinon.stub(Question, 'findByIdAndUpdate').throws(new Error('Simulated Mongoose error'));

        const question = await Question.create(sampleQuestions.validQuestion1);
        const id = question._id.toString();

        const res = await request(app)
            .delete(`/api/question-service/id/${id}`)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Error deleting question', 'Response message does not match');

        findByIdAndUpdateStub.restore(); // Restore the stub
    });

});