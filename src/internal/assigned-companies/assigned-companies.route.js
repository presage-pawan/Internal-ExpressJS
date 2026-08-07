import express from "express";
import { AssignedCompaniesController } from "./assigned-companies.controller.js";
import { auth } from "../../auth.js";

const router = express.Router();
const controller = new AssignedCompaniesController();

// router.route('/').get().post()

router.get('/:id', auth, controller.getByUserId);
router.post('/', auth, controller.AssignedCompaniesByUserId);

export default router;