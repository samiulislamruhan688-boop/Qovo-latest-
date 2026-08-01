import { Request, Response, NextFunction } from "express";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  displayName: string | null;
}

declare module "express-session" {
  interface SessionData {
    userId: number;
    user: AuthUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session?.userId) {
    next();
    return;
  }
  res.status(401).json({ error: "Not authenticated" });
}
