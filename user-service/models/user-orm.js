import { _createUser, _deleteUser, _findUser, _updateUser } from "./repository.js"

export async function ormCreateUser(email, password, displayName) {
    try {
        const user = await _createUser({ email, password, displayName });
        return user.toObject();
    } catch (error) {
        console.log(`Error: could not create user due to: ${error}`);
        return undefined;
    }
};

export async function ormDeleteUser(email) {
    try {
        const user = await _deleteUser(email);
        return user.toObject();
    } catch (error) {
        console.log(`Error: could not delete user due to: ${error}`);
        return undefined;
    }
};

export async function ormFindUser(email) {
    try {
        const user = await _findUser(email);
        return user.toObject();
    } catch (error) {
        console.log(`Error: could not find user due to: ${error}`);
        return undefined;
    }
};

export async function ormUpdateUser(email, prop) {
    try {
        const user = await _updateUser({ email, prop });
        return user.toObject();
    } catch (error) {
        console.log(`Error: could not update user due to: ${error}`);
        return undefined;
    }
};