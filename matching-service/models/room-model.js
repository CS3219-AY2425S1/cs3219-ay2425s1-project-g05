import mongoose from "mongoose";

const difficulties = ['EASY', 'MEDIUM', 'HARD']
const categories = ['STRINGS', 'ALGORITHMS', 'DATA STRUCTURES', 'BIT MANIPULATION', 'RECURSION', 'DATABASES', 'ARRAYS', 'BRAINTEASER']

const roomSchema = mongoose.Schema(
    {
        emails: {
            type: [String],
            required: true
        },
        displayNames: {
            type: [String],
            required: true
        },
        question: {
            type: Object,
            required: true
        },
        roomId: {
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
        }
    },
    {
        timestamps: true
    }
);

const RoomModel = mongoose.model("Room", roomSchema)
export default RoomModel;