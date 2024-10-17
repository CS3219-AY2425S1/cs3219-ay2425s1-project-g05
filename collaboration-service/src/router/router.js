import express from 'express';
import {
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
} from '../redis/api.js';

// disable admin checks for now
import checkAdmin from '../middlewares/access-control.js';

const router = express.Router();

// retrieve details about the room
router.route('/users/').get(getUserDetails);

// retrieve details about the user
router.route('/rooms/').get(getRoomDetails);

// create a room
router.route('/create-room').post(createRoom);

// delete a room
router.route('/rooms/:id').delete(deleteRoom);

// register user to room
router.route('/register/').patch(registerUser);

// deregister user to room
router.route('/deregister/').patch(deregisterUser);

export { router };
