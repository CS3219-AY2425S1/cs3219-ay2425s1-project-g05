import express from "express"
import { loginUser, logoutUser, createUser, deleteUser, changePassword, changeDisplayName } from "../controllers/user-controller.js"
import { verifyAuthMiddleware } from "../middlewares/access-control.js"

const userRouter = express.Router()

userRouter
    .post("/login", loginUser)
    .post("/logout", logoutUser)
    .post("/", createUser)
    .delete("/", verifyAuthMiddleware, deleteUser)
    .put("/changePassword", verifyAuthMiddleware, changePassword)
    .put("/changeDisplayName", verifyAuthMiddleware, changeDisplayName)

export default userRouter