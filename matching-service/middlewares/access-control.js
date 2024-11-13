import { verifyAccessToken } from "../services.js";

export function verifyAuthMiddleware(socket, next) {
    const cookies = socket.request.headers.cookie;

    // If no cookies are found, reject the connection
    if (!cookies) {
        console.log("No cookies found, rejecting connection");
        return next(new Error("Unauthorized: No cookies found"));
    }

    // Extract access token from cookies
    const accessToken = cookies
        .split("; ")
        .find(row => row.startsWith("accessToken="))
        ?.split("=")[1];

    // If access token is not found, reject the connection
    if (!accessToken) {
        console.log("No access token found, rejecting connection");
        return next(new Error("Unauthorized: No access token found"));
    }

    // Verify the access token
    const isValidToken = verifyAccessToken(accessToken);
    if (!isValidToken) {
        console.log(`Invalid token ${accessToken}, rejecting connection`);
        return next(new Error("Unauthorized: Invalid token"));
    }

    // Token is valid, proceed with connection
    console.log("Authorized connection");
    next(); // Allow connection to proceed
};