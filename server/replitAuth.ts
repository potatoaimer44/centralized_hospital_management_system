import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PgStore = connectPg(session);

export const isReplitAuthAvailable = () => {
  return !!(process.env.REPLIT_DEPLOYMENT_URL && process.env.REPLIT_DEPLOYMENT_ID);
};

const getOidcConfig = memoize(
  async () => {
    if (!isReplitAuthAvailable()) {
      throw new Error("Replit Auth not configured");
    }
    return client.discovery(
      new URL(process.env.REPLIT_DEPLOYMENT_URL!),
      process.env.REPLIT_DEPLOYMENT_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionStore = new PgStore({ pool, createTableIfMissing: true });
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

function updateUserSession(
  user: Express.User,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims()!;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims.exp;
}

async function upsertUser(
  claims: client.IDToken,
  storage: any
): Promise<Express.User> {
  const user = await storage.upsertUser({
    id: claims.sub,
    email: claims.email as string | undefined,
    firstName: claims.first_name as string | undefined,
    lastName: claims.last_name as string | undefined,
    profileImageUrl: claims.profile_image as string | undefined,
  });
  return user;
}

export async function setupAuth(app: Express, storage: any) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!isReplitAuthAvailable()) {
    console.log("Replit Auth not configured - running in development mode without auth");
    
    app.get("/api/login", (_req, res) => {
      res.redirect("/");
    });

    app.get("/api/callback", (_req, res) => {
      res.redirect("/");
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });

    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (tokens, verified) => {
    try {
      const user = await upsertUser(tokens.claims()!, storage);
      updateUserSession(user, tokens);
      verified(null, user);
    } catch (err) {
      verified(err as Error);
    }
  };

  const strategy = new Strategy(
    {
      config,
      scope: "openid email profile",
      callbackURL: "/api/callback",
    },
    verify
  );

  passport.use("replit", strategy);

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  app.get("/api/login", passport.authenticate("replit"));

  app.get(
    "/api/callback",
    passport.authenticate("replit", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!isReplitAuthAvailable()) {
    return next();
  }

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user!;
  const now = Math.floor(Date.now() / 1000);

  if (user.expires_at && user.expires_at < now + 300) {
    try {
      const config = await getOidcConfig();
      const tokens = await client.refreshTokenGrant(config, user.refresh_token!);
      updateUserSession(user, tokens);
    } catch {
      req.logout(() => {});
      return res.status(401).json({ message: "Session expired" });
    }
  }

  next();
};
