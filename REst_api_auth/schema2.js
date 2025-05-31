const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
    },

    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: [true, "Email must be unique!"],
      lowercase: true,
      minLength: [5, "Minimum of 5 characters"],
    },

    password: {
      type: String,
      required: [true, "Password is required!"],
      trim: true,
      select: false, 
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
    },

    resetToken: {
      type: String,
      default: null,
    },

    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const register = mongoose.model("User", userSchema);

module.exports = register;
