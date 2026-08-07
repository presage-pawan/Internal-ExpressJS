import { UserVerificationService } from './user-verification.service.js';

export class UserVerificationController {
    getService = (req) => new UserVerificationService(req.db_type);

    /* ================= GET ALL ================= */
    getAll = async (req, res, next) => {
        try {
            const { page, limit, email } = req.query;
            const filter = {};
            if (email) filter.email = email.toLowerCase();

            const result = await this.getService(req).getAll(filter, { page, limit });
            res.status(200).json({
                status: true,
                message: 'Verification records fetched successfully',
                data: result.data,
                pagination: result.pagination,
            });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET BY ID ================= */
    getById = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).getById(id);
            if (!data) throw Object.assign(new Error('Verification record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Verification record fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= GET BY EMAIL ================= */
    getByEmail = async (req, res, next) => {
        try {
            const { email } = req.params;
            const data = await this.getService(req).getByEmail(email);
            if (!data) throw Object.assign(new Error('Verification record not found for this email'), { status: 404 });
            res.status(200).json({ status: true, message: 'Verification record fetched successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= CREATE ================= */
    create = async (req, res, next) => {
        try {
            const data = await this.getService(req).create(req.body);
            res.status(201).json({ status: true, message: 'Verification code created successfully', data });
        } catch (err) {
            next(err);
        }
    };

    /* ================= VERIFY CODE ================= */
    verify = async (req, res, next) => {
        try {
            const { email, code } = req.body;
            const record = await this.getService(req).verify(email, code);
            if (!record) {
                throw Object.assign(new Error('Invalid or expired verification code'), { status: 400 });
            }
            // Clean up after successful verification
            await this.getService(req).deleteByEmail(email);
            res.status(200).json({ status: true, message: 'Code verified successfully' });
        } catch (err) {
            next(err);
        }
    };

    /* ================= DELETE SINGLE ================= */
    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const data = await this.getService(req).delete(id);
            if (!data) throw Object.assign(new Error('Verification record not found'), { status: 404 });
            res.status(200).json({ status: true, message: 'Verification record deleted successfully' });
        } catch (err) {
            next(err);
        }
    };

    /* ================= DELETE BY EMAIL ================= */
    deleteByEmail = async (req, res, next) => {
        try {
            const { email } = req.params;
            await this.getService(req).deleteByEmail(email);
            res.status(200).json({ status: true, message: 'Verification records deleted for email' });
        } catch (err) {
            next(err);
        }
    };
}

