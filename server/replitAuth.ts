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
  const sessionStore = new PgStore({ 
    pool, 
    createTableIfMissing: false,
    tableName: 'sessions'
  });
  return session({
    secret: process.env.SESSION_SECRET || require("crypto").randomBytes(32).toString("hex"),
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
    console.log("Replit Auth not configured - running in development mode with role-based login");
    
    app.get("/api/login", (_req, res) => {
      res.redirect("/");
    });

    app.get("/api/login/:role", async (req, res) => {
      const role = req.params.role as "admin" | "doctor" | "nurse" | "patient";
      const validRoles = ["admin", "doctor", "nurse", "patient"];
      
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const devUsers: Record<string, any> = {
        admin: {
          id: "dev-admin",
          email: "admin@dev.local",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        },
        doctor: {
          id: "dev-doctor",
          email: "doctor@dev.local",
          firstName: "Dr. Ramesh",
          lastName: "Sharma",
          role: "doctor",
        },
        nurse: {
          id: "dev-nurse",
          email: "nurse@dev.local",
          firstName: "Sita",
          lastName: "Thapa",
          role: "nurse",
        },
        patient: {
          id: "dev-patient",
          email: "patient@dev.local",
          firstName: "Amit",
          lastName: "Gurung",
          role: "patient",
        },
      };

      const devUser = devUsers[role];
      
      const user = await storage.upsertUser(devUser);
      
      if (role === "patient") {
        const existingPatient = await storage.getPatientByUserId(user.id);
        if (!existingPatient) {
          await storage.createPatient({
            userId: user.id,
            dateOfBirth: "2008-05-15",
            gender: "male",
            bloodGroup: "A+",
            address: "Kathmandu, Nepal",
            guardianName: "Parent Guardian",
            guardianPhone: "9841234567",
            guardianRelation: "Father",
            emergencyContact: "9841234568",
            allergies: "None",
          });
        }
      }

      req.login(
        { ...user, claims: { sub: user.id } } as Express.User,
        (err) => {
          if (err) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.redirect("/");
        }
      );
    });

    app.get("/api/callback", (_req, res) => {
      res.redirect("/");
    });

    app.get("/api/logout", (req, res) => {
      req.logout(() => {
        res.redirect("/");
      });
    });

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((user: Express.User, done) => done(null, user));

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
