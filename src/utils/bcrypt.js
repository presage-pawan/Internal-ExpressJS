import bcrypt from 'bcryptjs';

export class PasswordService {

  static SALT_ROUNDS = 12;

  static async hash(password) {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(plainPassword, hashedPassword) {
    if (!plainPassword || !hashedPassword) return false;
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static validateStrength(password) {
    if (!password) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  }

  static needsRehash(hashedPassword) {
    if (!hashedPassword) return false;
    const rounds = bcrypt.getRounds(hashedPassword);
    return rounds !== this.SALT_ROUNDS;
  }
}