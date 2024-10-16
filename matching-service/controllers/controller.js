import {
    ormFindPendingUserByCriteria,
    ormDeletePendingUserByEmail,
    ormCreatePendingUser,
    ormFindPendingUserByEmail,
    ormDeletePendingUserBySocketId,
    ormFindAllPendingUsers,
    ormDeletePendingUserByDocId
} from "../models/orm.js";

export async function onDisconnect(socket) {
    console.log(`Socket disconnected: ${socket.id}`);
    console.log(`Disconnected, try to delete pending user with socketId ${socket.id}`);

    // Delete pending user with socketId after disconnect, to prevent connecting with disconnected user
    const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
    if (!deletedUser) {
        console.log(`CONTR: Could not delete pending user by socket id when disconnected`);
        return;
    }

    console.log(`Deleted pending user ${deletedUser.email} after disconnect`);
    socket.emit('disconnect-while-match');
    return;
}

export async function onCancelMatch(socket) {
    console.log(`Cancelling match: ${socket.id}`);

    // Delete pending user with socketId
    const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
    if (!deletedUser) {
        console.log(`CONTR: Could not delete pending user by socket id when cancelling match`);
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

    // Get pending user queue
    const queue = await ormFindAllPendingUsers();
    console.log(`Pending user queue before matching:`);
    console.log(queue);

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

        // Get pending user queue
        const queue = await ormFindAllPendingUsers();
        console.log(`Pending user queue after creating new pending user:`);
        console.log(queue);

        // Create timeout for deleting pending user
        setTimeout(async () => {
            console.log(`Timeout for pending user ${pendingUser.email}, try to delete pending user`);

            // Delete pending user after timeout based on docId
            const deletedUser = await ormDeletePendingUserByDocId(pendingUser._id);
            if (!deletedUser) {
                console.log(`CONTR: Could not delete pending user by docId for timeout`);
                return;
            }

            // Get pending user queue
            const queue = await ormFindAllPendingUsers();
            console.log(`Pending user queue after no match:`);
            console.log(queue);

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
            console.log(`CONTR: Could not delete pending user by email after match found`);
            return;
        }

        // Get pending user queue
        const queue = await ormFindAllPendingUsers();
        console.log(`Pending user queue after match:`);
        console.log(queue);

        // Find intersection of difficulties and categories in both users
        const commonDifficulties = difficulties.filter(d => matchedUser.difficulties.includes(d));
        const commonCategories = categories.filter(c => matchedUser.categories.includes(c));

        console.log(`Common difficulties: ${commonDifficulties}`);
        console.log(`Common categories: ${commonCategories}`);

        // Create match object
        const matchObject = {
            emails: [email, matchedUser.email],
            displayNames: [displayName, matchedUser.displayName],
            difficulties: commonDifficulties,
            categories: commonCategories,
        }
        console.log(`Match object:`);
        console.log(matchObject);

        // Emit found-match event to both users
        socket.emit("found-match", matchObject);
        io.to(matchedUser.socketId).emit("found-match", matchObject);
    }
}