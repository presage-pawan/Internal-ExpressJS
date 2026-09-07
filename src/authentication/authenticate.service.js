import { randomInt } from 'crypto';
import { JwtService } from '../utils/jwt.service.js';
import { PasswordService } from '../utils/bcrypt.js';
import { InternalUserModel } from '../schemas/users.model.js';
import { PasswordResetOtpModel } from '../schemas/password-reset-otp.model.js';
import { createAccessToken, deleteAccessTokenByToken, deleteAccessTokenByUserId } from '../schemas/accessToken.model.js';
import { CONFIG_DETAILS } from '../configDB.js';
import { getConnection } from '../_db/index.js';
import { RoleMenuService } from '../internal/role-menu/role-menu.service.js';
import { sendPasswordResetOtpEmail } from '../utils/mail.service.js';

const OTP_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const generateOtp = () => String(randomInt(100000, 1000000));

export class AuthenticationService {

  constructor(dbType = 'production') {
    this.dbType = dbType;
  }

  get connection() {
    return getConnection(this.dbType, 'website');
  }

  get UserModel() {
    return InternalUserModel(this.connection);
  }

  get PasswordResetOtpModel() {
    return PasswordResetOtpModel(this.connection);
  }

  get RoleMenuService() {
    return new RoleMenuService(this.connection);
  }

  async login({ username, password }) {
    if (!username || !password) {
      throw Object.assign(new Error('Username and password are required'), { status: 400 });
    }
    const user = await this.UserModel.findOne({
      username,
      user_status: 'active',
      visible: { $ne: false }
    }).select('+password').exec();
    const isValidPassword = user ? await PasswordService.compare(password, user.password) : false;
    if (!user || !isValidPassword) {
      throw Object.assign(new Error('Invalid username or password'), { status: 401 });
    }
    var roleMenu = await this.RoleMenuService.getRoles({ roleName: user.user_role, userId: user._id, visible: true });
    if (!roleMenu.length) {
      roleMenu = [await this.RoleMenuService.createRole(user.user_role, user._id)];
    }
    const token = JwtService.sign({
      userId: user._id,
      username: user.username,
      role: user.user_role
    });
    await createAccessToken({
      _id: token,
      ttl: CONFIG_DETAILS.authExpiresIn,
      created: new Date(),
      userId: user._id
    }, this.connection);
    const safeUser = user.toObject();
    safeUser.id = user._id || user.id;
    delete safeUser.password;
    return { token, userId: user._id, userDetails: safeUser, roleMenu: roleMenu[0].roleMenu };
  }

  async requestPasswordReset({ email }) {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.UserModel
      .findOne({ email: normalizedEmail, visible: { $ne: false }, user_status: 'active' })
      .select('_id firstName lastName email username')
      .exec();
    if (!user) {
      throw Object.assign(new Error('Registered email not found'), { status: 400 });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await this.PasswordResetOtpModel.updateMany(
      { email: normalizedEmail, used: false },
      { $set: { used: true, usedAt: new Date() } }
    );

    const record = await this.PasswordResetOtpModel.create({
      email: normalizedEmail,
      userId: user._id,
      otpHash: await PasswordService.hash(otp),
      expiresAt
    });

    try {
      await sendPasswordResetOtpEmail({
        to: normalizedEmail,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username,
        otp
      });
    } catch (err) {
      await this.PasswordResetOtpModel.findByIdAndUpdate(record._id, { used: true, usedAt: new Date() });
      throw err;
    }

    return { email: normalizedEmail, expiresAt };
  }

  async verifyPasswordResetOtp({ email, otp }) {
    const record = await this.assertPasswordResetOtp(email, otp);
    if (!record.verifiedAt) {
      record.verifiedAt = new Date();
      await record.save();
    }
    return { email: record.email, expiresAt: record.expiresAt };
  }

  async resetPassword({ email, otp, password }) {
    if (!PasswordService.validateStrength(password)) {
      throw Object.assign(new Error('Password must be at least 8 characters and include uppercase, lowercase and number'), { status: 400 });
    }
    const record = await this.assertPasswordResetOtp(email, otp);
    const hashedPassword = await PasswordService.hash(password);
    const user = await this.UserModel.findByIdAndUpdate(
      record.userId,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 400 });
    }

    record.used = true;
    record.usedAt = new Date();
    await record.save();
    await deleteAccessTokenByUserId(record.userId, this.connection);

    return { email: record.email };
  }

  async assertPasswordResetOtp(email, otp) {
    const normalizedEmail = normalizeEmail(email);
    const record = await this.PasswordResetOtpModel
      .findOne({ email: normalizedEmail, used: false, expiresAt: { $gt: new Date() } })
      .select('+otpHash')
      .sort({ createdAt: -1 })
      .exec();
    if (!record) {
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }

    const isValidOtp = await PasswordService.compare(String(otp || '').trim(), record.otpHash);
    if (!isValidOtp) {
      record.attempts += 1;
      await record.save();
      throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
    }
    return record;
  }

  async logout(token, userId) {
    const [accessToken, user] = await Promise.all([
      deleteAccessTokenByToken(token, this.connection),
      deleteAccessTokenByUserId(userId, this.connection)
    ]);
    console.log({ accessToken, user });
    return { success: true };
  }
}
