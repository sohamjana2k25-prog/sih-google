import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'apaar-sentinel-sih-2024-secure-jwt-key-aicte-reg-secret-8921';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'AICTE_ADMIN' | 'INSTITUTION_ADMIN' | 'STUDENT';
  name: string;
  institutionId?: string;
  studentId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For prototype convenience, if demo requests lack token, allow fallback to query/header role or reject cleanly
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function authorizeRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions for this regulatory action' });
    }
    next();
  };
}
