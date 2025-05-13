import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!supplied || !stored) {
      console.log("Password comparison failed: empty password provided");
      return false;
    }
    
    // Check if stored password is in the expected format (has a salt)
    if (!stored.includes('.')) {
      console.log("Password in legacy format (no salt), performing direct comparison");
      // For compatibility with initial setup or unencrypted passwords
      // Simply compare the raw passwords as a fallback
      return supplied === stored;
    }

    // Normal secure comparison with salt
    const parts = stored.split(".");
    if (parts.length !== 2) {
      console.log(`Password in invalid format: expected 2 parts but got ${parts.length}`);
      return false;
    }
    
    const [hashed, salt] = parts;
    
    if (!hashed || !salt) {
      console.log("Password malformed: missing hash or salt component");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    if (hashedBuf.length !== suppliedBuf.length) {
      console.log(`Buffer length mismatch: stored=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error during password comparison:", error);
    return false;
  }
}