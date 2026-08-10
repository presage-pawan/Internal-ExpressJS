import { AuthenticationService } from './authenticate.service.js';
import { CookiesService } from '../utils/cookies.service.js';

export class AuthenticationController {

  getService = (req) => new AuthenticationService(req.db_type);

  login = async (req, res, next) => {
    try {
      const data = await this.getService(req).login(req.body);
      CookiesService.setAuthTokenCookie(res, data.token);
      res.status(200).json({ status: true, message: 'Logged in successfully', data });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const data = await this.getService(req).requestPasswordReset(req.body);
      res.status(200).json({ status: true, message: 'OTP sent to registered email', data });
    } catch (err) {
      next(err);
    }
  };

  verifyResetOtp = async (req, res, next) => {
    try {
      const data = await this.getService(req).verifyPasswordResetOtp(req.body);
      res.status(200).json({ status: true, message: 'OTP verified successfully', data });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const data = await this.getService(req).resetPassword(req.body);
      res.status(200).json({ status: true, message: 'Password reset successfully', data });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req, res, next) => {
    try {
      await this.getService(req).logout(req.token, req.user._id);
      CookiesService.clearAuthTokenCookie(res);
      res.status(200).json({ status: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };
}
