import {
    _findPendingUserByCriteria,
    _deletePendingUserByEmail,
    _createPendingUser,
    _findPendingUserByEmail,
    _deletePendingUserBySocketId,
    _findAllPendingUsers,
    _deletePendingUserByDocId
} from "./repository.js";

export async function ormFindPendingUserByCriteria(criteria) {
    return _findPendingUserByCriteria(criteria);
}

export async function ormDeletePendingUserByEmail(email) {
    return _deletePendingUserByEmail(email);
}

export async function ormFindPendingUserByEmail(email) {
    return _findPendingUserByEmail(email);
}

export async function ormCreatePendingUser(data) {
    return _createPendingUser(data);
}

export async function ormDeletePendingUserBySocketId(socketId) {
    return _deletePendingUserBySocketId(socketId);
}

export async function ormFindAllPendingUsers() {
    return _findAllPendingUsers();
}

export async function ormDeletePendingUserByDocId(docId) {
    return _deletePendingUserByDocId(docId);
}