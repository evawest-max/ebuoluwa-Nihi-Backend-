import dotenv from "dotenv";
dotenv.config();
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("Missing ENCRYPTION_KEY in environment variables");
}

const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", 32); // 32 bytes key
const IV_LENGTH = 16;

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted; // store iv with encrypted text
};

export const decrypt = (data) => {
  const [ivHex, encrypted] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
