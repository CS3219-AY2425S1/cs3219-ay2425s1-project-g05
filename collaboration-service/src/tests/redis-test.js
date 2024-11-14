import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import RoomNotEmptyError from '../errors/RoomNotEmptyError.js';
import UserNotFoundInRoomError from '../errors/UserNotFoundInRoomError.js';
import UserAlreadyFoundInRoomError from '../errors/UserAlreadyFoundInRoomError.js';
import RedisClient from '../redis/client.js';

async function testRedisClient() {
  await RedisClient.createIfAbsent();
  const instance = new RedisClient();

  try {
    const emails = ['email1@email.com', 'email2@email.com'];

    console.log('redisDump on empty redis: ', await instance.dumpRedis());

    const composed = RedisClient.fromJson(RedisClient.toJson(emails));

    for (let i = 0; i < composed.length; i++) {
      if (composed[i] !== emails[i]) {
        console.error('Composed fail', false);
        process.exit(1);
      }
    }

    console.log('*Json() composed successfully', true);

    console.log('Create room: ', await instance.createRoom(emails), true);

    try {
      const new_emails = [emails[0], 'UNIQUE@email.com'];
      await instance.createRoom(new_emails);
    } catch (err) {
      if (err instanceof UserAlreadyFoundInRoomError) {
        console.log('User found in room already', true);
      }
    }

    console.log(
      'Create custom room',
      await instance.createRoom(['12', '34'], 'id-123123'),
      true
    );

    try {
      await instance.createRoom(['1', '2'], 'id-1');
    } catch (err) {
      if (err instanceof RoomNotEmptyError) {
        console.log('Create existing room', true);
      }
    }

    console.log(
      'Get existing room: ',
      await instance.getUser('id-1'),
      (await instance.getUser('id-1')) !== null
    );
    console.log(
      'Get non-existent room: ',
      await instance.getUser('id-1120321312'),
      (await instance.getUser('id-1120321312')) === null
    );

    console.log(
      'Get existing user: ',
      await instance.getRoom(emails[0]),
      (await instance.getRoom(emails[0])) !== null
    );
    console.log(
      'Get non-existent user: ',
      await instance.getRoom('THIS_DOES_NOT_EXIST@email.com'),
      (await instance.getRoom('THIS_DOES_NOT_EXIST@email.com')) === null
    );

    try {
      await instance.deleteRoom('id-1');
    } catch (err) {
      if (err instanceof RoomNotEmptyError) {
        console.log('Unable to delete non-empty room', true);
      }
    }

    try {
      await instance.deleteRoom('ID NOT FOUND');
    } catch (err) {
      if (err instanceof RoomNotFoundError) {
        console.log('Unable to delete non-existent room', true);
      }
    }

    try {
      const roomId = await instance.createRoom([]);
      await instance.deleteRoom(roomId);
      console.log('Empty room deleted successfully', true);
    } catch (err) {
      throw err;
    }

    // register user
    console.log(
      'Register new user to old room',
      await instance.registerUser('email123@email.com', 'id-1'),
      await instance.getRoom('email123@email.com'),
      true
    );

    console.log(
      'Register new user to new room',
      await instance.registerUser('email123456@email.com', 'id-1231231'),
      await instance.getRoom('email123456@email.com'),
      true
    );

    try {
      console.log(
        'Register old user to old room',
        await instance.registerUser(emails[0], 'id-1')
      );
    } catch (err) {
      if (err instanceof UserAlreadyFoundInRoomError) {
        console.log(
          'Existing user cannot be registered to existing room',
          true
        );
      }
    }

    try {
      console.log(
        'Register old user to new room',
        await instance.registerUser(emails[0], 'id-1242343')
      );
    } catch (err) {
      if (err instanceof UserAlreadyFoundInRoomError) {
        console.log('Existing user cannot be registered to new room', true);
      }
    }

    // deregister user
    try {
      await instance.deregisterUser('abcdemail123@email.com', 'id-1');
    } catch (err) {
      if (err instanceof UserNotFoundInRoomError) {
        console.log('Deregister new user from old room', true);
      }
    }

    console.log(
      'Deregister old user from old room',
      await instance.deregisterUser('email123@email.com', 'id-1'),
      !(await instance.getUser('id-1')).includes('email123@email.com')
    );

    try {
      await instance.deregisterUser('adasdas', 'asdasdas');
    } catch (err) {
      if (err instanceof UserNotFoundInRoomError) {
        console.log('Deregister new user from new room', true);
      }
    }

    try {
      await instance.deregisterUser('email1@email.com', 'asdasdasdasdasd');
    } catch (err) {
      if (err instanceof UserNotFoundInRoomError) {
        console.log('Deregister old user from new room', true);
      }
    }

    console.log(
      'Existing user exists?',
      (await instance.isUserInRedis('email1@email.com')) === true
    );

    console.log(
      'Non-existing user exists?',
      (await instance.isUserInRedis('email112312312312@email.com')) === false
    );
  } catch (err) {
    console.error(err);
  } finally {
    console.log('------------------');
    console.log('Final Redis state: ', await instance.dumpRedis());
    await RedisClient.deleteIfPresent({ flush: true });
  }
}

testRedisClient();
