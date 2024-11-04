import { onDisconnect, onCancelMatch, onCreateMatch } from "./controller.js";

export async function socketHandler(io) {

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Disconnect event
        socket.on("disconnect", async () => onDisconnect(socket));

        // Cancel match event
        socket.on("cancel-match", async () => onCancelMatch(socket));

        // Create match event
        socket.on("create-match", async (data) => onCreateMatch(socket, data, io));

        // Test event
        socket.on("test", (data) => {
            console.log(`Test event received: ${data}`);
            socket.emit("test", `Test event received with data: ${data}`);
        });
    });

}