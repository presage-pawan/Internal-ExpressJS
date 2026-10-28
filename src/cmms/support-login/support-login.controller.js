import { SupportLoginService } from './support-login.service.js';

export class SupportLoginController {
  constructor() {
    this.service = new SupportLoginService();
  }

  createGrant = async (req, res, next) => {
    try {
      const data = await this.service.createGrant({
        email: req.body?.email,
        companyId: req.body?.company_id,
        actorId: req.user?.id || req.user?._id,
        dbType: req.db_type,
        stateChallenge: req.body?.state_challenge
      });
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  };
}
