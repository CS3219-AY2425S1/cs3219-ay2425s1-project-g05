import { connect } from 'mongoose';
import jwt from "jsonwebtoken";

export async function connectToDB() {
    let mongoDBUri = process.env.MONGO_TEST_URI;
    await connect(mongoDBUri);
}

export function verifyAccessToken(token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        return null;
      }
      return user;
    });
  }