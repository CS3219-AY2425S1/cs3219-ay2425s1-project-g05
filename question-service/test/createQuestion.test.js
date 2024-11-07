import app from '../index.js';
import request from 'supertest';
import assert from 'assert';
import { connectMockDb, disconnectMockDb, clearMockDb } from './mockdb.js';
import { sampleQuestions, accessTokensNoExpiry } from './constants/data.js';
import Question from '../models/model.js';
import sinon from 'sinon';

describe('Test createQuestion', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 403 status code when no token is provided', async function () {
        const res = await request(app)
            .post('/api/question-service/')
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Access Token not found', 'Response message does not match');
    });

    it('Respond with 403 status code when non-admin token is provided', async function () {
        const res = await request(app)
            .post('/api/question-service/')
            .set('Cookie', `accessToken=${accessTokensNoExpiry.validCredentials}`)
            .expect(403)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Non-admin users are not allowed to perform this action', 'Response message does not match');
    });

    it('Respond with 409 status code when create exact same question', async function () {
        const question = await Question.create(sampleQuestions.validQuestion1);

        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion1 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(409)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'A question with this description already exists', 'Response message does not match');
    });

    it('Respond with 409 status code when create diff question but same description', async function () {
        const question = await Question.create(sampleQuestions.validQuestion1);

        // remove meta from question to send as body, copy description from question 1
        const descr = { ...sampleQuestions.validQuestion1.description };
        const q = { ...sampleQuestions.validQuestion2, description: descr };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(409)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'A question with this description already exists', 'Response message does not match');
    });

    it('Respond with 201 status code when create diff question but same title diff difficulty', async function () {
        const question = await Question.create(sampleQuestions.validQuestion1);

        // remove meta from question to send as body, copy title and difficulty from question 1
        const q = {
            ...sampleQuestions.validQuestion2,
            title: sampleQuestions.validQuestion1.title,
            difficulty: "HARD"
        };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });

    it('Respond with 201 status code when create diff question but same difficulty diff title', async function () {
        const question = await Question.create(sampleQuestions.validQuestion1);

        // remove meta from question to send as body, copy title and difficulty from question 1
        const q = {
            ...sampleQuestions.validQuestion2,
            difficulty: sampleQuestions.validQuestion1.difficulty
        };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });


    it('Respond with 409 status code when create diff question but same difficulty', async function () {
        const question = await Question.create(sampleQuestions.validQuestion1);

        // remove meta from question to send as body, copy title and difficulty from question 1
        const q = {
            ...sampleQuestions.validQuestion2,
            title: sampleQuestions.validQuestion1.title,
            difficulty: sampleQuestions.validQuestion1.difficulty
        };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(409)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'A question with this title and difficulty already exists', 'Response message does not match');
    });


    it('Respond with 201 status code when valid query, check meta 1', async function () {
        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion1 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.equal(res.body.data.question.meta.publicTestCaseCount, 1, 'Incorrect meta publicTestCaseCount');
        assert.equal(res.body.data.question.meta.privateTestCaseCount, 1, 'Incorrect meta privateTestCaseCount');
        assert.equal(res.body.data.question.meta.totalTestCaseCount, 2, 'Incorrect meta totalTestCaseCount');
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });

    it('Respond with 201 status code when valid query, check meta 2', async function () {
        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion3 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.equal(res.body.data.question.meta.publicTestCaseCount, 1, 'Incorrect meta publicTestCaseCount');
        assert.equal(res.body.data.question.meta.privateTestCaseCount, 2, 'Incorrect meta privateTestCaseCount');
        assert.equal(res.body.data.question.meta.totalTestCaseCount, 3, 'Incorrect meta totalTestCaseCount');
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });


    it('Respond with 201 status code when valid query, check categories', async function () {
        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion3 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.deepEqual(res.body.data.question.categoriesId, [3, 4], 'Wrong categoriesId mapped');
        assert.deepEqual(res.body.data.question.categories, ['DATA STRUCTURES', 'BRAINTEASER'], 'Wrong categories mapped');
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });

    it('Respond with 201 status code when valid query, with duplicate but deleted question', async function () {
        const question = await Question.create({ ...sampleQuestions.validQuestion3, isDeleted: true });

        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion3 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(201)
            .expect('Content-Type', /json/);
        assert.equal(res.body.data.question.meta.publicTestCaseCount, 1, 'Incorrect meta publicTestCaseCount');
        assert.equal(res.body.data.question.meta.privateTestCaseCount, 2, 'Incorrect meta privateTestCaseCount');
        assert.equal(res.body.data.question.meta.totalTestCaseCount, 3, 'Incorrect meta totalTestCaseCount');
        assert.deepEqual(res.body.data.question.categoriesId, [3, 4], 'Wrong categoriesId mapped');
        assert.deepEqual(res.body.data.question.categories, ['DATA STRUCTURES', 'BRAINTEASER'], 'Wrong categories mapped');
        assert.equal(res.body.message, 'Question created successfully', 'Response message does not match');
    });

    it('Respond with 500 status code when there is an unknown server error, find method stub', async function () {
        // Stub the find method of model to throw an error
        const findStub = sinon.stub(Question, 'find').throws(new Error('Simulated Mongoose error'));

        // remove meta from question to send as body
        const q = { ...sampleQuestions.validQuestion1 };
        delete q.meta;

        const res = await request(app)
            .post('/api/question-service/')
            .send(q)
            .set('Cookie', `accessToken=${accessTokensNoExpiry.adminValidCredentials}`)
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Error creating the question', 'Response message does not match');

        findStub.restore(); // Restore the stub
    });

});