import {
    ormFindPendingUserByCriteria,
    ormDeletePendingUserByUserId,
    ormCreatePendingUser,
    ormFindPendingUserByUserId,
    ormDeletePendingUserBySocketId,
    ormFindAllPendingUsers,
    ormDeletePendingUserByDocId
} from "../models/orm.js";
import axios from 'axios';

export async function onDisconnect(socket) {
    try {
        console.log(`Socket disconnected: ${socket.id}`);

        // Delete pending user with socketId after disconnect, to prevent connecting with disconnected user
        const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
        if (!deletedUser) {
            console.log(`No pending user of socket id ${socket.id} to delete when disconnected`);
            return;
        }

        console.log(`Deleted pending user ${deletedUser.userId} after disconnect`);
        socket.emit('disconnect-while-match');
        return;
    } catch (error) {
        console.log(`Error when disconnect: ${error.message}`);
        socket.emit('error', error.message);
    }
}

export async function onCancelMatch(socket) {
    try {
        console.log(`Cancelling match: ${socket.id}`);

        // Delete pending user with socketId
        const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
        if (!deletedUser) {
            // Cancel match means a pending user was in the queue, so there should be a pending user to delete, but its cant be deleted
            throw new Error(`No pending user of socket id ${socket.id} to delete when cancelling match`);
        }

        console.log(`Deleted pending user ${deletedUser.userId} after cancelling match`);
        return;
    } catch (error) {
        console.log(`Error when cancelling match: ${error.message}`);
        socket.emit('error', error.message);
    }
};

export async function onCreateMatch(socket, data, io) {
    try {
        console.log("ONCREATEMATCH: ")
        console.log(data)
        console.log('----------------')
        const { difficulties, categoriesId, userId } = data;
        const socketId = socket.id;
        const priority = categoriesId.length; // Priority based on number of categories selected

        console.log(`Initiate create match by ${socket.id} (${userId}), with data:`);
        console.log(data);

        // Get and log pending user queue
        const queue = await ormFindAllPendingUsers();
        console.log(`Pending user queue before matching:`);
        console.log(queue);

        // Check if user is already in pending users
        const existingUser = await ormFindPendingUserByUserId(userId);
        if (existingUser) {
            // User exists, so don't create new pending user entry and just return finding-match event
            console.log(`User already in pending users`);
            socket.emit('finding-match');
            return;
        }

        // User does not exist
        console.log(`User not in pending users`);

        // Find if there is a match with a pending user
        const matchedUser = await ormFindPendingUserByCriteria({ difficulties, categoriesId, userId });

        async function onNoMatch() {
            // No match found
            console.log(`No matching users with the criteria, create new match`);

            // Create pending user entry
            console.log({ userId, socketId, difficulties, categoriesId, priority })
            const pendingUser = await ormCreatePendingUser({ userId, socketId, difficulties, categoriesId, priority });
            if (!pendingUser) {
                throw new Error(`Could not create pending user entry for new match`);
            } else {
                console.log(`Created pending user with details:`);
                console.log(pendingUser);
            }

            // Get and log pending user queue
            const queue = await ormFindAllPendingUsers();
            console.log(`Pending user queue after creating new pending user:`);
            console.log(queue);

            // Create timeout for deleting pending user
            setTimeout(async () => {
                console.log(`Timeout for pending user ${pendingUser.userId}, try to delete pending user`);

                // Delete pending user after timeout based on docId
                const deletedUser = await ormDeletePendingUserByDocId(pendingUser._id);
                if (!deletedUser) {
                    console.log(`No pending user by docId to delete for timeout`);
                    return;
                }

                // Get and log pending user queue
                const queue = await ormFindAllPendingUsers();
                console.log(`Pending user queue after no match:`);
                console.log(queue);

                console.log(`Deleted pending user ${deletedUser.userId} after timeout`);
                socket.emit('no-match');
                return;

            }, 50000); // 50 seconds (frontend has timer of 60secs, hence a 10 sec buffer fallback in case this service dies)

            // Emit finding-match event
            socket.emit('finding-match');
        }
        if (!matchedUser) {
            await onNoMatch()

            return;
        } else {

            // Match found
            console.log(`Match found with ${matchedUser.userId}, with details:`);
            console.log(matchedUser);

            // try to get a question first
            try {
                // Find intersection of difficulties and categories in both users
                const commonDifficulties = difficulties.filter(d => matchedUser.difficulties.includes(d));
                const commonCategories = categoriesId.filter(c => matchedUser.categoriesId.includes(c));
                console.log(`Common difficulties: ${commonDifficulties}`);
                console.log(`Common categories: ${commonCategories}`);

                // get question first
                const resp = await axios.get(
                    process.env.QUESTION_SERVICE_ENDPOINT ??
                    'http://localhost:8003/api/question-service/random',
                    {
                        params: {
                            categoriesId: commonCategories,
                            difficulty: commonDifficulties,
                        },
                    }
                );

                const questionInResponse = resp.data['data']['question'];
                if (questionInResponse === null || questionInResponse === undefined) {
                    console.log('Quesiton is missing');
                    throw new Error('Unable to query for question')
                }

                // Delete pending user from database which should be in queue
                const deletedUser = await ormDeletePendingUserByUserId(matchedUser.userId);
                if (!deletedUser) {
                    throw new Error(`Could not delete matched user by userId after match found`);
                }

                // Get and log pending user queue
                const queue = await ormFindAllPendingUsers();
                console.log(`Pending user queue after match:`);
                console.log(queue);


                // Create match object
                const matchObject = {
                    matchId: matchedUser._id.toString(),
                    userIds: [userId, matchedUser.userId],
                    difficulties: commonDifficulties,
                    categoriesId: commonCategories,
                    question: questionInResponse
                }
                console.log(`Match object:`);
                console.log(matchObject);

                // Emit found-match event to both users
                socket.emit("found-match", matchObject);
                io.to(matchedUser.socketId).emit("found-match", matchObject);

            } catch (e) {
                // no question found :(
                console.log(e)
                onNoMatch()
            }


        }
    } catch (error) {
        console.log(`Error when creating match: ${error.message}`);
        socket.emit('error', error.message);
    }
}