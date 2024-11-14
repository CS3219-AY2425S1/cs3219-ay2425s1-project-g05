import { createClient } from 'redis';
import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import RoomNotEmptyError from '../errors/RoomNotEmptyError.js';
import UserNotFoundInRoomError from '../errors/UserNotFoundInRoomError.js';
import UserAlreadyFoundInRoomError from '../errors/UserAlreadyFoundInRoomError.js';
import JsonParseError from '../errors/JsonParseError.js';
import RoomDeletionError from '../errors/RoomDeletionError.js';
import { config } from 'dotenv';

/**
 * Interface to connect to Redis and interact with Redis API
 */
class RedisClient {
  /** Static client instance; reusing connection */
  static client = null;
  static autoincrementingId = '_id';
  static roomIdPrefix = 'id-';

  /**
   * Starts up the client if it is missing, else return the created Redis client instance
   *
   * @returns Redis client
   */
  static async createIfAbsent() {
    // if Redis client is already present just return it
    if (RedisClient.client !== null) {
      return RedisClient.client;
    }

    // retrieve configs
    config();

    // Redis URL default to Elasticache endpoint
    RedisClient.client = await createClient({
      url:
        process.env.REDIS_HOST ||
        'redis://redis.mrdqdr.ng.0001.apse1.cache.amazonaws.com:6379',
    })
      .on('error', (err) => {
        console.log(`Error encountered: ${err}`);

        // must be able to connect to the redis instance, else the app will fail
        throw err;
      })
      .on('connect', (conn) => {
        console.log('Connected to Redis!');
      });

    // Connect to the Redis endpoint
    RedisClient.client.connect();

    // Create the _id key if absent
    if (
      (await RedisClient.client.exists(RedisClient.autoincrementingId)) == 0
    ) {
      console.log('Creating Autoincrementing Variable...');
      await RedisClient.client.incr(RedisClient.autoincrementingId);
      console.log('Autoincrementing Variable created!');
    } else {
      console.log('Autoincrementing Variable exists, continuing...');
    }

    // return client
    return RedisClient.client;
  }

  /**
   * Stops and deletes the client if it is present, else do nothing
   *
   * @param flush Determines whether to flush the DB or not after closing the connection
   */
  static async deleteIfPresent(flush = false) {
    if (RedisClient.client === null) {
      return;
    }

    if (flush) {
      await RedisClient.client.flushDb();
      console.log('Database flushed!');
    }

    await RedisClient.client.quit();
    RedisClient.client = null;
  }

  /**
   * Converts a JS object into a JSON string.
   *
   * @param {Map} users Map type
   * @returns string object representing the JSON object
   */
  static toJson(users) {
    if (users === null || users === undefined) {
      throw new JsonParseError('Unable to parse JS object into JSON string');
    }

    return JSON.stringify(users);
  }

  /**
   * Converts the JSON string back into its corresponding JS type
   *
   * @param {string} results JSON string
   * @returns Map object
   */
  static fromJson(results) {
    // if results are undefined, nothing happens since we cannot parse an undefined object
    if (results === undefined) {
      return;
    }

    // if null, then throw a parsing error since we cannot parse null
    if (results === null) {
      throw new JsonParseError(
        'Unable to parse JSON string back into JS object'
      );
    }

    return JSON.parse(results);
  }

  /**
   * Retrieves the next available room ID. This is guaranteed to be safe since Redis
   * runs in one thread and hence it is unlikely for concurrent edits to be made to the _id
   * variable.
   */
  async #getNextAvailableRoomId() {
    // increment the autoincrementing variable until we find a roomId that is not used
    // max number of keys in redis is 2^31 - 1, this is something we can never hit given the scale
    // of our application, so this is safe, it will always find an valid integer value

    const client = await RedisClient.createIfAbsent();

    while (
      (await client.get(
        `${RedisClient.roomIdPrefix}${await this.#retrieveAutoIncrVar()}`
      )) !== null
    ) {
      await this.#incrementAutoIncrVar();
    }

    const nextId = `${
      RedisClient.roomIdPrefix
    }${await this.#retrieveAutoIncrVar()}`;

    // increment the auto incrementor as this room id is already used
    await this.#incrementAutoIncrVar();

    return nextId;
  }

  /**
   * Returns the list of users associated with the room (Room's View)
   *
   * @param {String} room Room ID to query
   * @returns {Array<String>} List of users in a room or null if the room does not exist
   */
  async getUser(room) {
    const client = await RedisClient.createIfAbsent();

    try {
      const results = (await client.hGetAll(room))['users'];
      const jsonified = RedisClient.fromJson(results);

      return jsonified === undefined ? null : jsonified;
    } catch (err) {
      console.error(`Error: Cannot retrieve room due to ${err}`);
      return null;
    }
  }

  /**
   * Checks if a user is found in the database
   *
   * @param {String} user User ID to find
   * @returns true if the database contains the user id else false
   */
  async isUserInRedis(user) {
    const client = await RedisClient.createIfAbsent();
    const iterator_params = {
      MATCH: `${RedisClient.roomIdPrefix}*`,
    };

    // scan through all keys (roomIds)
    for await (const key of client.scanIterator(iterator_params)) {
      // get the users associated with the roomId
      const roomUsers = RedisClient.fromJson(
        (await client.hGetAll(key))['users']
      );

      // for each user in the room, check if there is a match with the user of interest
      for (const roomUser of roomUsers) {
        if (user === roomUser) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Checks if a room is found in the database
   *
   * @param {String} room Room ID to find
   * @returns true if the database contains the room ID else false
   */
  async isRoomInRedis(room) {
    return (await (await RedisClient.createIfAbsent()).exists(room)) === 1;
  }

  /**
   * Returns the room's details from the perspective of the user (User's View)
   *
   * Adapted logic from https://stackoverflow.com/questions/37642762/using-redis-scan-in-node
   *
   * @param {String} user User ID to query
   * @returns {Map<String, Map<String, Array<String>>>} User's view of the room it is associated with
   *                                                    or null if it is not associated with any rooms
   */
  async getRoom(user) {
    const client = await RedisClient.createIfAbsent();
    const iterator_params = {
      MATCH: `${RedisClient.roomIdPrefix}*`,
    };

    // scan through all keys (roomIds)
    for await (const key of client.scanIterator(iterator_params)) {
      // get the users associated with the roomId
      const roomUsers = (await client.hGetAll(key))?.users ?? [];

      // for each user in the room, check if there is a match with the user of interest
      if (roomUsers.includes(user)) {
        return {
          [key]: {
            users: RedisClient.fromJson(roomUsers),
          },
        };
      }
    }

    return null;
  }

  /**
   * Creates a room with the default users associated with it.
   *
   * @param {Array<String>} users List of user IDs to associate to the created room
   * @param {String} roomId optional roomId to register users into
   * @returns Room ID created
   */
  async createRoom(users, roomId = null) {
    // check if the room is available
    if (roomId !== null && (await this.getUser(roomId)) !== null) {
      throw new RoomNotEmptyError('Room already occupied');
    }

    // make sure that none of the users are in the room
    for (const user of users) {
      const findRoom = await this.getRoom(user);

      if (findRoom !== null) {
        throw new UserAlreadyFoundInRoomError(
          `User ${user} found in existing room!`
        );
      }
    }

    // prioritise the input room ID first
    const newRoomId = roomId ?? (await this.#getNextAvailableRoomId());

    // create the room
    await (
      await RedisClient.createIfAbsent()
    ).hSet(newRoomId, 'users', RedisClient.toJson(users));

    return newRoomId;
  }

  /**
   * Deletes a room.
   *
   * @param {String} room Room ID of room to delete
   */
  async deleteRoom(room) {
    const client = await RedisClient.createIfAbsent();
    const results = await this.getUser(room);

    if (results === null) {
      throw new RoomNotFoundError('Invalid Room ID provided');
    }

    if (results.length > 0) {
      throw new RoomNotEmptyError('Room is not empty and cannot be deleted');
    }

    await client.del(room, (err, resp) => {
      if (error) {
        console.error('Unable to delete room!');
        throw new RoomDeletionError(`Unable to delete room: ${err}`);
      }
    });
  }

  /**
   * Retrieves the autoincrementing variable
   */
  async #retrieveAutoIncrVar() {
    return await (
      await RedisClient.createIfAbsent()
    ).get(RedisClient.autoincrementingId);
  }

  /**
   * Increment the autoincrementing variable
   */
  async #incrementAutoIncrVar() {
    await (
      await RedisClient.createIfAbsent()
    ).incr(RedisClient.autoincrementingId);
  }

  /**
   * Registers a user to a room
   *
   * @param {String} user User ID of user to register
   * @param {String} room Room ID of room to associate user with
   * @returns String representing room Id or null if registered successfully
   */
  async registerUser(user, room) {
    const userRoom = await this.getRoom(user);
    const client = await RedisClient.createIfAbsent();

    // new user who does not exist in any room
    if (userRoom === null) {
      if (await this.isRoomInRedis(room)) {
        // if room already exist, then just add user to it
        const rawUsers = await client.hGetAll(room);
        const users = RedisClient.fromJson(rawUsers['users']);
        users.push(user);

        await client.hSet(room, 'users', RedisClient.toJson(users));
        return null;
      } else {
        // room dont exist, so create it
        return this.createRoom([user], room);
      }
    } else {
      // user found in room already, so throw error
      throw new UserAlreadyFoundInRoomError(
        'User is already registered to a room'
      );
    }
  }

  /**
   * Deregisters a user from a room
   *
   * @param {String} user User ID of user to deregister
   * @param {String} room Room ID of room to disassociate user with
   */
  async deregisterUser(user, room) {
    const userRoom = await this.getRoom(user);
    const client = await RedisClient.createIfAbsent();

    if (userRoom === null) {
      throw new UserNotFoundInRoomError('User is not registered to any rooms');
    }

    if (!Object.keys(userRoom).includes(room)) {
      // user is not in the specified room
      throw new UserNotFoundInRoomError(
        'User is not registered to the specified room'
      );
    }

    const users = userRoom[room]['users'].filter((x) => x !== user);
    await client.hSet(room, 'users', RedisClient.toJson(users));
    return null;
  }

  /**
   * Debug function to permit the dumping of all active session
   *
   * FOR DEBUGGING PURPOSES ONLY
   * @returns Map containing the mappings of roomId to List of users
   */
  async dumpRedis() {
    const database = {};
    const client = await RedisClient.createIfAbsent();
    const iterator_params = {
      MATCH: `*`,
    };

    // scan through all keys (roomIds)
    for await (const key of client.scanIterator(iterator_params)) {
      // get the users associated with the roomId
      try {
        database[key] = await client.hGetAll(key);
      } catch (err) {
        database[key] = await client.get(key);
      }
    }

    return database;
  }
}

// Test cases

export default RedisClient;
