
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";

const email = "testuser@example.com";
const newPassword = "OwnerTest@2026";

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    console.log("No account found for:", email);
    process.exitCode = 1;
  } else {
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    console.log("Password reset successfully.");
    console.log("Email:", email);
    console.log("New password:", newPassword);
  }
} catch (error) {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
