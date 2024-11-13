import RoomNotFoundError from '../errors/RoomNotFoundError.js';
import UserNotFoundInRoomError from '../errors/UserNotFoundInRoomError.js';
import UserAlreadyFoundInRoomError from '../errors/UserAlreadyFoundInRoomError.js';
import { v7 } from 'uuid';
import InvalidArgumentError from '../errors/InvalidArgumentError.js';
import { deleted } from '../server/utils.js';

/**
 * Interface to track the current users connected to yjs
 */
class LocalClient {
  /**
   * @type {Map<String, Array<String>>}
   */
  static docToUser = new Map();

  /**
   * @type {Map<String, String>}
   */
  static userToDoc = new Map();

  /**
   * @type {Map<String, Map<any, any>>}
   */
  static docToQuestion = new Map();

  static getDocByUser(userId) {
    console.log('Remove Doc by user ', userId);
    return LocalClient.userToDoc.get(userId) ?? null;
  }

  static getUserByDoc(doc) {
    console.log('Get User by doc ', doc);
    return LocalClient.docToUser.get(doc) ?? null;
  }

  static getQuestion(doc) {
    console.log('Remove Questions from ', doc);
    if (LocalClient.docToQuestion.has(doc)) {
      return LocalClient.docToQuestion.get(doc);
    }

    return '# Enter in your code here';
  }

  static putQuestion(doc, question) {
    console.log('Put Questions from ', doc);
    if (LocalClient.docToQuestion.has(doc)) {
      return LocalClient.docToQuestion.get(doc);
    }

    LocalClient.docToQuestion.set(doc, question);
    return question;
  }

  static removeQuestion(doc) {
    console.log('Remove Questions from ', doc);
    if (!LocalClient.docToQuestion.has(doc)) {
      return;
    }

    LocalClient.docToQuestion.delete(doc);
  }

  /**
   * Creates a unique room ID
   */
  static createRoom(users) {
    console.log('Create room with', users);
    // likely O(1) operation, since hash collisions are rare
    let uuid = v7();

    while (LocalClient.docToUser.has(uuid) || deleted.has(uuid)) {
      uuid = v7();
    }

    let userRoom = undefined;

    for (const user of users) {
      // if userRoom is null, attempt to get the current user's room
      // we continue until either all are null (no user is in a room)
      // or we get a non-null room name
      if (userRoom === undefined) {
        userRoom = LocalClient.userToDoc.get(user);
      } else {
        const currRoom = LocalClient.userToDoc.get(user);

        // if currRoom is not null and not equal to the userRoom,
        // we found a problem where one or more users have different rooms
        // this should not happen
        if (currRoom !== undefined && currRoom !== userRoom) {
          // conform those who dont belong to a room to the room of the first person
          throw new UserAlreadyFoundInRoomError(
            'Users belong in seperate rooms'
          );
        }
      }
    }

    // if userRoom is null, means that all users are not in a room
    if (userRoom === undefined) {
      // create the room
      LocalClient.docToUser.set(uuid, users);

      // add to predefined UUID room name
      for (const user of users) {
        LocalClient.add(user, uuid);
      }

      return [uuid, false];
    } else {
      // if userRoom has a value, that means one or the other user is already in a room
      // so we just return the name
      for (const user of users) {
        LocalClient.add(user, userRoom);
      }

      return [userRoom, true];
    }
  }

  /**
   * Adds a user to to a room
   *
   * @param {string} user User ID
   * @param {string} doc Room Id
   */
  static add(user, doc) {
    console.log('Add', user, 'to', doc);

    if (typeof user !== 'string' || typeof doc !== 'string') {
      throw new InvalidArgumentError(
        'User ID or Room ID is not of the correct type'
      );
    }

    if (LocalClient.userToDoc.has(user)) {
      // ignore if user is already in the room
      return;
    }

    // overwrites the existing doc
    LocalClient.userToDoc.set(user, doc);

    const users = LocalClient.getUserByDoc(doc) ?? [];

    if (!users.includes(user)) {
      users.push(user);
    }

    LocalClient.docToUser.set(doc, users);
  }

  /**
   * Deletes a user from a room
   */
  static delete(user, doc) {
    console.log('Delete', user, 'from', doc);

    const docs = LocalClient.userToDoc.get(user);

    if (docs === undefined) {
      console.error('Unable to delete user as user is not found in room');
      return;
      // throw new UserNotFoundInRoomError(
      //   'Unable to delete user as user is not found in the correct room'
      // );
    }

    // delete the user from the userToDoc mapping
    LocalClient.userToDoc.delete(user);

    // get list of users
    const users = LocalClient.docToUser.get(docs);

    if (users === undefined) {
      console.error('Unable to find requested room in database');
      // throw new RoomNotFoundError('Unable to find requested room in database');
      return;
    }

    // remove user from the list of users in the doc
    const userId = users.indexOf(user);

    if (userId >= 0) {
      users.splice(userId, 1);
    }

    // if there are still users in the list, we set it to the users
    if (users.length > 0) {
      LocalClient.docToUser.set(docs, users);
    } else {
      // otherwise, we delete the doc, since we want to remove empty docs from the
      // local db
      LocalClient.docToUser.delete(docs);
      LocalClient.removeQuestion(docs);
    }
  }

  // /**
  //  * Deletes a user from the database
  //  *
  //  * @param {string} user User ID
  //  */
  // static deleteUser(user) {
  //   // get the docs and the attached users
  //   const docs = LocalClient.getDocByUser(user);
  //   const users = LocalClient.getUserByDoc(docs);

  //   // if there are no users attached to the doc or if there are no docs at all
  //   if (docs === null || users === null) {
  //     throw new UserNotFoundInRoomError('Unable to find user');
  //   }

  //   // user has a mapped room, so we delete them from the map
  //   const userLoc = users.indexOf(user);
  //   if (userLoc >= 0) {
  //     users.splice(userLoc, 1);
  //   }

  //   if (users.length === 0) {
  //     LocalClient.docToUser.delete(docs);
  //   }
  // }

  /**
   * Deletes a room from the database
   * @param {string} room Room ID
   * @returns
   */
  static deleteRoom(room) {
    console.log('Delete room', room);
    const users = LocalClient.getUserByDoc(room);

    if (users === null) {
      console.log('Room is not found when deleting room');
      throw new RoomNotFoundError('Room is not found when deleting room');
    }

    for (const user of users) {
      LocalClient.userToDoc.delete(user);
    }

    LocalClient.docToUser.delete(room);
    LocalClient.removeQuestion(room);
  }

  static getState() {
    return [
      'user2doc',
      Array.from(LocalClient.userToDoc.entries()),
      'doc2User',
      Array.from(LocalClient.docToUser.entries()),
      'doc2Qns',
      Array.from(LocalClient.docToQuestion.entries()),
    ];
  }

  /**
   * Clears out the maps. This is only useful for debugging and testing
   * purposes only.
   */
  static purge() {
    LocalClient.docToQuestion.clear();
    LocalClient.docToUser.clear();
    LocalClient.userToDoc.clear();
  }
}

/**
 * Interface to connect to Redis and interact with Redis API
 */
// class RedisClient {
//   /** Static client instance; reusing connection */
//   static client = null;
//   static autoincrementingId = '_id';
//   static roomIdPrefix = 'id-';

//   /**
//    * Starts up the client if it is missing, else return the created Redis client instance
//    *
//    * @returns Redis client
//    */
//   static async createIfAbsent() {
//     // if Redis client is already present just return it
//     if (RedisClient.client !== null) {
//       return RedisClient.client;
//     }

//     // retrieve configs
//     config();

//     // Redis URL default to Elasticache endpoint
//     RedisClient.client = await createClient({
//       url:
//         process.env.REDIS_HOST ||
//         'redis://redis.mrdqdr.ng.0001.apse1.cache.amazonaws.com:6379',
//     })
//       .on('error', (err) => {
//         console.log(`Error encountered: ${err}`);

//         // must be able to connect to the redis instance, else the app will fail
//         throw err;
//       })
//       .on('connect', (conn) => {
//         console.log('Connected to Redis!');
//       });

//     // Connect to the Redis endpoint
//     RedisClient.client.connect();

//     // Create the _id key if absent
//     if (
//       (await RedisClient.client.exists(RedisClient.autoincrementingId)) == 0
//     ) {
//       console.log('Creating Autoincrementing Variable...');
//       await RedisClient.client.incr(RedisClient.autoincrementingId);
//       console.log('Autoincrementing Variable created!');
//     } else {
//       console.log('Autoincrementing Variable exists, continuing...');
//     }

//     // return client
//     return RedisClient.client;
//   }

//   /**
//    * Stops and deletes the client if it is present, else do nothing
//    *
//    * @param flush Determines whether to flush the DB or not after closing the connection
//    */
//   static async deleteIfPresent(flush = false) {
//     if (RedisClient.client === null) {
//       return;
//     }

//     if (flush) {
//       await RedisClient.client.flushDb();
//       console.log('Database flushed!');
//     }

//     await RedisClient.client.quit();
//     RedisClient.client = null;
//   }

//   /**
//    * Converts a JS object into a JSON string.
//    *
//    * @param {Map} users Map type
//    * @returns string object representing the JSON object
//    */
//   static toJson(users) {
//     if (users === null || users === undefined) {
//       throw new JsonParseError('Unable to parse JS object into JSON string');
//     }

//     return JSON.stringify(users);
//   }

//   /**
//    * Converts the JSON string back into its corresponding JS type
//    *
//    * @param {string} results JSON string
//    * @returns Map object
//    */
//   static fromJson(results) {
//     // if results are undefined, nothing happens since we cannot parse an undefined object
//     if (results === undefined) {
//       return;
//     }

//     // if null, then throw a parsing error since we cannot parse null
//     if (results === null) {
//       throw new JsonParseError(
//         'Unable to parse JSON string back into JS object'
//       );
//     }

//     return JSON.parse(results);
//   }

//   /**
//    * Retrieves the next available room ID. This is guaranteed to be safe since Redis
//    * runs in one thread and hence it is unlikely for concurrent edits to be made to the _id
//    * variable.
//    */
//   async #getNextAvailableRoomId() {
//     // increment the autoincrementing variable until we find a roomId that is not used
//     // max number of keys in redis is 2^31 - 1, this is something we can never hit given the scale
//     // of our application, so this is safe, it will always find an valid integer value

//     const client = await RedisClient.createIfAbsent();

//     while (
//       (await client.get(
//         `${RedisClient.roomIdPrefix}${await this.#retrieveAutoIncrVar()}`
//       )) !== null
//     ) {
//       await this.#incrementAutoIncrVar();
//     }

//     const nextId = `${
//       RedisClient.roomIdPrefix
//     }${await this.#retrieveAutoIncrVar()}`;

//     // increment the auto incrementor as this room id is already used
//     await this.#incrementAutoIncrVar();

//     return nextId;
//   }

//   /**
//    * Returns the list of users associated with the room (Room's View)
//    *
//    * @param {String} room Room ID to query
//    * @returns {Array<String>} List of users in a room or null if the room does not exist
//    */
//   async getUser(room) {
//     const client = await RedisClient.createIfAbsent();

//     try {
//       const results = (await client.hGetAll(room))['users'];
//       const jsonified = RedisClient.fromJson(results);

//       return jsonified === undefined ? null : jsonified;
//     } catch (err) {
//       console.error(`Error: Cannot retrieve room due to ${err}`);
//       return null;
//     }
//   }

//   /**
//    * Checks if a user is found in the database
//    *
//    * @param {String} user User ID to find
//    * @returns true if the database contains the user id else false
//    */
//   async isUserInRedis(user) {
//     const client = await RedisClient.createIfAbsent();
//     const iterator_params = {
//       MATCH: `${RedisClient.roomIdPrefix}*`,
//     };

//     // scan through all keys (roomIds)
//     for await (const key of client.scanIterator(iterator_params)) {
//       // get the users associated with the roomId
//       const roomUsers = RedisClient.fromJson(
//         (await client.hGetAll(key))['users']
//       );

//       // for each user in the room, check if there is a match with the user of interest
//       for (const roomUser of roomUsers) {
//         if (user === roomUser) {
//           return true;
//         }
//       }
//     }

//     return false;
//   }

//   /**
//    * Checks if a room is found in the database
//    *
//    * @param {String} room Room ID to find
//    * @returns true if the database contains the room ID else false
//    */
//   async isRoomInRedis(room) {
//     return (await (await RedisClient.createIfAbsent()).exists(room)) === 1;
//   }

//   /**
//    * Returns the room's details from the perspective of the user (User's View)
//    *
//    * Adapted logic from https://stackoverflow.com/questions/37642762/using-redis-scan-in-node
//    *
//    * @param {String} user User ID to query
//    * @returns {Map<String, Map<String, Array<String>>>} User's view of the room it is associated with
//    *                                                    or null if it is not associated with any rooms
//    */
//   async getRoom(user) {
//     const client = await RedisClient.createIfAbsent();
//     const iterator_params = {
//       MATCH: `${RedisClient.roomIdPrefix}*`,
//     };

//     // scan through all keys (roomIds)
//     for await (const key of client.scanIterator(iterator_params)) {
//       // get the users associated with the roomId
//       const roomUsers = (await client.hGetAll(key))?.users ?? [];

//       // for each user in the room, check if there is a match with the user of interest
//       if (roomUsers.includes(user)) {
//         return {
//           [key]: {
//             users: RedisClient.fromJson(roomUsers),
//           },
//         };
//       }
//     }

//     return null;
//   }

//   /**
//    * Creates a room with the default users associated with it.
//    *
//    * @param {Array<String>} users List of user IDs to associate to the created room
//    * @param {String} roomId optional roomId to register users into
//    * @returns Room ID created
//    */
//   async createRoom(users, roomId = null) {
//     // check if the room is available
//     if (roomId !== null && (await this.getUser(roomId)) !== null) {
//       throw new RoomNotEmptyError('Room already occupied');
//     }

//     // make sure that none of the users are in the room
//     for (const user of users) {
//       const findRoom = await this.getRoom(user);

//       if (findRoom !== null) {
//         throw new UserAlreadyFoundInRoomError(
//           `User ${user} found in existing room!`
//         );
//       }
//     }

//     // prioritise the input room ID first
//     const newRoomId = roomId ?? (await this.#getNextAvailableRoomId());

//     // create the room
//     await (
//       await RedisClient.createIfAbsent()
//     ).hSet(newRoomId, 'users', RedisClient.toJson(users));

//     return newRoomId;
//   }

//   /**
//    * Deletes a room.
//    *
//    * @param {String} room Room ID of room to delete
//    */
//   async deleteRoom(room) {
//     const client = await RedisClient.createIfAbsent();
//     const results = await this.getUser(room);

//     if (results === null) {
//       throw new RoomNotFoundError('Invalid Room ID provided');
//     }

//     if (results.length > 0) {
//       throw new RoomNotEmptyError('Room is not empty and cannot be deleted');
//     }

//     await client.del(room, (err, resp) => {
//       if (error) {
//         console.error('Unable to delete room!');
//         throw new RoomDeletionError(`Unable to delete room: ${err}`);
//       }
//     });
//   }

//   /**
//    * Retrieves the autoincrementing variable
//    */
//   async #retrieveAutoIncrVar() {
//     return await (
//       await RedisClient.createIfAbsent()
//     ).get(RedisClient.autoincrementingId);
//   }

//   /**
//    * Increment the autoincrementing variable
//    */
//   async #incrementAutoIncrVar() {
//     await (
//       await RedisClient.createIfAbsent()
//     ).incr(RedisClient.autoincrementingId);
//   }

//   /**
//    * Registers a user to a room
//    *
//    * @param {String} user User ID of user to register
//    * @param {String} room Room ID of room to associate user with
//    * @returns String representing room Id or null if registered successfully
//    */
//   async registerUser(user, room) {
//     const userRoom = await this.getRoom(user);
//     const client = await RedisClient.createIfAbsent();

//     // new user who does not exist in any room
//     if (userRoom === null) {
//       if (await this.isRoomInRedis(room)) {
//         // if room already exist, then just add user to it
//         const rawUsers = await client.hGetAll(room);
//         const users = RedisClient.fromJson(rawUsers['users']);
//         users.push(user);

//         await client.hSet(room, 'users', RedisClient.toJson(users));
//         return null;
//       } else {
//         // room dont exist, so create it
//         return this.createRoom([user], room);
//       }
//     } else {
//       // user found in room already, so throw error
//       throw new UserAlreadyFoundInRoomError(
//         'User is already registered to a room'
//       );
//     }
//   }

//   /**
//    * Deregisters a user from a room
//    *
//    * @param {String} user User ID of user to deregister
//    * @param {String} room Room ID of room to disassociate user with
//    */
//   async deregisterUser(user, room) {
//     const userRoom = await this.getRoom(user);
//     const client = await RedisClient.createIfAbsent();

//     if (userRoom === null) {
//       throw new UserNotFoundInRoomError('User is not registered to any rooms');
//     }

//     if (!Object.keys(userRoom).includes(room)) {
//       // user is not in the specified room
//       throw new UserNotFoundInRoomError(
//         'User is not registered to the specified room'
//       );
//     }

//     const users = userRoom[room]['users'].filter((x) => x !== user);
//     await client.hSet(room, 'users', RedisClient.toJson(users));
//     return null;
//   }

//   /**
//    * Debug function to permit the dumping of all active session
//    *
//    * FOR DEBUGGING PURPOSES ONLY
//    * @returns Map containing the mappings of roomId to List of users
//    */
//   async dumpRedis() {
//     const database = {};
//     const client = await RedisClient.createIfAbsent();
//     const iterator_params = {
//       MATCH: `*`,
//     };

//     // scan through all keys (roomIds)
//     for await (const key of client.scanIterator(iterator_params)) {
//       // get the users associated with the roomId
//       try {
//         database[key] = await client.hGetAll(key);
//       } catch (err) {
//         database[key] = await client.get(key);
//       }
//     }

//     return database;
//   }
// }

export default LocalClient;
