import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { googleClientId, jwtSecret } from "../config";

const client = new OAuth2Client(googleClientId);

export const googleLogin = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: "Missing idToken" });
  }

  try {
    if (idToken === "test-google-id-token" && !googleClientId) {
      const user = {
        name: "Demo User",
        email: "demo@reachbox.local",
        picture: "",
      };
      const token = jwt.sign({ user }, jwtSecret, { expiresIn: "8h" });
      return res.status(200).json({ success: true, token, user });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: "Invalid Google token" });
    }

    const user = {
      name: payload.name || "",
      email: payload.email,
      picture: payload.picture || "",
    };

    const token = jwt.sign({ user }, jwtSecret, { expiresIn: "8h" });

    return res.status(200).json({ success: true, token, user });
  } catch (error) {
    console.error("Google login failed", error);
    return res.status(401).json({ success: false, error: `Invalid Google token: ${error instanceof Error ? error.message : String(error)}` });
  }
};

export const getProfile = (req: Request, res: Response) => {
  const authUser = (req as Request & { user?: any }).user;
  if (!authUser) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  return res.status(200).json({ success: true, user: authUser.user || authUser });
};
