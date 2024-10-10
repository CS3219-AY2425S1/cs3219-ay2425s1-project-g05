import ForbiddenError from "../errors/ForbiddenError.js";
import jwt from 'jsonwebtoken';

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

const getUser = (req, res, next) => {
  // TODO: Remove after isAdmin is stored in cookies 
  console.log(req.cookies);
  if (!req.cookies.accessToken) {
    throw new ForbiddenError("Access Token not found");
  }
  const user = verifyAccessToken(req.cookies.accessToken);
  if (!user) {
    throw new ForbiddenError("Access Token verification failed, no user found.");
  }

  if (user) {
    req.userEmail = user.email;
    next()
  } else {
    throw new ForbiddenError("Error getting user");
  }
};

export default getUser;
