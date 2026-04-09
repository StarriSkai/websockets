import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();

export async function connectDb() {
  mongoose.set("strictQuery", true);

  if (!MONGODB_URI) {
    console.warn(
      "MONGODB_URI is not set — API runs without MongoDB (set it in Render to enable the database).",
    );
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15_000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed:", err?.message ?? err);
    console.warn(
      "Continuing without MongoDB — fix MONGODB_URI / Atlas network access and redeploy.",
    );
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
