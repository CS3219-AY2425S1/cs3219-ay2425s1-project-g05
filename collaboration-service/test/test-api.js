import * as assert from 'assert';
import { app } from '../server.js';
import request from 'supertest';
import LocalClient from '../src/session/client.js';
import { deleted } from '../src/server/utils.js';
import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

// get the configs needed for test cases
config();

// generate a temporary jwt token to test
const token = jwt.sign(
  {
    userId: 'user1',
    email: 'email@email.com',
    displayName: 'display',
    isAdmin: true,
    isDeleted: false,
  },
  process.env.ACCESS_TOKEN_SECRET
);

describe('Collaboration Service API', () => {
  describe('Test healthz Endpoint', () => {
    it('connected succcessfully', async function () {
      const result = await request(app)
        .get('/healthz')
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);
      assert.equal(
        result.body.message,
        'Connected to the /healthz route of the collaboration-service',
        'Response does not match'
      );
    });
  });

  describe('#createRoom', () => {
    after(() => LocalClient.purge());

    it('with missing users', async function () {
      const result = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question' })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(
        result.body.message,
        'Unable to create room as no users or questions are defined'
      );
    });

    it('with missing question', async function () {
      const result = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ users: ['user1', 'user2'] })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(
        result.body.message,
        'Unable to create room as no users or questions are defined'
      );
    });

    it('with users in seperate rooms', async function () {
      const first = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 1', users: ['userabc', 'userdef'] })
        .expect(200)
        .expect('Content-Type', /json/);

      const second = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 2', users: ['userhij', 'userkmn'] })
        .expect(200)
        .expect('Content-Type', /json/);

      const test = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 2', users: ['userabc', 'userkmn'] })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(test.body.message, 'Users belong in seperate rooms');
    });

    it('with valid data', async function () {
      const result = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 1', users: ['user1', 'user2'] })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.equal(result.body.data.question, 'question 1');
    });
  });

  describe('#deleteRoom', () => {
    after(() => LocalClient.purge());

    it('missing room', async function () {
      const result = await request(app)
        .delete('/api/collaboration-service/rooms')
        .set({ Cookie: `accessToken=${token}` })
        .expect(404)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Room is not found when deleting room');
    });

    it('invalid room', async function () {
      const result = await request(app)
        .delete('/api/collaboration-service/rooms?roomId=123123213123123')
        .set({ Cookie: `accessToken=${token}` })
        .expect(404)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Room is not found when deleting room');
    });

    it('valid room', async function () {
      const first = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 1', users: ['user1', 'user2'] })
        .expect(200)
        .expect('Content-Type', /json/);

      const roomId = first.body.data.roomId;

      const result = await request(app)
        .delete(`/api/collaboration-service/rooms?roomId=${roomId}`)
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Deletion successful');
    });
  });

  describe('#getRoomDetails', () => {
    after(() => LocalClient.purge());

    it('missing roomId', async function () {
      const result = await request(app)
        .get('/api/collaboration-service/rooms')
        .set({ Cookie: `accessToken=${token}` })
        .expect(404)
        .expect('Content-Type', /html/);
    });

    it('invalid roomId', async function () {
      const result = await request(app)
        .get('/api/collaboration-service/rooms/asdnasdsa')
        .set({ Cookie: `accessToken=${token}` })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Room cannot be found');
    });

    it('valid roomId', async function () {
      const create = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 1', users: ['user1', 'user2'] })
        .expect(200)
        .expect('Content-Type', /json/);

      const result = await request(app)
        .get(`/api/collaboration-service/rooms/${create.body.data.roomId}`)
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.ok(result.body.data !== null || result.body.data !== undefined);
    });
  });

  describe('#getRoomStatus', () => {
    it('can get non-existent room', async () => {
      const result = await request(app)
        .get('/api/collaboration-service/rooms/status/123123123')
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.equal(result.body.data.deleted, false);
    });

    it('can get existing room', async () => {
      deleted.add('abde123');
      const result = await request(app)
        .get('/api/collaboration-service/rooms/status/abde123')
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.equal(result.body.data.deleted, true);
      deleted.clear();
    });
  });

  describe('#updateRoomStatus', () => {
    it('cannot delete non-existent room', async () => {
      const result = await request(app)
        .post('/api/collaboration-service/rooms/status/123123123')
        .set({ Cookie: `accessToken=${token}` })
        .expect(404)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Room not found');
    });

    it('can delete existing room', async () => {
      LocalClient.docToUser.set('abde123', ['user1', 'user2']);
      const result = await request(app)
        .post('/api/collaboration-service/rooms/status/abde123')
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'Updated successfully');
      LocalClient.docToUser.clear();
    });
  });

  describe('#getUserDetails', () => {
    after(() => LocalClient.purge());

    it('missing roomId', async function () {
      const result = await request(app)
        .get('/api/collaboration-service/users')
        .set({ Cookie: `accessToken=${token}` })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'User ID is invalid');
    });

    it('invalid roomId', async function () {
      const result = await request(app)
        .get('/api/collaboration-service/users?userId=asdnasdsa')
        .set({ Cookie: `accessToken=${token}` })
        .expect(401)
        .expect('Content-Type', /json/);

      assert.equal(result.body.message, 'User ID is invalid');
    });

    it('valid roomId', async function () {
      const create = await request(app)
        .post('/api/collaboration-service/create-room')
        .set({ Cookie: `accessToken=${token}` })
        .send({ question: 'question 1', users: ['user1', 'user2'] })
        .expect(200)
        .expect('Content-Type', /json/);

      const result = await request(app)
        .get(`/api/collaboration-service/users?userId=user1`)
        .set({ Cookie: `accessToken=${token}` })
        .expect(200)
        .expect('Content-Type', /json/);

      assert.ok(result.body.data !== null || result.body.data !== undefined);
    });
  });
});
