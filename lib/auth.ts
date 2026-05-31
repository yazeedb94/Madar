import bcrypt from 'bcryptjs';

/**
 * Hash a plaintext password using bcrypt.
 * @param plain - Plaintext password
 * @returns Hashed password string
 */
export const hashPassword = async (plain: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(plain, saltRounds);
};

/**
 * Compare a plaintext password with a bcrypt hash.
 * @param plain - Plaintext password provided by user
 * @param hash - Stored bcrypt hash
 * @returns true if they match, false otherwise
 */
export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(plain, hash);
};
