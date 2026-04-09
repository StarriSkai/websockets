import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGODB_URI);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
