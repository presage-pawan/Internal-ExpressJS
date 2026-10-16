import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { getConnection } from '../../_db/index.js';
import { GUIDE_CATEGORIES, KnowledgeBaseGuideModel } from './knowledge-base.model.js';

export const MAX_GUIDE_PDF_SIZE = 20 * 1024 * 1024;
const badRequest = message => Object.assign(new Error(message), { status: 400 });
const unavailable = () => Object.assign(new Error('This guide is unavailable.'), { status: 404 });
const conflict = message => Object.assign(new Error(message), { status: 409 });

const validId = id => {
  if (!/^[a-f0-9]{24}$/i.test(id)) throw unavailable();
  return new Types.ObjectId(id);
};

export const guideFilesDirectory = () => path.resolve(
  process.env.KNOWLEDGE_BASE_FILES_DIR || path.join(process.cwd(), 'knowledge_base')
);

export async function resolveGuidePdf(fileName, root = guideFilesDirectory()) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.pdf$/i.test(fileName)) throw unavailable();
  try {
    const [realRoot, realFile] = await Promise.all([
      fs.realpath(root),
      fs.realpath(path.join(root, fileName))
    ]);
    if (!realFile.startsWith(realRoot + path.sep)) throw unavailable();
    const stats = await fs.stat(realFile);
    if (!stats.isFile()) throw unavailable();
    const file = await fs.open(realFile, 'r');
    try {
      const signature = Buffer.alloc(5);
      await file.read(signature, 0, 5, 0);
      if (signature.toString('ascii') !== '%PDF-') throw unavailable();
    } finally {
      await file.close();
    }
    return realFile;
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error?.code || '')) throw unavailable();
    throw error;
  }
}

export function guideVisibility(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw badRequest('Choose draft or published visibility.');
}

export function guideInput(body) {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const category = typeof body?.category === 'string' ? body.category : '';
  if (!title || title.length > 180) throw badRequest('Enter a title of up to 180 characters.');
  if (description.length > 600) throw badRequest('The description must be 600 characters or fewer.');
  if (!GUIDE_CATEGORIES.some(item => item.id === category)) throw badRequest('Choose a valid guide category.');
  return { title, description, category, published: guideVisibility(body?.published ?? false) };
}

function expectedRevision(value) {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) {
    throw badRequest('Reload this guide before saving changes.');
  }
  return new Date(value);
}

export function validateGuidePdf(file) {
  if (!file || !/\.pdf$/i.test(file.originalname) || !file.buffer?.length ||
      file.buffer.length > MAX_GUIDE_PDF_SIZE || file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw badRequest('Select a valid PDF of up to 20 MB.');
  }
  return file;
}

async function storePdf(file) {
  const root = guideFilesDirectory();
  await fs.mkdir(root, { recursive: true });
  const fileName = `${randomUUID()}.pdf`;
  await fs.writeFile(path.join(root, fileName), file.buffer, { flag: 'wx' });
  return fileName;
}

async function removePdf(fileName) {
  try {
    await fs.unlink(await resolveGuidePdf(fileName));
  } catch (error) {
    if (error?.status !== 404) console.warn('Could not remove an unused knowledge-base PDF:', fileName);
  }
}

export function publisherGuide(guide) {
  return {
    id: String(guide._id),
    title: guide.title,
    description: guide.description,
    category: guide.category,
    size: guide.size,
    published: guide.published,
    createdAt: guide.createdAt,
    updatedAt: guide.updatedAt
  };
}

export class KnowledgeBaseService {
  constructor({ model, connection } = {}) {
    this.modelOverride = model;
    this.connectionOverride = connection;
  }

  get Model() {
    const connection = this.connectionOverride || getConnection('production', 'cmms');
    return this.modelOverride || KnowledgeBaseGuideModel(connection);
  }

  async list() {
    const guides = await this.Model.find({}).sort({ updatedAt: -1 }).lean().exec();
    return guides.map(publisherGuide);
  }

  async find(id) {
    const guide = await this.Model.findById(validId(id)).lean().exec();
    if (!guide) throw unavailable();
    return guide;
  }

  async create(body, file, publisherId) {
    const values = guideInput(body);
    const pdf = validateGuidePdf(file);
    const fileName = await storePdf(pdf);
    try {
      const guide = await this.Model.create({
        ...values,
        fileName,
        size: pdf.buffer.length,
        createdByInternalUser: publisherId,
        updatedByInternalUser: publisherId
      });
      return publisherGuide(guide);
    } catch (error) {
      await removePdf(fileName);
      throw error;
    }
  }

  async update(id, body, file, publisherId) {
    const values = guideInput(body);
    const revision = expectedRevision(body?.updatedAt);
    const current = await this.find(id);
    const pdf = file ? validateGuidePdf(file) : undefined;
    if (values.published && !pdf) await resolveGuidePdf(current.fileName);
    const fileName = pdf ? await storePdf(pdf) : undefined;
    let guide;
    try {
      guide = await this.Model.findOneAndUpdate({ _id: validId(id), updatedAt: revision }, {
        $set: {
          ...values,
          updatedByInternalUser: publisherId,
          ...(pdf ? { fileName, size: pdf.buffer.length } : {})
        }
      }, { returnDocument: 'after', runValidators: true }).lean().exec();
      if (!guide) throw conflict('This guide changed. Reload it before saving.');
    } catch (error) {
      if (fileName) await removePdf(fileName);
      throw error;
    }
    if (fileName) await removePdf(current.fileName);
    return publisherGuide(guide);
  }

  async visibility(id, body, publisherId) {
    const published = guideVisibility(body?.published);
    const revision = expectedRevision(body?.updatedAt);
    const current = await this.find(id);
    if (published) await resolveGuidePdf(current.fileName);
    const guide = await this.Model.findOneAndUpdate({ _id: validId(id), updatedAt: revision }, {
      $set: { published, updatedByInternalUser: publisherId }
    }, { returnDocument: 'after', runValidators: true }).lean().exec();
    if (!guide) throw conflict('This guide changed. Reload it before saving.');
    return publisherGuide(guide);
  }

  async remove(id, body) {
    const revision = expectedRevision(body?.updatedAt);
    await this.find(id);
    const guide = await this.Model.findOneAndDelete({ _id: validId(id), updatedAt: revision }).lean().exec();
    if (!guide) throw conflict('This guide changed. Reload it before deleting.');
    await removePdf(guide.fileName);
  }
}
