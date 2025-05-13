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
    console.log("=== PASSWORD VERIFICATION DETAILS ===");
    console.log(`Supplied password length: ${supplied ? supplied.length : 0}`);
    console.log(`Stored password length: ${stored ? stored.length : 0}`);
    
    if (!supplied || !stored) {
      console.log("Password comparison failed: empty password provided");
      console.log(`Supplied: ${supplied ? 'provided' : 'empty'}, Stored: ${stored ? 'exists' : 'empty'}`);
      return false;
    }
    
    // Check if stored password is in the expected format (has a salt)
    if (!stored.includes('.')) {
      console.log("Password in legacy format (no salt), performing direct comparison");
      console.log(`Direct comparison result: ${supplied === stored ? 'matched' : 'not matched'}`);
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
    
    console.log(`Secure comparison using salt: ${salt}`);
    console.log(`Stored hash: ${hashed.substring(0, 20)}...`);
    
    const hashedBuf = Buffer.from(hashed, "hex");
    console.log(`Generating hash for supplied password with salt: ${salt}`);
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const suppliedHash = suppliedBuf.toString("hex");
    console.log(`Generated hash: ${suppliedHash.substring(0, 20)}...`);
    
    if (hashedBuf.length !== suppliedBuf.length) {
      console.log(`Buffer length mismatch: stored=${hashedBuf.length}, supplied=${suppliedBuf.length}`);
      return false;
    }
    
    const isEqual = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`Secure comparison result: ${isEqual ? 'matched' : 'not matched'}`);
    
    // Extra debug - direct string comparison of hashes
    console.log(`Direct hash string comparison: ${hashed === suppliedHash ? 'matched' : 'not matched'}`);
    
    return isEqual;
  } catch (error) {
    console.error("Error during password comparison:", error);
    return false;
  }
}