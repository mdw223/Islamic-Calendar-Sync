import nodemailer from "nodemailer";
import sanitize from "sanitize-html";
import { contactConfig, smtpConfig } from "../Config.js";
import { defaultLogger } from "../middleware/Logger.js";

const plainTextSanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: "discard",
};

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: smtpConfig.HOST,
    port: smtpConfig.PORT,
    secure: smtpConfig.SECURE,
    auth: {
      user: smtpConfig.USER,
      pass: smtpConfig.PASS,
    },
  });

  return transporter;
}

function toPlainText(value) {
  return sanitize(String(value ?? ""), plainTextSanitizeOptions).trim();
}

function toHtmlText(value) {
  return toPlainText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\r?\n/g, "<br/>");
}

async function sendMail(message) {
  const info = await getTransporter().sendMail(message);

  if (Array.isArray(info.rejected) && info.rejected.length > 0) {
    const rejectedErr = new Error("Some recipients were rejected by SMTP server");
    rejectedErr.code = "EENVELOPE";
    rejectedErr.rejected = info.rejected;
    throw rejectedErr;
  }

  return info;
}

export async function verifySmtpConnection() {
  try {
    await getTransporter().verify();
    defaultLogger.info("SMTP transporter verified", {
      context: "smtp",
      host: smtpConfig.HOST,
      port: smtpConfig.PORT,
      secure: smtpConfig.SECURE,
    });
    return true;
  } catch (error) {
    defaultLogger.warn("SMTP verification failed", {
      context: "smtp",
      host: smtpConfig.HOST,
      port: smtpConfig.PORT,
      secure: smtpConfig.SECURE,
      error: {
        message: error?.message,
        code: error?.code,
      },
    });
    return false;
  }
}

export async function sendMagicLinkEmail({ toEmail, magicLink }) {
  return sendMail({
    from: smtpConfig.FROM,
    to: toEmail,
    subject: "Sign in to Islamic Calendar Sync",
    text: `Hello!\n\nUse this link to sign in to Islamic Calendar Sync:\n${magicLink}\n\nThis link expires in 10 minutes.`,
    html: `
      <h3>Hello!</h3>
      <p>Click the link below to sign in to Islamic Calendar Sync:</p>
      <p><a href="${toHtmlText(magicLink)}">Sign In</a></p>
      <p>This link expires in 10 minutes.</p>
    `,
  });
}

export async function sendContactEmail({ name, email, subject, message }) {
  const safeName = toPlainText(name);
  const safeEmail = toPlainText(email);
  const safeSubject = toPlainText(subject || "Contact Form Submission");
  const safeMessage = toPlainText(message);

  return sendMail({
    from: smtpConfig.FROM,
    to: contactConfig.TO_EMAIL,
    replyTo: safeEmail,
    subject: `[Contact] ${safeSubject}`,
    text: `Contact form submission\n\nName: ${safeName}\nEmail: ${safeEmail}\nSubject: ${safeSubject}\n\nMessage:\n${safeMessage}`,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${toHtmlText(safeName)}</p>
      <p><strong>Email:</strong> ${toHtmlText(safeEmail)}</p>
      <p><strong>Subject:</strong> ${toHtmlText(safeSubject)}</p>
      <p><strong>Message:</strong></p>
      <p>${toHtmlText(safeMessage)}</p>
    `,
  });
}
