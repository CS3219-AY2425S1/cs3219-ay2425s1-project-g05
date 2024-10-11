import { connect } from 'mongoose';
import axios from 'axios';

export async function connectToDB() {
    let mongoDBUri = process.env.MONGO_TEST_URI;
    await connect(mongoDBUri);
}

export async function getQuestion(commonDifficulties, commonCategories) {
    try {
        const response = await axios.get('http://localhost:8003/api/question-service/random/', {
            params: {
                difficulty: commonDifficulties,
                categories: commonCategories
            }
        });
        console.log(response.data);
        return response.data.data.question;
    } catch (error) {
        console.error('Error:', error.message);
        return undefined;
    }
}