import { Request, Response, NextFunction } from "express";
import { db, users } from "@workspace/db";

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

/**
 * The first version of Qovo had one local learner and no login screen.
 * Keep that learner's migrated progress visible during development until
 * Google OAuth is configured, but never enable the bridge in production.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.session?.userId) {
    next();
    return;
  }

  const googleConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  if (process.env.NODE_ENV !== "production" && !googleConfigured) {
    const [legacyUser] = await db
      .select()
      .from(users)
      .orderBy(users.id)
      .limit(1);

    if (legacyUser) {
      req.session.userId = legacyUser.id;
      req.session.user = {
        id: legacyUser.id,
        email: legacyUser.email,
        name: legacyUser.name,
        avatarUrl: legacyUser.avatarUrl,
        displayName: legacyUser.displayName,
      };
      next();
      return;
    }
  }

  res.status(401).json({ error: "Not authenticated" });
}
