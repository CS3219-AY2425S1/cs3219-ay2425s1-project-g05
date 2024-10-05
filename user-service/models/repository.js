import UserModel from "../models/user-model.js"


export async function _createUser(param) {
    return UserModel.create(param);
}

export async function _deleteUser(param) {
    return UserModel.findOneAndDelete({ email: param });
}

export async function _findUser(param) {
    return UserModel.findOne({ email: param });
}

export async function _updateUser({ email, prop }) {
    return UserModel.findOneAndUpdate({ email: email }, prop, { new: true });
}