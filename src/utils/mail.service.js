import { MAIL_DETAILS } from '../configDB.js';

const assertMailConfig = () => {
  const missing = [];
  if (!MAIL_DETAILS.host) missing.push('SMTP_HOST');
  if (!MAIL_DETAILS.user) missing.push('SMTP_USER');
  if (!MAIL_DETAILS.password) missing.push('SMTP_PASSWORD');
  if (!MAIL_DETAILS.from) missing.push('SMTP_FROM');
  if (missing.length) {
    throw Object.assign(new Error(`Mail configuration missing: ${missing.join(', ')}`), { status: 500 });
  }
};

export const sendMail = async ({ to, subject, text, html }) => {
  assertMailConfig();
  let nodemailer;
  try {
    nodemailer = await import('nodemailer');
  } catch (err) {
    throw Object.assign(new Error('nodemailer package is required to send email'), { status: 500 });
  }
  const mailer = nodemailer.default || nodemailer;

  const transporter = mailer.createTransport({
    host: MAIL_DETAILS.host,
    port: MAIL_DETAILS.port,
    secure: MAIL_DETAILS.secure,
    auth: {
      user: MAIL_DETAILS.user,
      pass: MAIL_DETAILS.password
    }
  });

  return transporter.sendMail({
    from: MAIL_DETAILS.from,
    to,
    subject,
    text,
    html
  });
};

export const sendPasswordResetOtpEmail = ({ to, name, otp }) => {
  const displayName = name || 'User';
  const text = [
    `Hi ${displayName},`,
    '',
    `Your password reset OTP is ${otp}.`,
    'This OTP is valid for 24 hours.',
    '',
    'If you did not request this, please ignore this email.'
  ].join('\n');

  return sendMail({
    to,
    subject: 'Password reset OTP',
    text,
    html: `
      <p>Hi ${displayName},</p>
      <p>Your password reset OTP is <strong>${otp}</strong>.</p>
      <p>This OTP is valid for 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `
  });
};
