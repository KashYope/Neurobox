import jwt from 'jsonwebtoken';
import { env } from './env.js';
const extractToken = (req) => {
    if (req.cookies && req.cookies.token) {
        return req.cookies.token;
    }
    const header = req.headers.authorization;
    if (!header)
        return null;
    const [scheme, token] = header.split(' ');
    if (!token || scheme.toLowerCase() !== 'bearer')
        return null;
    return token;
};
export const optionalAuth = (req, _res, next) => {
    const token = extractToken(req);
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, env.jwtSecret);
        req.user = decoded;
    }
    catch {
        // ignore invalid tokens but do not block request
    }
    next();
};
export const requireRole = (role) => {
    return (req, res, next) => {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        try {
            const decoded = jwt.verify(token, env.jwtSecret);
            const isAuthorized = decoded.role === role || decoded.role === 'admin' || (role === 'partner' && decoded.role === 'moderator');
            if (!isAuthorized) {
                return res.status(403).json({ message: 'Insufficient permissions' });
            }
            req.user = decoded;
            return next();
        }
        catch {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
};
