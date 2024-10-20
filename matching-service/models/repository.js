import PendingUserModel from "./pendingUser-model.js";

export async function _findPendingUserByCriteria({ difficulties, categories, email }) {
    return PendingUserModel
        .findOne({
            difficulties: { $in: difficulties },
            categories: { $in: categories },
            email: { $ne: email }
        })
        .sort({ priority: -1 });
}

export async function _deletePendingUserByEmail(email) {
    return PendingUserModel.findOneAndDelete({ email: email });
}

export async function _findPendingUserByEmail(email) {
    return PendingUserModel.findOne({ email: email });
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