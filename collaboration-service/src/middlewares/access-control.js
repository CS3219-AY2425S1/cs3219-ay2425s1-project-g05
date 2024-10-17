import ForbiddenError from '../errors/ForbiddenError.js';
import jwt from 'jsonwebtoken';

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }

    return user;
  });
}

const checkAdmin = (request, response, next) => {
  if (!request.cookies.accessToken) {
    throw new ForbiddenError('Access Token not found');
  }

  const jwtUser = verifyAccessToken();

  if (!jwtUser || !jwtUser.isAdmin) {
    throw new ForbiddenError('Access Token Verification failed');
  }

  if (jwtUser.isAdmin) {
    return next();
  }

  throw new ForbiddenError('You are not authorized to perform this action');
};

export default checkAdmin;
