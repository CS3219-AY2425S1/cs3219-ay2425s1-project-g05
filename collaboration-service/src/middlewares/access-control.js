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

function verifyAuthMiddleware(req, res, next) {
  const { accessToken } = req.cookies;

  // if (!cookies) {
  //   return next(new Error('Unauthorized: No cookies found'));
  // }

  // const accessToken = cookies
  //   .split('; ')
  //   .find((row) => row.startsWith('accessToken='))
  //   ?.split('=')[1];

  if (!accessToken) {
    return res
      .status(403)
      .json({ statusCode: 403, message: 'Missing Access Token' });
  }

  const user = verifyAccessToken(accessToken);
  if (!user) {
    return res
      .status(403)
      .json({ statusCode: 403, message: 'Missing Access Token' });
  }

  req.user = { ...user }

  return next();
}

export { verifyAccessToken, verifyAuthMiddleware };
