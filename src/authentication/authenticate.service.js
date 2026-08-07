import { JwtService } from '../utils/jwt.service.js';
import { PasswordService } from '../utils/bcrypt.js';
import { InternalUserModel } from '../schemas/users.model.js';
import { createAccessToken, deleteAccessTokenByToken, deleteAccessTokenByUserId } from '../schemas/accessToken.model.js';
import { CONFIG_DETAILS } from '../configDB.js';
import { getConnection } from '../_db/index.js';
import { RoleMenuService } from '../internal/role-menu/role-menu.service.js';

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

  get RoleMenuService() {
    return new RoleMenuService(this.connection);
  }

  async login({ username, password }) {
    if (!username || !password) {
      throw Object.assign(new Error('Username and password are required'), { status: 400 });
    }
    const user = await this.UserModel.findOne({ username }).select('+password').exec();
    if (!user || !PasswordService.compare(password, user.password)) {
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

  async logout(token, userId) {
    const [accessToken, user] = await Promise.all([
      deleteAccessTokenByToken(token, this.connection),
      deleteAccessTokenByUserId(userId, this.connection)
    ]);
    console.log({ accessToken, user });
    return { success: true };
  }
}