// Importação de depêndencias
import mongoose from "mongoose";

export const connect = async () => {
  await mongoose.connect(process.env.MONGO_URL).then(
    () => console.log("MongoDB connected successfully"),
    (err) => console.error("MongoDB connection error:", err),
  );
};
