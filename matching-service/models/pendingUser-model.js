import mongoose from "mongoose";

const difficulties = ['EASY', 'MEDIUM', 'HARD']
const categories = [0, 1, 2, 3, 4, 5, 6, 7]

const pendingUserSchema = mongoose.Schema(
    {
        userId: {
            type: String,
            required: true
        },
        socketId: {
            type: String,
            required: true
        },
        difficulties: {
            type: [String],
            enum: difficulties,
            required: true,
            validate: {
                validator: function (value) {
                    return value.every(v => difficulties.includes(v));
                },
                message: props => `${props.value} contains invalid difficulty level`
            }
        },
        categoriesId: {
            type: [Number],
            enum: categories,
            required: true,
            validate: {
                validator: function (value) {
                    return value.every(v => categories.includes(v));
                },
                message: props => `${props.value} contains invalid category`
            }
        },
        priority: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);
pendingUserSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 60 });
const PendingUserModel = mongoose.model("PendingUser", pendingUserSchema)
export default PendingUserModel;