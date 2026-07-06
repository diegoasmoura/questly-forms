import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex") 
  : Buffer.from("62828b49520a02db88e36e147171e54c8651c6b3ef9fb11a7ad7b822d51b32d2", "hex");
const IV_LENGTH = 16;

// Criptografia não-determinística (para anotações clínicas)
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText) return null;
  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) return encryptedText;
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return encryptedText;
  }
}

// Criptografia determinística (para CPF devido ao Unique Constraint no DB)
export function encryptDeterministic(text) {
  if (!text) return null;
  const iv = KEY.slice(0, IV_LENGTH); 
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

export function decryptDeterministic(encryptedText) {
  if (!encryptedText) return null;
  try {
    const iv = KEY.slice(0, IV_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (e) {
    return encryptedText;
  }
}
