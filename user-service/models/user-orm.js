import { _createUser, _deleteUser, _findUser, _updateUser, _findUserById } from "./repository.js"

export async function ormCreateUser(email, password, displayName) {
    const user = await _createUser({ email, password, displayName });
    if (!user) {
        return undefined;
    }
    return user.toObject();
};

export async function ormDeleteUser(email) {
    const user = await _deleteUser(email);
    if (!user) {
        return undefined;
    }
    return user.toObject();
};

export async function ormFindUser(email) {
    const user = await _findUser(email);
    if (!user) {
        return undefined;
    }
    return user.toObject();
};

export async function ormUpdateUser(email, prop) {
    const user = await _updateUser({ email, prop });
    if (!user) {
        return undefined;
    }
    return user.toObject();
};

export async function ormFindUserById(id) {
    const user = await _findUserById(id);
    if (!user) {
        return undefined;
    }
    return user.toObject();
};