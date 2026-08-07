import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const getISTDate = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
};

const accessLogStream = {
  write: (message) => {
    const istDate = getISTDate();
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const fileName = `${year}-${month}-internal.log`;
    fs.appendFile(path.join(logDir, fileName), message, (err) => {
      if (err) {
        console.error('Failed to write access log', err);
      }
    });
  }
};

const fileFormat = ':date_ist | :requestId | :status | :method | :userId | :userName | :module | :url | :res[content-length] | :response-time ms | IP: :remote-addr | Device: :device';

const consoleFormat = ':date_ist | :requestId | :status | :userId | :userName | :method | :module | :response-time ms | :url';

morgan.token('requestId', req => req.id || 'unknown');
morgan.token('userId', req => req.user?._id?.toString() || 'Anonymous');
morgan.token('userName', req => req.user?.username || 'Anonymous');

morgan.token('date_ist', () => {
  return getISTDate().toISOString().replace('Z', '+05:30');
});

morgan.token('module', req => {
  const url = req.originalUrl.split('?')[0];
  const segments = url.split('/').filter(Boolean);
  return segments.join('_') || 'general';
});
morgan.token('device', req => req.headers['user-agent'] || 'unknown');

export class Logger {
  static httpLogger = morgan(fileFormat, { stream: accessLogStream });
  static consoleLogger = morgan(consoleFormat);

  static middleware() {
    return (req, res, next) => {
      req.id = req.headers['x-request-id'] || randomUUID();
      res.setHeader('X-Request-ID', req.id);
      Logger.consoleLogger(req, res, () => {});
      Logger.httpLogger(req, res, () => {});
      next();
    };
  }
}
