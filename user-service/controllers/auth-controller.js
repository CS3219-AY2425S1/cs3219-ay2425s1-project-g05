import { verifyAuthMiddleware, verifyIsAdminMiddleware } from "../middlewares/access-control.js";

export function verifyAuth(req, res) {
    verifyAuthMiddleware(req, res, () => {
        console.log("User authenticated with", req.user);
        return res.status(200).json({ message: "User authenticated", user: req.user });
    })
}

export function verifyIsAdmin(req, res) {
    verifyIsAdminMiddleware(req, res, () => {
        if (!req.isAdmin) {
            return res.status(403).json({ message: "User is not admin" });
        }
        return res.status(200).json({ message: "User is an admin" });
    })
}
