import express from 'express';
import {
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
  getRoomStatus,
  updateRoomStatus,
} from '../session/api.js';
import { verifyAuthMiddleware } from '../middlewares/access-control.js';

const router = express.Router();

// retrieve details about the room
router.route('/users/').get(verifyAuthMiddleware, getUserDetails);

// retrieve details about the user
router.route('/rooms/:roomId').get(verifyAuthMiddleware, getRoomDetails);

// check if room is deleted or not
router.route('/rooms/status/:roomId').get(verifyAuthMiddleware, getRoomStatus);

// mark a room as deleted
router
  .route('/rooms/status/:roomId')
  .post(verifyAuthMiddleware, updateRoomStatus);

// create a room
router.route('/create-room').post(verifyAuthMiddleware, createRoom);

// delete a room
router.route('/rooms/').delete(verifyAuthMiddleware, deleteRoom);

// register user to room
router.route('/register/').post(verifyAuthMiddleware, registerUser);

// deregister user to room
router.route('/deregister/').post(verifyAuthMiddleware, deregisterUser);

export { router };
