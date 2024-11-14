import * as assert from 'assert';
import LocalClient from '../src/session/client.js';
import UserAlreadyFoundInRoomError from '../src/errors/UserAlreadyFoundInRoomError.js';
import RoomNotFoundError from '../src/errors/RoomNotFoundError.js';

describe('Collaboration Service LocalClient', () => {
  describe('#purge(void)', () => {
    it('removes all data', () => {
      LocalClient.docToQuestion.set('abc', {});
      LocalClient.docToUser.set('abc', ['123']);
      LocalClient.userToDoc.set('123', 'abc');

      assert.ok(LocalClient.docToQuestion.get('abc') !== undefined);
      assert.ok(LocalClient.docToUser.get('abc') !== undefined);
      assert.ok(LocalClient.userToDoc.get('123') !== undefined);

      LocalClient.purge();

      assert.ok(LocalClient.docToQuestion.get('abc') === undefined);
      assert.ok(LocalClient.docToUser.get('abc') === undefined);
      assert.ok(LocalClient.userToDoc.get('123') === undefined);
    });
  });

  describe('#getState(void)', () => {
    it('returns all data', () => {
      LocalClient.docToQuestion.set('abc', {});
      LocalClient.docToUser.set('abc', ['123']);
      LocalClient.userToDoc.set('123', 'abc');

      assert.ok(LocalClient.docToQuestion.get('abc') !== undefined);
      assert.ok(LocalClient.docToUser.get('abc') !== undefined);
      assert.ok(LocalClient.userToDoc.get('123') !== undefined);

      const [userToDoc, docToUser, docToQuestion] = LocalClient.getState();

      assert.ok(docToQuestion.length > 0);
      assert.ok(docToUser.length > 0);
      assert.ok(userToDoc.length > 0);
    });
  });

  describe('#createRoom(string[])', () => {
    let roomId = null;

    it('both users are not in a room', () => {
      const [innerRoomId, isDupe] = LocalClient.createRoom(['user1', 'user2']);
      assert.ok(!isDupe);
      assert.ok(LocalClient.getUserByDoc(innerRoomId).length > 0);
      roomId = innerRoomId;
    });

    it('one user is in a room', () => {
      // user 1 is already in the room
      const [rid1, _] = LocalClient.createRoom(['user22']);
      const [rid2, isDupe] = LocalClient.createRoom(['user22', 'user3']);
      assert.ok(isDupe);
      assert.equal(rid1, rid2);
      assert.equal(LocalClient.getUserByDoc(rid2).length, 2);
    });

    it('both users are in the same room', () => {
      // user 1 is already in the room
      const [innerRoomId, isDupe] = LocalClient.createRoom(['user1', 'user2']);
      assert.ok(isDupe);
      assert.ok(LocalClient.getUserByDoc(innerRoomId).length > 0);
      assert.equal(roomId, innerRoomId);

      LocalClient.purge();
    });

    it('both users are in the different rooms, throws', () => {
      // user 1 is already in the room
      const [newRoomId, newIsDupe] = LocalClient.createRoom([
        'user1New',
        'user2New',
      ]);
      const [oldRoomId, oldIsDupe] = LocalClient.createRoom([
        'user1Old',
        'user2Old',
      ]);

      assert.notEqual(newRoomId, oldRoomId);
      assert.throws(
        () => LocalClient.createRoom(['user1New', 'user2Old']),
        UserAlreadyFoundInRoomError
      );

      LocalClient.purge();
    });

    // will not pursue at this point
    // it('more than 2 users in room, throws', () => {
    //   assert.throws(
    //     () =>
    //       LocalClient.createRoom(['user123123', 'user112233', 'user111222']),
    //     RoomCapacityError
    //   );

    //   LocalClient.purge();
    // });

    it('userId not of type string, throws', () => {
      assert.throws(() => LocalClient.createRoom([123, ['user2Old']]), Error);

      LocalClient.purge();
    });
  });

  describe('#deleteRoom(string)', () => {
    it('room not of type string, throws', () =>
      assert.throws(() => LocalClient.deleteRoom(123)));

    it(
      'room is invalid',
      () => assert.throws(() => LocalClient.deleteRoom('abcde')),
      RoomNotFoundError
    );

    it('room is valid', () => {
      const [roomId, _] = LocalClient.createRoom(['user123, user234']);
      LocalClient.deleteRoom(roomId);

      assert.equal(LocalClient.getDocByUser('user123'), null);
      assert.equal(LocalClient.getDocByUser('user234'), null);
      assert.equal(LocalClient.getUserByDoc(roomId), null);

      LocalClient.purge();
    });
  });

  describe('#putQuestion(string, string)', () => {
    it('room does not exist, does not throws', () => {
      assert.doesNotThrow(() =>
        LocalClient.putQuestion('doc123def', 'abcQuestion')
      );
    });

    it('room exists but question does not exist', () => {
      const [roomId, _] = LocalClient.createRoom(['put1', 'put2']);
      assert.doesNotThrow(
        () => LocalClient.putQuestion(roomId, 'abcQuestion'),
        Error
      );
      assert.ok(LocalClient.docToQuestion.get(roomId, null) !== null);
    });

    it('room exists and question exists', () => {
      const [roomId, _] = LocalClient.createRoom(['put12', 'put23']);
      const question1 = 'quest1';
      const question2 = 'quest2';

      const value1 = LocalClient.putQuestion(roomId, question1);
      assert.equal(value1, question1);

      const value2 = LocalClient.putQuestion(roomId, question2);
      assert.equal(value2, question1);
    });
  });

  describe('#getQuestion(string)', () => {
    it('get non-existent room ID', () => {
      assert.equal(
        LocalClient.getQuestion('abcde'),
        '# Enter in your code here'
      );
    });

    it('get existing room ID', () => {
      const question = 'question 1';
      const [roomId, _] = LocalClient.createRoom(['user1233', 'user12333']);

      LocalClient.putQuestion(roomId, 'question 1');
      assert.equal(LocalClient.docToQuestion.get(roomId), question);
      LocalClient.purge();
    });
  });

  describe('#removeQuestion(string)', () => {
    it('room is not found', () => {
      assert.ok(LocalClient.docToQuestion.get('123', null) === undefined);
      assert.doesNotThrow(() => LocalClient.removeQuestion('123'));
      assert.ok(LocalClient.docToQuestion.get('123', null) === undefined);
    });

    it('room is found', () => {
      const [roomId, _] = LocalClient.createRoom(['user12312', 'user123123']);
      const question = 'question123';

      LocalClient.putQuestion(roomId, question);
      assert.equal(LocalClient.docToQuestion.get(roomId, null), question);

      LocalClient.removeQuestion(roomId);
      assert.equal(LocalClient.docToQuestion.get(roomId, null), null);

      LocalClient.purge();
    });
  });

  describe('#add(string, string)', () => {
    it('user already exists in room', () => {
      const [roomId, _] = LocalClient.createRoom(['123', '1234']);
      assert.doesNotThrow(() => LocalClient.add('123', roomId));
      assert.ok(LocalClient.getDocByUser('123') === roomId);
      assert.ok(LocalClient.getUserByDoc(roomId).length === 2);
      LocalClient.purge();
    });

    it('user does not exist in room, throws as too many user', () => {
      const [roomId, _] = LocalClient.createRoom(['123']);
      assert.doesNotThrow(() => LocalClient.add('321', roomId));
      assert.ok(LocalClient.getDocByUser('321') === roomId);
      assert.ok(LocalClient.getUserByDoc(roomId).length === 2);
      LocalClient.purge();
    });
  });

  describe('#delete(string, string)', () => {
    it('user already exists in room', () => {
      const [roomId, _] = LocalClient.createRoom(['aabb', 'aabbcc']);
      assert.doesNotThrow(() => LocalClient.delete('aabb', roomId));
      assert.ok(LocalClient.getDocByUser('aabb') === null);
      assert.ok(LocalClient.getUserByDoc(roomId).length === 1);
      LocalClient.purge();
    });

    it('user does not exists in room, throws', () => {
      const [roomId, _] = LocalClient.createRoom(['aabb', 'aabbcc']);
      assert.doesNotThrow(() => LocalClient.delete('aabbccdd', roomId));
      assert.ok(LocalClient.getDocByUser('aabbccdd') === null);
      assert.ok(LocalClient.getUserByDoc(roomId).length === 2);
      LocalClient.purge();
    });
  });

  describe('#getDocByUser', () => {
    it('user not in map', () => {
      assert.equal(LocalClient.getDocByUser('asiodasdasdas'), null);
    });

    it('user in map', () => {
      LocalClient.userToDoc.set('123', '123');
      assert.equal(LocalClient.getDocByUser('123'), '123');
      LocalClient.purge();
    });

    LocalClient.purge();
  });

  describe('#getUserByDoc', () => {
    it('doc not in map', () => {
      assert.equal(LocalClient.getUserByDoc('asiodasdasdas'), null);
    });

    it('doc in map', () => {
      LocalClient.docToUser.set('123', '123');
      assert.equal(LocalClient.getUserByDoc('123'), '123');
      LocalClient.purge();
    });
  });

  describe('#getQuestion', () => {
    it('doc not in map', () => {
      assert.equal(
        LocalClient.getQuestion('asiodasdasdas'),
        '# Enter in your code here'
      );
    });

    it('doc in map', () => {
      LocalClient.docToQuestion.set('123', 'question 1');
      assert.equal(LocalClient.getQuestion('123'), 'question 1');
      LocalClient.purge();
    });
  });
});
