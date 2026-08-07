import jwt from 'jsonwebtoken';
import { CONFIG_DETAILS } from '../configDB.js';

export class JwtService {
  static get secret() {
    if (!CONFIG_DETAILS.authSecretString) {
      throw new Error('AUTH_SECRET is not configured');
    }
    return CONFIG_DETAILS.authSecretString;
  }

  static get expiresIn() {
    return Number(CONFIG_DETAILS.authExpiresIn) || 60 * 60 * 24 * 3;
  }

  static get algorithm() {
    return CONFIG_DETAILS.authAlgorithm || 'HS256';
  }

  static get issuer() {
    return CONFIG_DETAILS.authIssuer;
  }

  static get audience() {
    return CONFIG_DETAILS.authAudience;
  }

  static sign(payload, options = {}) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      algorithm: this.algorithm,
      issuer: this.issuer,
      audience: this.audience,
      ...options
    });
  }

  static verify(token) {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience
      });
    } catch (err) {
      throw Object.assign(new Error('Invalid or expired token'), { status: 401 });
    }
  }

  static createRefreshTokenPayload(user) {
    return {
      userId: user.id,
      type: 'refresh'
    };
  }
}