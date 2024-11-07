// import app from '../index.js';
// import request from 'supertest';
// import assert from 'assert';
// import { connectMockDb, disconnectMockDb, clearMockDb } from './mockdb.js';
// import { sampleQuestions } from './constants/data.js';
// import Question from '../models/model.js';
// import sinon from 'sinon';

// describe('Test getQuestionById', function () {
//     before(async () => await connectMockDb()); // Connect to the mock database before all tests
//     after(async () => await disconnectMockDb()); // Disconnect from the database after all tests
//     afterEach(async () => await clearMockDb()); // Clear the database after each test

//     it('Respond with 404 status code when given invalid id', async function () {
//         const res = await request(app)
//             .get('/api/question-service/id/123')
//             .expect(404)
//             .expect('Content-Type', /json/);
//         assert.equal(res.body.message, 'Question not found', 'Response message does not match');
//     });

//     it('Respond with 404 status code when valid id but nonexistent question', async function () {
//         const res = await request(app)
//             .get('/api/question-service/id/313233343536373839303132')
//             .expect(404)
//             .expect('Content-Type', /json/);
//         assert.equal(res.body.message, 'Question not found', 'Response message does not match');
//     });

//     it('Respond with 404 status code when only deleted questions in db', async function () {
//         // Insert a deleted question into the database
//         await Question.create({...sampleQuestions.validQuestion1, isDeleted: true});

//         const res = await request(app)
//             .get('/api/question-service/')
//             .expect(404)
//             .expect('Content-Type', /json/);
//         assert.equal(res.body.message, 'No questions found', 'Response message does not match');
//     });

//     it('Respond with 500 status code when there is an unknown server error', async function () {
//         // Stub the findOne method of model to throw an error
//         const findStub = sinon.stub(Question, 'find').throws(new Error('Simulated Mongoose error'));

//         const res = await request(app)
//             .get('/api/question-service/')
//             .expect(500)
//             .expect('Content-Type', /json/);
//         assert.equal(res.body.message, 'Error retrieving question', 'Response message does not match');

//         findStub.restore(); // Restore the stub
//     });


//     it("Respond with 200 status code with valid found question id, check if categories and meta is added in response", async function () {
//         // Insert a question into the database
//         const question = await Question.create(sampleQuestions.validQuestion1);
//         const id = question._id.toString();

//         const res = await request(app)
//             .get(`/api/question-service/id/${id}`)
//             .expect(200)
//             .expect('Content-Type', /json/);
//         assert.deepEqual(res.body.data.question.categories, ['ARRAYS', 'ALGORITHMS'], 'Wrong categories mapped');
//         assert(res.body.data.question.hasOwnProperty('meta'), 'Field "meta" does not exist');
//         assert.equal(res.body.message, "Question found successfully", 'Response length does not match');
//     });

// });