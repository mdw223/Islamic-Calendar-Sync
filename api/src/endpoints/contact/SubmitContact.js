import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import ContactSubmissionDOA from "../../model/db/doa/ContactSubmissionDOA.js";
import { contactConfig } from "../../Config.js";
import { sendContactEmail } from "../../services/SmtpMailer.js";
import { defaultLogger, extractUserId } from "../../middleware/Logger.js";

const NAME_MAX_LENGTH = 120;
const SUBJECT_MAX_LENGTH = 200;
const MESSAGE_MAX_LENGTH = 5000;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contactIpRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: contactConfig.IP_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: {
    success: false,
    message: "Too many contact requests. Please try again later.",
  },
});

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

function createPublicError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.publicMessage = message;
  return err;
}

export const submitContact = [
  contactIpRateLimiter,
  async (req, res, next) => {
    try {
      const name = normalizeString(req.body?.name);
      const email = normalizeString(req.body?.email);
      const subject = normalizeString(req.body?.subject);
      const message = normalizeString(req.body?.message);
      const normalizedEmail = normalizeEmail(email);

      if (!name || !email || !message) {
        throw createPublicError(400, "Name, email, and message are required.");
      }

      if (!emailRegex.test(normalizedEmail)) {
        throw createPublicError(400, "Please provide a valid email address.");
      }

      if (name.length > NAME_MAX_LENGTH) {
        throw createPublicError(400, `Name must be ${NAME_MAX_LENGTH} characters or fewer.`);
      }

      if (subject.length > SUBJECT_MAX_LENGTH) {
        throw createPublicError(400, `Subject must be ${SUBJECT_MAX_LENGTH} characters or fewer.`);
      }

      if (message.length > MESSAGE_MAX_LENGTH) {
        throw createPublicError(400, `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);
      }

      const reservation = await ContactSubmissionDOA.reserveContactSlot(
        normalizedEmail,
        contactConfig.DAILY_LIMIT_PER_EMAIL,
      );

      if (!reservation.allowed) {
        throw createPublicError(
          429,
          "You have reached the daily contact limit. Please try again tomorrow.",
        );
      }

      await sendContactEmail({
        name,
        email: normalizedEmail,
        subject,
        message,
      });

      return res.status(201).json({
        success: true,
        message: "Your message has been sent successfully.",
      });
    } catch (error) {
      if ((error?.statusCode ?? 500) >= 500) {
        defaultLogger.error("Contact submission failed", {
          context: "contact",
          requestId: req?.requestId,
          userId: extractUserId(req),
          ip: req?.ip,
          userAgent: req?.get?.("user-agent"),
          bodyMeta: {
            hasName: Boolean(req?.body?.name),
            emailDomain: String(req?.body?.email || "").split("@")[1] || null,
            messageLength: String(req?.body?.message || "").length,
          },
          error: {
            message: error?.message,
            code: error?.code,
          },
        });
      }
      return next(error);
    }
  },
];
