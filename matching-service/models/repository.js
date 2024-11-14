import PendingUserModel from "./pendingUser-model.js";

export async function _findPendingUserByCriteria({ difficulties, categoriesId, userId }) {
    return PendingUserModel
        .findOne({
            difficulties: { $in: difficulties },
            categoriesId: { $in: categoriesId },
            userId: { $ne: userId }
        })
        .sort({ priority: -1 });
}

export async function _deletePendingUserByUserId(id) {
    return PendingUserModel.findOneAndDelete({ userId: id });
}

export async function _findPendingUserByUserId(id) {
    return PendingUserModel.findOne({ userId: id });
}

export async function _createPendingUser(param) {
    return PendingUserModel.create(param);
}

export async function _deletePendingUserBySocketId(socketId) {
    return PendingUserModel.findOneAndDelete({ socketId: socketId });
}

export async function _findAllPendingUsers() {
    return PendingUserModel.find({}).sort({ priority: -1 });
}

export async function _deletePendingUserByDocId(docId) {
    return PendingUserModel.findOneAndDelete({ _id: docId });
}