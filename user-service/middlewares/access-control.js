import { verifyAccessToken } from "../services.js";

export function verifyAuthMiddleware(req, res, next) {
    const { accessToken } = req.cookies;

    // Check if access token is in cookie
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided, you must be logged in first!' });
    }

    // Verify access token
    const result = verifyAccessToken(accessToken);
    console.log(result)
    if (!result) {
        return res.status(403).json({ message: 'Invalid token provided' })
    }

    // Set user object in request
    req.user = { email: result.email, displayName: result.displayName, isAdmin: result.isAdmin };

    return next();
}

export function verifyIsAdminMiddleware(req, res, next) {
    const { accessToken } = req.cookies;

    // Check if access token is in cookie
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided, you must be logged in first!' });
    }

    // Verify access token
    const result = verifyAccessToken(accessToken);
    console.log(result)
    if (!result) {
        return res.status(403).json({ message: 'Invalid token provided' })
    }

    // Set isAdmin in request
    req.isAdmin = result.isAdmin;

    return next();
}