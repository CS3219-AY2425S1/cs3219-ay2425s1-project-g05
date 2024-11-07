import app from '../index.js';
import request from 'supertest';
import assert from 'assert';
import { connectMockDb, disconnectMockDb, clearMockDb } from './mockdb.js';
import { sampleQuestions } from './constants/data.js';
import Question from '../models/model.js';
import sinon from 'sinon';

describe('Test getDistinctCategories', function () {
    before(async () => await connectMockDb()); // Connect to the mock database before all tests
    after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
    afterEach(async () => await clearMockDb()); // Clear the database after each test

    it('Respond with 404 status code when no questions', async function () {
        const res = await request(app)
            .get('/api/question-service/categories')
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'No categories found', 'Response message does not match');
    });

    it('Respond with 404 status code when only deleted questions in db', async function () {
        // Insert a deleted question into the database
        await Question.create({...sampleQuestions.validQuestion1, isDeleted: true});

        const res = await request(app)
            .get('/api/question-service/categories')
            .expect(404)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'No categories found', 'Response message does not match');
    });

    it('Respond with 500 status code when there is an unknown server error', async function () {
        // Stub the findOne method of model to throw an error
        const findStub = sinon.stub(Question, 'aggregate').throws(new Error('Simulated Mongoose error'));

        const res = await request(app)
            .get('/api/question-service/categories')
            .expect(500)
            .expect('Content-Type', /json/);
        assert.equal(res.body.message, 'Error retrieving distinct categories', 'Response message does not match');

        findStub.restore(); // Restore the stub
    });


    it("Respond with 200 status code with correct ids", async function () {
        await Question.create(sampleQuestions.validQuestion1);
        await Question.create(sampleQuestions.validQuestion2);

        const res = await request(app)
            .get(`/api/question-service/categories`)
            .expect(200)
            .expect('Content-Type', /json/);
        assert.deepEqual(res.body.data.categories.categoriesId, [0, 1, 2], 'Wrong categoriesId mapped');
        assert.deepEqual(res.body.data.categories.categories, ['ARRAYS', 'ALGORITHMS', 'DATABASES'], 'Wrong categories mapped');

        assert.equal(res.body.message, "Categories obtained successfully", 'Response length does not match');
    });

});