require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");

const register = require("./REst_api_auth/schema2");

const app = express();

//  CONNECT TO MONGODB
mongoose
  .connect(process.env.CONN_STR)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

//  MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:5173", "https://powerorg.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  VERIFICATION EMAIL SENDER
const sendVerificationEmail = async (email, name, userId) => {
  const verificationToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  const verificationLink = `https://powerorg.netlify.app/verify-email?token=${verificationToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"PowerOrg Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "PowerOrg – Confirm Your Email",
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; padding: 40px; border-radius: 10px; border: 1px solid #eee;">
    <h1 style="text-align: center; color: #41CA1A; margin-bottom: 0;">
      <span style="color: #41CA1A;">Power</span><span style="color: #FFA500;">Org</span>
    </h1>

    <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>

    <p style="font-size: 16px; color: #333;">
      Thank you for signing up. Please confirm your email by clicking the button below:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="background-color: #32CD32; color: white; padding: 12px 24px; font-size: 16px; text-decoration: none; font-weight: bold; border-radius: 6px;">
        Verify My Email
      </a>
    </div>

    <p style="font-size: 14px; color: #555;">
      If you didn't sign up, you can safely ignore this email.
    </p>

    <p style="font-size: 14px; color: #555; margin-top: 40px;">
      Warm regards,<br />
      <strong>The PowerOrg Team</strong>
    </p>

    <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;" />

    <p style="font-size: 12px; color: #888;">
      This link will expire in 24 hours. If the button doesn’t work, copy and paste this URL into your browser:
    </p>

    <p style="font-size: 12px; word-break: break-all;">
      <a href="${verificationLink}" style="color: #1a0dab;">${verificationLink}</a>
    </p>
  </div>
`,
    attachments: [
      {
        filename: "PowerOrgLogo.png",
        path: "./PowerOrgLogo.png",
        cid: "powerorglogo",
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

//  SIGN UP
app.post("/SignUp", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, and a number.",
      });
    }

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password required!" });
    }

    const existingUser = await register.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new register({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });
    await user.save();

    res
      .status(201)
      .json({ message: "User created. Verification email is being sent." });

    sendVerificationEmail(email, name, user._id).catch((err) =>
      console.error("Email sending failed:", err)
    );
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

//  EMAIL VERIFICATION
app.get("/verify-email", async (req, res) => {
  const token = req.query.token;
  if (!token)
    return res.status(400).json({ message: "Verification token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await register.findByIdAndUpdate(
      decoded.userId,
      { isVerified: true, emailVerifiedAt: new Date() },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res
      .status(200)
      .json({ status: "success", message: "Email verified successfully!" });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

//  RESEND VERIFICATION
app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  const user = await register.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.isVerified)
    return res.status(400).json({ message: "Email already verified" });

  try {
    await sendVerificationEmail(email, user._id);
    res.json({ message: "Verification email resent" });
  } catch (err) {
    console.error("Email resend error:", err);
    res.status(500).json({ message: "Failed to resend verification email" });
  }
});

//  SIGN IN
app.post("/SignIn", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await register.findOne({ email }).select("+password");

  if (!user || !user.password) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: "Please verify your email first" });
  }

  // console.log("Input password:", password);
  // console.log("Stored hash:", user.password);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return res.json({ message: "Sign in successful", token, name: user.name });
});

// ✅ START SERVER
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
