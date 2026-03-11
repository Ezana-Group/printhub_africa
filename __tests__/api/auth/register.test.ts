/**
 * API route tests: POST /api/auth/register
 * Validates request validation, rate limiting response, and duplicate email handling.
 * @jest-environment node
 */
import { POST } from "@/app/api/auth/register/route";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    verificationToken: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn().mockReturnValue({ ok: true }),
  getRateLimitClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

jest.mock("@/lib/tokens", () => ({
  generateToken: jest.fn().mockReturnValue("mock-token"),
  getVerifyEmailExpiry: jest.fn().mockReturnValue(new Date(Date.now() + 86400000)),
}));

const prisma = require("@/lib/prisma").prisma;
const { rateLimit } = require("@/lib/rate-limit");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ ok: true });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: null,
      passwordHash: "...",
    });
    (prisma.verificationToken.upsert as jest.Mock).mockResolvedValue(undefined);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(jsonRequest({ email: "not-an-email", password: "Pass1!word" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 for weak password (no uppercase)", async () => {
    const res = await POST(
      jsonRequest({ email: "test@example.com", password: "password1!" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 for weak password (no number)", async () => {
    const res = await POST(
      jsonRequest({ email: "test@example.com", password: "Password!" })
    );
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 when email already exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "existing",
      email: "test@example.com",
    });
    const res = await POST(
      jsonRequest({
        email: "test@example.com",
        password: "Pass1!word",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/already exists/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    (rateLimit as jest.Mock).mockReturnValue({ ok: false });
    const res = await POST(
      jsonRequest({
        email: "new@example.com",
        password: "SecurePass1!",
      })
    );
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/too many attempts/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 200 and creates user with valid payload", async () => {
    const res = await POST(
      jsonRequest({
        email: "new@example.com",
        password: "SecurePass1!",
        name: "Test User",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toMatch(/check your email/i);
    expect(data.userId).toBe("user-1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "new@example.com" },
    });
    expect(prisma.user.create).toHaveBeenCalled();
  });
});
