import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { hashPassword, comparePassword } from "./password";
import { storage as storageInstance } from "./storage";
import type { InsertAuditLog } from "@shared/schema";
import { hybridMatch, type PatientCandidate } from "./ai-matching";

const PgStore = connectPg(session);

/** Fire-and-forget audit log — never crashes the request */
async function logAudit(data: InsertAuditLog): Promise<void> {
  try {
    await storageInstance.createAuditLog(data);
  } catch (err) {
    console.error("Audit log failed (non-fatal):", err);
  }
}

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
    createTableIfMissing: true,
    tableName: "sessions",
  });
  return session({
    secret:
      process.env.SESSION_SECRET ||
      require("crypto").randomBytes(32).toString("hex"),
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

/** Seed default users with passwords if they don't exist yet */
async function seedDefaultUsers(storage: any) {
  const defaultUsers = [
    {
      id: "dev-admin",
      email: "admin@medrecord.com",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      password: "admin123",
    },
    {
      id: "dev-doctor",
      email: "doctor@medrecord.com",
      firstName: "Dr. Ramesh",
      lastName: "Sharma",
      role: "doctor",
      password: "doctor123",
    },
    {
      id: "dev-nurse",
      email: "nurse@medrecord.com",
      firstName: "Sita",
      lastName: "Thapa",
      role: "nurse",
      password: "nurse123",
    },
    {
      id: "dev-patient",
      email: "patient@medrecord.com",
      firstName: "Amit",
      lastName: "Gurung",
      role: "patient",
      password: "patient123",
    },
  ];

  for (const u of defaultUsers) {
    const existing = await storage.getUser(u.id);
    if (!existing) {
      // User doesn't exist — create from scratch
      const hashed = await hashPassword(u.password);
      await storage.createUser({ ...u, password: hashed });
      console.log(`Seeded user: ${u.email} (${u.role})`);
    } else if (!existing.password) {
      // User exists but has no password — update their password and email
      const hashed = await hashPassword(u.password);
      await storage.updateUserCredentials(u.id, {
        email: u.email,
        password: hashed,
      });
      console.log(`Updated credentials for existing user: ${u.email} (${u.role})`);
    }

    // Ensure patient record exists for patient role users
    if (u.role === "patient") {
      const existingPatient = await storage.getPatientByUserId(u.id);
      if (!existingPatient) {
        await storage.createPatient({
          userId: u.id,
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
  }
}

export async function setupAuth(app: Express, storage: any) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  // ── Password-based login (works in both dev and production) ──
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.password) {
      return res
        .status(401)
        .json({ message: "This account has no password set. Contact an admin." });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Strip password from session object
    const { password: _pw, ...safeUser } = user;

    req.login(
      { ...safeUser, claims: { sub: user.id } } as Express.User,
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        // Explicitly save session to PG store before responding,
        // so it's definitely persisted when the browser redirects.
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Login failed" });
          }
          logAudit({
            userId: user.id,
            action: "user_login",
            resourceType: "auth",
            ipAddress: req.ip,
            details: { email: user.email, role: user.role },
          });
          res.json(safeUser);
        });
      }
    );
  });

  // ── Self-service registration (new users get "patient" role by default) ──
  app.post("/api/auth/register", async (req, res) => {
    const {
      email,
      password,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      guardianName,
      guardianPhone,
      guardianRelation,
      emergencyContact,
      allergies,
    } = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      address?: string;
      guardianName?: string;
      guardianPhone?: string;
      guardianRelation?: string;
      emergencyContact?: string;
      allergies?: string;
    };

    if (!email || !password || !firstName || !lastName || !dateOfBirth) {
      return res
        .status(400)
        .json({ message: "Email, password, first name, last name, and date of birth are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if email is already taken
    const existing = await storage.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    try {
      const hashed = await hashPassword(password);

      // Create the user account
      const user = await storage.createUser({
        email,
        password: hashed,
        firstName,
        lastName,
        role: "patient",
      });

      // Create the patient profile linked to this user
      const newPatient = await storage.createPatient({
        userId: user.id,
        dateOfBirth,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        address: address || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
        guardianRelation: guardianRelation || null,
        emergencyContact: emergencyContact || null,
        allergies: allergies || null,
      });

      // ── Hybrid AI Record Matching ──
      // Stage 1: fuzzy pre-filter all existing patients
      // Stage 2: LLM verification for top candidates
      try {
        const allPatients = await storage.getAllPatientsWithUserInfo();

        // Build candidate list, excluding the newly created patient
        const candidates: PatientCandidate[] = allPatients
          .filter((p) => p.id !== newPatient.id && p.user)
          .map((p) => ({
            patientId: p.id,
            firstName: p.user!.firstName || "",
            lastName: p.user!.lastName || "",
            dateOfBirth: p.dateOfBirth,
            bloodGroup: p.bloodGroup,
            gender: p.gender,
            address: p.address,
          }));

        const newCandidate: PatientCandidate = {
          patientId: newPatient.id,
          firstName,
          lastName,
          dateOfBirth,
          bloodGroup: bloodGroup || null,
          gender: gender || null,
          address: address || null,
        };

        const matches = await hybridMatch(newCandidate, candidates);

        for (const match of matches) {
          await storage.createRecordMatchRequest({
            newPatientId: newPatient.id,
            existingPatientId: match.existingPatientId,
            matchConfidence: match.matchConfidence,
            matchedFields: match.matchedFields,
            aiScore: match.aiScore.toFixed(4),
            aiReasoning: match.aiReasoning,
          });
          console.log(
            `[AI Match] new patient #${newPatient.id} → existing #${match.existingPatientId} | ` +
            `fuzzy=${match.fuzzyScore} ai=${match.aiScore.toFixed(2)} (${match.matchConfidence})`,
          );
        }
      } catch (matchErr) {
        // Non-fatal — don't block registration if matching fails
        console.error("AI record matching error (non-fatal):", matchErr);
      }

      const { password: _pw, ...safeUser } = user;

      req.login(
        { ...safeUser, claims: { sub: user.id } } as Express.User,
        (err) => {
          if (err) {
            return res.status(500).json({ message: "Registration succeeded but login failed" });
          }
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ message: "Registration succeeded but login failed" });
            }
            logAudit({
              userId: user.id,
              action: "user_signup",
              resourceType: "auth",
              ipAddress: req.ip,
              details: { email: user.email, firstName, lastName },
            });
            res.status(201).json(safeUser);
          });
        }
      );
    } catch (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.get("/api/logout", (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub ?? user?.id ?? "unknown";
    logAudit({
      userId,
      action: "user_logout",
      resourceType: "auth",
      ipAddress: req.ip,
      details: { email: user?.email, role: user?.role },
    });
    req.logout(() => {
      res.redirect("/");
    });
  });

  // ── Seed default users in dev mode ──
  if (!isReplitAuthAvailable()) {
    console.log("Running in local mode — seeding default users if needed");
    await seedDefaultUsers(storage);
    return;
  }

  // ── Replit OAuth (production) ──
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

  app.get("/api/login", passport.authenticate("replit"));

  app.get(
    "/api/callback",
    passport.authenticate("replit", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })
  );
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Token refresh for Replit OAuth
  if (isReplitAuthAvailable()) {
    const user = req.user!;
    const now = Math.floor(Date.now() / 1000);

    if (user.expires_at && user.expires_at < now + 300) {
      try {
        const config = await getOidcConfig();
        const tokens = await client.refreshTokenGrant(
          config,
          user.refresh_token!
        );
        updateUserSession(user, tokens);
      } catch {
        req.logout(() => {});
        return res.status(401).json({ message: "Session expired" });
      }
    }
  }

  next();
};
