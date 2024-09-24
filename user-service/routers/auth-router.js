import express from "express"
import { verifyAuth, verifyIsAdmin } from "../controllers/auth-controller.js"

const authRouter = express.Router()

authRouter
    .post("/auth", verifyAuth)
    .post("/admin", verifyIsAdmin)

export default authRouter