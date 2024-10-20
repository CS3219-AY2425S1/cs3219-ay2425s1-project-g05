import mongoose from "mongoose";

const difficulties = ['EASY', 'MEDIUM', 'HARD']
const categories = ['STRINGS', 'ALGORITHMS', 'DATA STRUCTURES', 'BIT MANIPULATION', 'RECURSION', 'DATABASES', 'ARRAYS', 'BRAINTEASER']

const pendingUserSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: true
        },
        displayName: {
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
        categories: {
            type: [String],
            enum: categories,
            required: true,
            validate: {
                validator: function (value) {
                    return value.every(v => categories.includes(v));
                },
                message: props => `${props.value} contains invalid difficulty level`
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