import { verifyAuthMiddleware } from "../middlewares/access-control.js";
import { onDisconnect, onCancelMatch, onCreateMatch } from "./controller.js";

export async function socketHandler(io) {

    io.on("connection", async (socket) => {
        socket.on("disconnect", async () => onDisconnect(socket));
        socket.on("cancel-match", async () => onCancelMatch(socket));
        socket.on("create-match", async (data) => onCreateMatch(socket, data, io));
    });

    io.use(verifyAuthMiddleware);

}