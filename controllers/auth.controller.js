
import dotenv from 'dotenv';
dotenv.config();
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadToPinata } from "../utils/pinata.js";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../utils/sendEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export const register = async (req, res) => {
  try {
    const { name, email, password, accountType, state, lga } = req.body;

    // Validate input
    if (!name || !email || !password || !accountType || !state || !lga) {
      return res
        .status(400)
        .json({ message: "All fields (name, email, password, accountType, state, lga) are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle optional logo (for organisation/government)
    let logo = null;
    if (
      (accountType === "organisation" || accountType === "government") &&
      req.file
    ) {
      logo = await uploadToPinata(req.file);
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: tokenExpiry,
      accountType: accountType || "individual",
      state,
      lga,
      logo,
      suspended: false,
      verified: false,
    });

    // Create JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verifyLink = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    // ✅ Send Welcome Email to User
    try {
      await sendEmail({
        to: email,
        subject: '🎉 Welcome to the NIHI Platform!',
        html: `
       <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #2e7d32;">Hi ${name},</h2>

  <p style="font-size: 16px;">
    Welcome to <strong>NIHI</strong>! We're thrilled to have you join our community.
  </p>

  <p style="font-size: 15px;">
    To complete your registration, please verify your email address by clicking the link below:
  </p>

  <p style="text-align: center; margin: 20px 0;">
    <a href="${verifyLink}" target="_blank" style="background-color: #2e7d32; color: #fff; margin: 12px 0px; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Verify My Email
    </a>
    <a href="${verifyLink}" target="_blank" style="background-color: #2e7d32; color: #fff; margin: 18px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      ${process.env.FRONTEND_URL}/verify/${verificationToken}
    </a>
  </p>

  <p style="font-size: 14px; color: #555;">
    This link will expire in 1 hour. If it does, you can request a new verification email from your dashboard.
  </p>

  <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 5px solid #64b5f6;">
    <p style="margin: 0; font-size: 14px;">
      Need help getting started? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
    </p>
  </div>

  <p style="margin-top: 30px; font-size: 14px; color: #777;">
    Best regards,<br><strong>The NIHI Team</strong>
  </p>
</div>
      `
      });
    } catch (error) {
      console.log("email failed to send")
    }

    try {
      await sendEmail({
        to: "contact.nihi@gmail.com",
        subject: 'New User Registration on NIHI',
        html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #0a6ae8;">New User Registered</h2>

          <p style="font-size: 15px;">
            A new user has successfully registered on the NIHI platform. Below are the details:
          </p>

          <ul style="font-size: 15px; line-height: 1.6;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Account Type:</strong> ${accountType}</li>
            <li><strong>State:</strong> ${state}</li>
            <li><strong>LGA:</strong> ${lga}</li>
          </ul>

          <p style="font-size: 15px;">
            Please review and take any necessary follow-up actions.
          </p>

          <p style="margin-top: 30px; font-size: 14px; color: #777;">
            Regards,<br><strong>NIHI Registration System</strong>
          </p>
        </div>
      `
      });
    } catch (error) {
      console.log("email failed to send")
    }

    // ✅ Send Response
    res.status(201).json({
      message: "Registeration successfully, please Check your email for verification link",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        logo: user.logo,
        state: user.state,
        lga: user.lga,
        suspended: user.suspended,
        verified: user.verified
      },
    });

    console.log("✅ New user registered:", user.email);
  } catch (err) {
    console.error("❌ Registration Error:", err);
    res.status(500).json({ message: err.message });
  }
};
// };

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      verificationToken: token,
      // verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Server error during verification." });
  }
};


export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials or user does not exist" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password credentials" });

    if (!user.emailVerified) {
      return res.status(401).json({ message: "Please check your mail and verify your email before logging in." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      logo: user.logo,
      state: user.state,
      lga: user.lga,
      suspended: user.suspended,
      verified: user.verified
    };

    res.json({ user: userData, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("the email of the user:"+ email )

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
    await user.save();

    // Construct verification URL
    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #2e7d32;">Email Verification Request</h2>

  <p style="font-size: 16px;">
    Hello <strong>${user.name || "User"}</strong>,
  </p>

  <p style="font-size: 15px;">
    As requested, here is your new email verification link. Please click the button below to confirm your email address and activate your NIHI account:
  </p>

  <p style="text-align: center; margin: 20px 0;">
    <a href="${verifyUrl}" target="_blank" style="background-color: #2e7d32; color: #fff; margin: 12px 0px; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Verify My Email
    </a>
    <a href="${verifyUrl}" target="_blank" style="background-color: #2e7d32; color: #fff; margin: 18px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      ${verifyUrl}
    </a>
  </p>

  <p style="font-size: 14px; color: #555;">
    This link will expire in 1 hour. If it does, you can request another verification email from your dashboard.
  </p>

  <div style="margin: 20px 0; padding: 15px; background-color: #e3f2fd; border-left: 5px solid #64b5f6;">
    <p style="margin: 0; font-size: 14px;">
      Need help? Reach out to us anytime at <a href="mailto:info@needithaveit.org">info@needithaveit.org</a>.
    </p>
  </div>

  <p style="margin-top: 30px; font-size: 14px; color: #777;">
    Thank you for choosing NIHI,<br><strong>The NIHI Team</strong>
  </p>
</div>
    `;

    // Send the email
    await sendEmail({
      to: user.email,
      subject: "Resend Email Verification",
      html: message,
    });

    return res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox or spam.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    res.status(500).json({
      message: "An error occurred while resending the verification email.",
    });
  }
};


export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: '🔐 Reset Your NIHI Password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #d32f2f;">Password Reset Request</h2>
          <p>Hello <strong>${user.name || 'User'}</strong>,</p>
          <p>We received a request to reset your NIHI account password. Click the button below or copy link to proceed:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #d32f2f; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Reset My Password
            </a>
            <a href="${resetLink}" target="_blank"  color: #323232ff; padding: 24px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              ${resetLink}
            </a>
          </p>
          <p>This link will expire in 1 hour. If you didn’t request this, you can safely ignore this email.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #777;">Best regards,<br><strong>The NIHI Team</strong></p>
        </div>
      `,
    });

    res.status(200).json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};



export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  console.log(password + "tokken:" +token )

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const user = await User.findOne({
      // resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


export const googleSignInController = async (req, res) => {
  try {
    const { token } = req.body; // frontend sends { token: idToken }
    console
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    const hashedPassword = await bcrypt.hash("123456", 10);
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user if none found
      user = await User.create({
        accountType: "individual",
        password: hashedPassword,
        email,
        name,
        logo: picture,
        Verified: false,
        suspended: false,
      });
    }

    // Generate JWT
    const authToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        logo: user.logo,
        state: user.state,
        lga: user.lga,
        role: user.role,
        suspended: user.suspended,
        verified: user.verified
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid Google token" });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Server error" });
  }
};