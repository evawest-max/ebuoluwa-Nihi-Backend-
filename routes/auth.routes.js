import express from "express";
import { register, login, getCurrentUser, googleSignInController, verifyEmail, resendVerificationEmail, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { uploadID } from "../middleware/upload.middleware.js";
import { auth } from "../middleware/auth.middleware.js";
import passport from "passport";
const router = express.Router();

router.post("/register", uploadID.single("logo"), register);
router.post("/login", login);
router.post("/me", auth, getCurrentUser)
router.post("/google-signin", googleSignInController);
router.get("/verify/:token", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Start Google Auth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const user = req.user;

    // Generate JWT token for your app
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login/success?token=${token}`);
  }
);

export default router;
