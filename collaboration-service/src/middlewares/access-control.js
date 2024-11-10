import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

config();

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

function verifyAuthMiddleware(socket, next) {
    const cookies = socket.request.headers.cookie;

    if (!cookies) {
        return next(new Error("Unauthorized: No cookies found"));
    }

    const accessToken = cookies
        .split("; ")
        .find(row => row.startsWith("accessToken="))
        ?.split("=")[1];

    if (!accessToken) {
        return next(new Error("Unauthorized: No access token found"));
    }

    if (!verifyAccessToken(accessToken)) {
        return next(new Error("Unauthorized: Invalid token"));
    }

    next();
};

export { verifyAccessToken, verifyAuthMiddleware };
