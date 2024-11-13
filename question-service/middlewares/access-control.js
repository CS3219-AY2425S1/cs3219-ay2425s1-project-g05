import jwt from 'jsonwebtoken';
import ForbiddenError from "../errors/ForbiddenError.js";
import UnauthorizedError from "../errors/UnauthorisedError.js";

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

export function checkAdmin(req, res, next) {
  // TODO: Remove after isAdmin is stored in cookies 
  //console.log(req.cookies);
  if (!req.cookies.accessToken) {
    throw new UnauthorizedError("Access Token not found");
  }
  const user = verifyAccessToken(req.cookies.accessToken);
  if (!user) {
    throw new UnauthorizedError("No user found");
  }

  const isAdmin = user.isAdmin;

  if (isAdmin) {
    return next();
  } else {
    throw new ForbiddenError("Non-admin users are not allowed to perform this action");
  }
};

export function checkUser(req, res, next) {
  console.log(req.cookies);
  if (!req.cookies.accessToken) {
    throw new UnauthorizedError("Access Token not found");
  }
  const user = verifyAccessToken(req.cookies.accessToken);
  if (!user) {
    throw new UnauthorizedError("No user found");
  }

  const userId = user.userId;

  if (userId) {
    return next();
  } else {
    throw new ForbiddenError("Non-admin users are not allowed to perform this action");
  }
};


