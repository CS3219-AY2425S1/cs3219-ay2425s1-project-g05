
import express from "express";
import { validateAttempt } from "../middlewares/validation.js";
import { createAttempt, deleteAttempt, getAttempt, getUserAttempts, updateAttempt } from "../controller/history-controller.js";
import getUser from "../middlewares/userMiddleware.js";

const router = express.Router();

// CREATE NEW ATTEMPT
router.post('/attempt', validateAttempt, getUser, createAttempt);

// GET ATTEMPT BASED ON USERID AND ROOMID
router.route("/attempt/:roomId").get(getUser, getAttempt);

// DELETE ATTEMPT BASED ON USERID AND ROOMID
router.route("/attempt/:roomId").delete(getUser, deleteAttempt);

// UPDATE ATTEMPT BY ID
router.route("/attempt/:roomId").put(getUser, updateAttempt);

// GET ALL ATTEMPTS BY USERID
router.route("/user/attempts").get(getUser, getUserAttempts);

 export default router;
