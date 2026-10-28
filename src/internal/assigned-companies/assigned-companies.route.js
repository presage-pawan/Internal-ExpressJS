import express from "express";
import { AssignedCompaniesController } from "./assigned-companies.controller.js";
import { auth } from "../../auth.js";
import { requireInternalAction, requireSelfOrInternalAction } from "../../middlewares/authorization.js";

const router = express.Router();
const controller = new AssignedCompaniesController();

// router.route('/').get().post()

router.get('/:id', auth, requireSelfOrInternalAction('internal.assignments.manage'), controller.getByUserId);
router.post('/', auth, requireInternalAction('internal.assignments.manage'), controller.AssignedCompaniesByUserId);

export default router;