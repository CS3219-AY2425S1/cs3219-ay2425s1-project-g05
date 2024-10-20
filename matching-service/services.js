import { connect } from 'mongoose';

export async function connectToDB() {
    let mongoDBUri = process.env.MONGO_TEST_URI;
    await connect(mongoDBUri);
}