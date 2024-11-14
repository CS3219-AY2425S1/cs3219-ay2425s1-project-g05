import express from "express"
import cookieParser from 'cookie-parser';
import userRouter from "./routers/user-router.js"
import corsMiddleware from "./middlewares/cors.js"
import { connectToDB } from "./services.js";
import dotenv from 'dotenv';

// Create express app
const app = express()

// Setup environment variables
dotenv.config();

// Initialise middlewares
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(corsMiddleware);

// Initialise routers
app.use("/api/user-service/users", userRouter)

// Test Route for Health Checks
app.get("/healthz", (req, res) => {
    res.status(200).json({ message: "Connected to /healthz route of user-service" });
});

// If in test mode, just listen at port
if (process.env.NODE_ENV === 'test') {
    console.log("In test mode, don't connect to prod DB")
    app.listen(process.env.PORT);
    console.log(`User service listening at port ${process.env.PORT}`)
} else {
    await connectToDB().then(() => {
        console.log("MongoDB Connected!");
        app.listen(process.env.PORT);
        console.log(`User service listening at port ${process.env.PORT}`)
    }).catch((error) => {
        console.log("Failed to connect to DB");
        console.log(error);
    });
}

export default app;