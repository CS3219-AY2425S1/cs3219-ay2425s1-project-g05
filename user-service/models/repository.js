import UserModel from "../models/user-model.js"


export async function _createUser(param) {
    return UserModel.create(param);
}

export async function _deleteUser(param) {
    return UserModel.findOneAndUpdate({ email: param, isDeleted: false }, { isDeleted: true }, { new: true }); // soft delete
}

export async function _findUser(param) {
    return UserModel.findOne({ email: param, isDeleted: false });
}

export async function _updateUser({ email, prop }) {
    return UserModel.findOneAndUpdate({ email: email, isDeleted: false }, prop, { new: true });
}

export async function _findUserById(id) {
    return UserModel.findOne({ _id: id, isDeleted: false });
}