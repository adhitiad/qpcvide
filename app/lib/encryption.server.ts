import crypto from "crypto";

// Gunakan SESSION_SECRET sebagai kunci enkripsi, pastikan panjangnya 32 karakter (256 bits)
const getEncryptionKey = () => {
  const secret = process.env.SESSION_SECRET || "default_fallback_secret_for_dev!";
  return Buffer.from(secret.padEnd(32, "0").slice(0, 32));
};

const IV_LENGTH = 16;

export function encryptSetting(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", getEncryptionKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption failed:", error);
    return text;
  }
}

export function decryptSetting(text: string): string {
  if (!text || !text.includes(":")) return text;
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", getEncryptionKey(), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed:", error);
    return text; // Return as-is if it wasn't successfully decrypted
  }
}
