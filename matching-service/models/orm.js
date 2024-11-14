import {
    _findPendingUserByCriteria,
    _deletePendingUserByUserId,
    _createPendingUser,
    _findPendingUserByUserId,
    _deletePendingUserBySocketId,
    _findAllPendingUsers,
    _deletePendingUserByDocId
} from "./repository.js";

export async function ormFindPendingUserByCriteria(criteria) {
    return _findPendingUserByCriteria(criteria);
}

export async function ormDeletePendingUserByUserId(id) {
    return _deletePendingUserByUserId(id);
}

export async function ormFindPendingUserByUserId(id) {
    return _findPendingUserByUserId(id);
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