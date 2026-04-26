import { jest } from "@jest/globals";

describe("SmtpMailer", () => {
  let mockSendMail;
  let mockVerify;
  let sendMagicLinkEmail;
  let sendContactEmail;
  let verifySmtpConnection;

  beforeEach(async () => {
    jest.resetModules();

    process.env.SMTP_HOST = "smtp.purelymail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_SECURE = "true";
    process.env.SMTP_USER = "smtp-user";
    process.env.SMTP_PASS = "smtp-pass";
    process.env.SMTP_FROM = "noreply@example.com";
    process.env.CONTACT_TO_EMAIL = "contact@example.com";

    mockSendMail = jest.fn().mockResolvedValue({
      messageId: "test-message-id",
      rejected: [],
    });
    mockVerify = jest.fn().mockResolvedValue(true);

    jest.unstable_mockModule("nodemailer", () => ({
      default: {
        createTransport: jest.fn(() => ({
          sendMail: mockSendMail,
          verify: mockVerify,
        })),
      },
    }));

    jest.unstable_mockModule("../middleware/Logger.js", () => ({
      defaultLogger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    }));

    const mod = await import("./SmtpMailer.js");
    sendMagicLinkEmail = mod.sendMagicLinkEmail;
    sendContactEmail = mod.sendContactEmail;
    verifySmtpConnection = mod.verifySmtpConnection;
  });

  test("sendMagicLinkEmail sends expected SMTP payload", async () => {
    const link = "https://example.com/api/auth/magiclink/verify?token=abc";
    await sendMagicLinkEmail({
      toEmail: "user@example.com",
      magicLink: link,
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const payload = mockSendMail.mock.calls[0][0];
    expect(payload.from).toBe("noreply@example.com");
    expect(payload.to).toBe("user@example.com");
    expect(payload.subject).toBe("Sign in to Islamic Calendar Sync");
    expect(payload.text).toContain(link);
    expect(payload.html).toContain("Sign In");
  });

  test("sendContactEmail sanitizes and escapes user input", async () => {
    await sendContactEmail({
      name: "<b>Malik</b>",
      email: "User@Example.com",
      subject: `<script>alert("x")</script>Need Help`,
      message: `<img src=x onerror=alert(1)>Hello <b>team</b>`,
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const payload = mockSendMail.mock.calls[0][0];
    expect(payload.to).toBe("contact@example.com");
    expect(payload.replyTo).toBe("User@Example.com");
    expect(payload.subject).toContain("Need Help");
    expect(payload.subject).not.toContain("<script>");
    expect(payload.html).not.toContain("<script>");
    expect(payload.html).not.toContain("onerror");
  });

  test("verifySmtpConnection returns false when verify fails", async () => {
    mockVerify.mockRejectedValueOnce(new Error("SMTP offline"));
    const result = await verifySmtpConnection();
    expect(result).toBe(false);
  });
});
