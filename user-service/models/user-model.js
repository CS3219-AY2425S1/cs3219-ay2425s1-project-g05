import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        displayName: {
            type: String,
            required: true
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false,
        }
    },
    {
        timestamps: true
    }
);

const UserModel = mongoose.model("User", userSchema)
export default UserModel;