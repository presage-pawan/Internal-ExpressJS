import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { GUIDE_CATEGORIES } from './knowledge-base.model.js';
import { createGuidePublisherMiddleware, requireGuidePermission } from './knowledge-base.permissions.js';
import { KnowledgeBaseService, MAX_GUIDE_PDF_SIZE, resolveGuidePdf } from './knowledge-base.service.js';

const multipart = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: MAX_GUIDE_PDF_SIZE, fields: 6, fieldSize: 2048 }
}).single('file');

const upload = (req, res, next) => multipart(req, res, error => {
  if (error instanceof multer.MulterError) {
    next(Object.assign(new Error(error.code === 'LIMIT_FILE_SIZE'
      ? 'Select a valid PDF of up to 20 MB.'
      : 'Upload one PDF with valid guide details.'), { status: 400 }));
    return;
  }
  next(error);
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 75,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: false, message: 'Too many upload requests. please try after some time.' }
});

export default ({
  service = new KnowledgeBaseService(),
  roleMenuServiceFactory
} = {}) => {
  const router = Router();
  router.use(createGuidePublisherMiddleware(roleMenuServiceFactory), requireGuidePermission('view'));

  router.get('/guides', async (req, res, next) => {
    try {
      res.setHeader('Cache-Control', 'private, no-store');
      res.json({
        status: true,
        data: {
          guides: await service.list(),
          categories: GUIDE_CATEGORIES,
          permissions: req.guidePublisher.permissions
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/guides/:id/file', async (req, res, next) => {
    try {
      const guide = await service.find(String(req.params.id));
      const file = await resolveGuidePdf(guide.fileName);
      res.type('application/pdf');
      res.setHeader('Cache-Control', 'private, no-store');
      res.sendFile(file, error => { if (error) next(error); });
    } catch (error) {
      next(error);
    }
  });

  router.post('/guides', requireGuidePermission('add'), uploadLimiter, upload, async (req, res, next) => {
    try {
      const guide = await service.create(req.body || {}, req.file, req.guidePublisher.id);
      res.status(201).json({ status: true, data: guide });
    } catch (error) {
      next(error);
    }
  });

  router.put('/guides/:id', requireGuidePermission('edit'), uploadLimiter, upload, async (req, res, next) => {
    try {
      const guide = await service.update(String(req.params.id), req.body || {}, req.file, req.guidePublisher.id);
      res.json({ status: true, data: guide });
    } catch (error) {
      next(error);
    }
  });

  router.patch('/guides/:id/visibility', requireGuidePermission('edit'), async (req, res, next) => {
    try {
      const guide = await service.visibility(String(req.params.id), req.body || {}, req.guidePublisher.id);
      res.json({ status: true, data: guide });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/guides/:id', requireGuidePermission('delete'), async (req, res, next) => {
    try {
      await service.remove(String(req.params.id), req.body || {});
      res.json({ status: true, message: 'Guide deleted.' });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
