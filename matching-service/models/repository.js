import PendingUserModel from "./pendingUser-model.js";
import RoomModel from "./room-model.js";
import mongoose from "mongoose";

export async function _findPendingUserByCriteria({ difficulties, categories, email }) {
    return PendingUserModel.findOne({
        difficulties: { $in: difficulties },
        categories: { $in: categories },
        email: { $ne: email }
    });
}

export async function _deletePendingUserByEmail(email) {
    return PendingUserModel.findOneAndDelete({ email: email });
}

export async function _createRoom({ emails, displayNames, question, difficulties, categories }) {
    const objectId = new mongoose.Types.ObjectId();
    return RoomModel.create({
        _id: objectId,
        emails: emails,
        displayNames: displayNames,
        question: question,
        roomId: objectId,
        difficulties: difficulties,
        categories: categories
    });
}

export async function _findPendingUserByEmail(email) {
    return PendingUserModel.findOne({ email: email });
}

export async function _createPendingUser(param) {
    return PendingUserModel.create(param);
}

export async function _deletePendingUserById(socketId) {
    return PendingUserModel.findOneAndDelete({ socketId: socketId });
}

export async function _findRoom(email) {
    return RoomModel.findOne({ emails: email });
}

export async function _removeFromRoom(roomId, email, displayName) {
    return RoomModel.findByIdAndUpdate(
        roomId,
        { $pull: { emails: email, displayNames: displayName } },
        { new: true }
    );
}

export async function _deleteRoom(roomId) {
    return RoomModel.findOneAndDelete({ roomId: roomId });
}