import { ormCreateUser, ormDeleteUser, ormFindUser, ormUpdateUser } from '../models/user-orm.js';
import { comparePassword, hashPassword, generateAccessToken, checkPasswordStrength } from '../services.js';

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" })
        }

        // Check if user exists
        const user = await ormFindUser(email);
        console.log(user)
        if (!user) {
            return res.status(401).json({ message: "Incorrect email or password" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        // Check if password is correct
        const isCorrectPassword = await comparePassword(password, user.password);
        if (!isCorrectPassword) {
            return res.status(401).json({ message: "Incorrect email or password" })
        }

        // Generate access token
        const accessToken = generateAccessToken(user);
        console.log(accessToken)
        if (process.env.NODE_ENV === 'DEV') {
            res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'none', secure: true }); // 60 minutes
        } else {
            res.cookie('accessToken', accessToken, { httpOnly: true }); // 60 minutes
        }

        return res.status(200).json({ message: "Login successful", user: returnedUser })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Unknown server error" })
    }
}

export async function logoutUser(req, res) {
    try {
        // Clear access token cookie
        res.clearCookie('accessToken');
        return res.status(200).json({ message: "Logout successful" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Unknown server error" })
    }
}

export async function createUser(req, res) {
    try {
        const { email, password, displayName } = req.body;

        // Check if email, password and displayName are provided
        if (!email || !password || !displayName) {
            return res.status(400).json({ message: "Email, password and displayName are required" })
        }

        // Check if user already exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" })
        }

        // Check if password is strong enough
        if (!checkPasswordStrength(password)) {
            return res.status(400).json({
                message: "Password does not meet strength requirement. "
                    + "Passwords should have minimum 8 characters, with at least alphabets and numbers",
            });
        }

        // Hash password and create user
        const hashedPassword = hashPassword(password);
        const user = await ormCreateUser(email, hashedPassword, displayName);
        if (!user) {
            return res.status(500).json({ message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        return res.status(201).json({ message: "New user created successfully", user: returnedUser })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Unknown server error" })
    }
}

export async function deleteUser(req, res) {
    try {
        const email = req.user.email; // Delete the user specified from token

        // Check if email is provided
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" })
        }

        // Delete user
        const user = await ormDeleteUser(email);
        if (!user) {
            return res.status(500).json({ message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        // Clear access token cookie
        res.clearCookie('accessToken');

        return res.status(200).json({ message: "User deleted successfully", user: returnedUser })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Unknown server error" })
    }
}

export async function changePassword(req, res) {
    try {
        const { password, newPassword } = req.body;
        const email = req.user.email; // Change password for logged in user from token

        // Check if email, password and newPassword are provided
        if (!email || !password || !newPassword) {
            return res.status(400).json({ message: "Email, password and newPassword are required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" })
        }

        // Check if password is correct
        const isCorrectPassword = await comparePassword(password, existingUser.password);
        if (!isCorrectPassword) {
            return res.status(401).json({ message: "Incorrect old password needed to change password" })
        }

        // Check if password is strong enough
        if (!checkPasswordStrength(newPassword)) {
            return res.status(400).json({
                message: "Password does not meet strength requirement. "
                    + "Passwords should have minimum 8 characters, with at least alphabets and numbers",
            });
        }

        // Hash new password and update user
        const hashedNewPassword = hashPassword(newPassword);
        const updatedUser = await ormUpdateUser(email, { password: hashedNewPassword });
        if (!updatedUser) {
            return res.status(500).json({ message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...updatedUser }
        delete returnedUser.password

        return res.status(200).json({ message: "User password updated successfully", user: returnedUser })
    } catch (error) {
        return res.status(500).json({ message: "Unknown server error" })
    }
}

export async function changeDisplayName(req, res) {
    try {
        const { newDisplayName } = req.body;
        const email = req.user.email; // Change displayName for logged in user from token

        // Check if email and newDisplayName are provided
        if (!email || !newDisplayName) {
            return res.status(400).json({ message: "Email and newDisplayName are required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" })
        }

        const updatedUser = await ormUpdateUser(email, { displayName: newDisplayName });
        if (!updatedUser) {
            return res.status(500).json({ message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...updatedUser }
        delete returnedUser.password

        return res.status(200).json({ message: "User display name updated successfully", user: returnedUser })
    } catch (error) {
        return res.status(500).json({ message: "Unknown server error" })
    }
}