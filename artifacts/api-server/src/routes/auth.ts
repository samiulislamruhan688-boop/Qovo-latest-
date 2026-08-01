import { Router, type IRouter } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq } from "drizzle-orm";
import { db, users } from "@workspace/db";
import { requireAuth, type AuthUser } from "../lib/auth";

const router: IRouter = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_AUTH_CONFIGURED = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${process.env.PORT ?? 3000}`;

if (GOOGLE_AUTH_CONFIGURED) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? "";
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          const existing = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(users)
              .set({ name: profile.displayName, avatarUrl, updatedAt: new Date() })
              .where(eq(users.id, existing[0].id));
            return done(null, existing[0]);
          }

          const [created] = await db
            .insert(users)
            .values({
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatarUrl,
            })
            .returning();

          return done(null, created);
        } catch (err) {
          return done(err as Error);
        }
      },
    ),
  );
}

passport.serializeUser((user, done) => {
  done(null, (user as { id: number }).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user ?? null);
  } catch (err) {
    done(err);
  }
});

if (GOOGLE_AUTH_CONFIGURED) {
  router.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] }),
  );

  router.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?auth=failed", session: true }),
    (req, res) => {
      const u = req.user as { id: number; name: string; email: string; avatarUrl: string | null; displayName: string | null };
      req.session.userId = u.id;
      req.session.user = {
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        displayName: u.displayName,
      };
      res.redirect("/?auth=success");
    },
  );
} else {
  router.get("/auth/google", (_req, res): void => {
    res.status(503).json({ error: "Google sign-in is not configured" });
  });
  router.get("/auth/google/callback", (_req, res): void => {
    res.status(503).json({ error: "Google sign-in is not configured" });
  });
}

router.get("/auth/me", requireAuth, (req, res): void => {
  res.json(req.session.user);
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("qovo.sid");
    res.json({ ok: true });
  });
});

router.patch("/auth/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const { displayName, school, district, sscBatch, studyGroup } = req.body as {
    displayName?: string;
    school?: string;
    district?: string;
    sscBatch?: string;
    studyGroup?: string;
  };

  await db
    .update(users)
    .set({
      displayName: displayName ?? undefined,
      school: school ?? undefined,
      district: district ?? undefined,
      sscBatch: sscBatch ?? undefined,
      studyGroup: studyGroup ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const [updated] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const authUser: AuthUser = {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    displayName: updated.displayName,
  };
  req.session.user = authUser;
  res.json({ ok: true, user: authUser });
});

export { passport };
export default router;
