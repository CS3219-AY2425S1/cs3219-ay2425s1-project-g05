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

const checkAdmin = (req, res, next) => {
  // TODO: Remove after isAdmin is stored in cookies 
  console.log(req.cookies);
  if (!req.cookies.accessToken) {
    throw new ForbiddenError("Access Token not found");
  }
  const user = verifyAccessToken(req.cookies.accessToken);
  if (!user || !user.isAdmin) {
    throw new ForbiddenError("Access Token verification failed");
  }
  const isAdmin = user.isAdmin;

  // Assuming 'isAdmin' is stored in cookies
  // const { isAdmin } = req.cookies;

  if (isAdmin) {
    return next();
  } else {
    throw new ForbiddenError("You are not authorized to perform this action");
  }
};

export default checkAdmin;
