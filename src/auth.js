import { JwtService } from "./utils/jwt.service.js";
import { UserService } from "./internal/user/user.service.js";
import { getAccessTokenByToken } from "./schemas/accessToken.model.js";
import { CookiesService } from "./utils/cookies.service.js";
import { getConnection } from "./_db/index.js";

export const auth = async (req, res, next) => {
  try {
    const token = CookiesService.getAuthTokenFromCookie(req) || req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw Object.assign(new Error('No token provided'), { status: 401 });
    }

    // Internal identity is authoritative only in the production website database.
    // CMMS data environment selection happens later in cmmsAuth, after this identity
    // has been authenticated and the requested environment has been authorized.
    const websiteConn = getConnection('production', 'website');
    const accessToken = await getAccessTokenByToken(token, websiteConn);
    if (!accessToken) {
      throw Object.assign(new Error('Invalid token'), { status: 401 });
    }

    const verifyToken = JwtService.verify(token);
    if (!verifyToken || !verifyToken.userId || !verifyToken.username || !verifyToken.role) {
      throw Object.assign(new Error('Invalid token'), { status: 401 });
    }

    const user = await new UserService('production').getAllUsers({
      _id: verifyToken.userId,
      username: verifyToken.username,
      user_role: verifyToken.role,
      user_status: 'active',
      visible: { $ne: false }
    });
    if (!user || user.length === 0) {
      throw Object.assign(new Error('User account is inactive or unavailable'), { status: 401 });
    }

    user[0].id = user[0]._id;
    req.db_type = 'production';
    req.token = token;
    req.user = user[0];
    next();
  } catch (err) {
    next(err);
  }
};
