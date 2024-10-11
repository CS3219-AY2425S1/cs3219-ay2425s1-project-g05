import {
    ormFindPendingUserByCriteria,
    ormDeletePendingUserByEmail,
    ormCreateRoom,
    ormCreatePendingUser,
    ormFindPendingUserByEmail,
    ormDeletePendingUserById,
    ormFindRoom,
    ormRemoveFromRoom,
    ormDeleteRoom
} from "../models/orm.js";
import { getQuestion } from "../services.js";

export async function onDisconnect(socket) {
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(`Disconnected, try to delete pending user with socketId ${socket.id}`);

    // Delete pending user with socketId after disconnect, to prevent connecting with disconnected user
    const deletedUser = await ormDeletePendingUserById(socket.id);
    if (!deletedUser) {
        console.log(`CONTR: Could not delete pending user when disconnected`);
        return;
    }

    console.log(`Deleted pending user ${deletedUser.email} after disconnect`);
    socket.emit('disconnect-while-match');
    return;
}

export async function onCancelMatch(socket) {
    console.log(`Cancelling match: ${socket.id}`);

    // Delete pending user with socketId
    const deletedUser = await ormDeletePendingUserById(socket.id);
    if (!deletedUser) {
        console.log(`CONTR: Could not delete pending user when cancelling match`);
        return;
    }

    console.log(`Deleted pending user ${deletedUser.email} after cancelling match`);
    return;
};

export async function onCreateMatch(socket, data, io) {
    const { difficulties, categories, email, displayName } = data;
    const socketId = socket.id;

    console.log(`Initiate create match by ${socket.id} (${displayName}), with data:`);
    console.log(data);

    // Check if user is already in pending users
    const existingUser = await ormFindPendingUserByEmail(email);
    if (existingUser) {
        // User exists, so don't create new pending user entry and just return finding-match event
        console.log(`User already in pending users`);
        socket.emit('finding-match');
        return;
    }
    // User does not exist
    console.log(`User not in pending users`);

    // Find if there is a match with a pending user
    const matchedUser = await ormFindPendingUserByCriteria({ difficulties, categories, email, displayName });
    if (!matchedUser) {
        // No match found
        console.log(`CONTR: No matching users with the criteria, create new match`);

        // Create pending user entry
        const pendingUser = await ormCreatePendingUser({ email, displayName, socketId, difficulties, categories });
        if (!pendingUser) {
            console.log(`CONTR: Could not create pending user entry for new match`);
            return;
        } else {
            console.log(`Created pending user with details:`);
            console.log(pendingUser);
        }

        // Create timeout for deleting pending user
        setTimeout(async () => {
            console.log(`Timeout for pending user ${pendingUser.email}, try to delete pending user`);
            const deletedUser = await ormDeletePendingUserByEmail(pendingUser.email);
            if (!deletedUser) {
                console.log(`CONTR: Could not delete pending user for timeout`);
                return;
            }

            console.log(`Deleted pending user ${deletedUser.email} after timeout`);
            socket.emit('no-match');
            return;

        }, 60000); // 60 seconds

        // Emit finding-match event
        socket.emit('finding-match');
        return;
    } else {
        // Match found
        console.log(`Match found with ${matchedUser.displayName}, with details:`);
        console.log(matchedUser);

        // Delete pending user from database
        const deletedUser = await ormDeletePendingUserByEmail(matchedUser.email);
        if (!deletedUser) {
            console.log(`CONTR: Could not delete pending user after match found`);
            return;
        }

        // Find intersection of difficulties and categories in both users
        const commonDifficulties = difficulties.filter(d => matchedUser.difficulties.includes(d));
        const commonCategories = categories.filter(c => matchedUser.categories.includes(c));

        console.log(`Common difficulties: ${commonDifficulties}`);
        console.log(`Common categories: ${commonCategories}`);

        // Get a question from question service
        const question = await getQuestion(commonDifficulties, commonCategories);
        if (!question) {
            console.log(`CONTR: Could not retrieve question`);
            return;
        }

        console.log(`Question retrieved:`);
        console.log(question);

        // Create room entry
        const room = await ormCreateRoom({
            emails: [email, matchedUser.email],
            displayNames: [displayName, matchedUser.displayName],
            question: question,
            difficulties: commonDifficulties,
            categories: commonCategories
        });

        if (!room) {
            console.log(`CONTR: Could not create room for match`);
            return;
        }
        console.log(`Room created with details:`);
        console.log(room);

        // Emit found-match event to both users
        socket.emit("found-match", room);
        io.to(matchedUser.socketId).emit("found-match", room);
    }
}

export async function onJoinRoom(socket, email, io) {
    console.log(`User email ${email} wants to join room`);

    const room = await ormFindRoom(email);
    if (!room) {
        console.log(`CONTR: Could not find room for user ${email} to join`);
        return;
    }
    console.log(`Room found with details:`);
    console.log(room);

    // Join room
    socket.join(room.roomId);

    const clients = io.sockets.adapter.rooms.get(room.roomId); // Get the set of socket ids in the room
    console.log(`Clients in room ${room.roomId}:`);
    console.log(clients);

    // Check if both users are in the room
    if (clients.size == 2) {
        // Broadcast to both users
        io.to(room.roomId).emit("all-joined-room", room);
    } else {
        socket.emit("waiting-in-room");
    }
}

export async function onLeaveRoom(socket, user, io) {
    const { email, displayName } = user;

    console.log(`User wants to leave room:`);
    console.log(user);
    const room = await ormFindRoom(email);
    if (!room) {
        console.log(`CONTR: Could not find room for user ${email} to leave`);
        return;
    }
    console.log(`Room found with details:`);
    console.log(room);

    // Join room
    socket.leave(room.roomId);

    const clients = io.sockets.adapter.rooms.get(room.roomId); // Get the set of socket ids in the room
    console.log(`Clients in room ${room.roomId}:`);
    console.log(clients);

    // Check if user was the last to leave
    if (!clients) {
        // Remove room entry
        const deletedRoom = await ormDeleteRoom(room.roomId);
        if (!deletedRoom) {
            console.log(`CONTR: Could not delete room after last user left`);
            return;
        }
        console.log(`Deleted room ${deletedRoom.roomId}`);
    } else {
        // Remove user from room entry
        const removedUserFromRoom = await ormRemoveFromRoom(room.roomId, email, displayName);
        if (!removedUserFromRoom) {
            console.log(`CONTR: Could not remove user from the room that he left`);
            return;
        }
        console.log(`Removed user ${email} from room ${removedUserFromRoom.roomId}`);
        console.log(`Room details:`);
        console.log(removedUserFromRoom);
    }
}