import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose, { connect } from "mongoose";

const TOKEN_EXPIRY = "1d"

export async function connectToDB() {
  let mongoDBUri = process.env.MONGO_PROD_URI;
  await connect(mongoDBUri);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function checkPasswordStrength(password) {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return password.match(passwordRegex) !== null;
}

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function generateAccessToken({ _id, email, displayName, isAdmin, isDeleted }) {
  return jwt.sign({ userId: _id.toString(), email: email, displayName: displayName, isAdmin: isAdmin, isDeleted }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

export function generateRefreshToken({ _id, email, displayName, isAdmin, isDeleted }) {
  return jwt.sign({ userId: _id.toString(), email: email, displayName: displayName, isAdmin: isAdmin, isDeleted }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

export function isValidUserId(id) {
  return mongoose.isValidObjectId(id)
}