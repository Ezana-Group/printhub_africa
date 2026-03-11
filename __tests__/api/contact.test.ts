/**
 * API route tests: POST /api/contact
 * @jest-environment node
 */
import { POST } from "@/app/api/contact/route";

jest.mock("@/lib/email", () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock("@/lib/business-public", () => ({
  getBusinessPublic: jest.fn().mockResolvedValue({
    businessName: "PrintHub",
    primaryEmail: "hello@printhub.africa",
    city: "Nairobi",
    country: "Kenya",
  }),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn().mockReturnValue({ ok: true }),
  getRateLimitClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

const { rateLimit } = require("@/lib/rate-limit");

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit as jest.Mock).mockReturnValue({ ok: true });
  });

  it("returns 400 when message is too short", async () => {
    const res = await POST(
      jsonRequest({
        name: "Test User",
        email: "test@example.com",
        subject: "Hello",
        message: "Short",
      }) as Parameters<typeof POST>[0]
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 429 when rate limited", async () => {
    (rateLimit as jest.Mock).mockReturnValue({ ok: false });
    const res = await POST(
      jsonRequest({
        name: "Test User",
        email: "test@example.com",
        subject: "Hello",
        message: "This is a long enough message for the contact form.",
      }) as Parameters<typeof POST>[0]
    );
    expect(res.status).toBe(429);
  });

  it("returns 200 with valid payload", async () => {
    const res = await POST(
      jsonRequest({
        name: "Test User",
        email: "test@example.com",
        subject: "Inquiry",
        message: "This is a valid message with enough characters.",
      }) as Parameters<typeof POST>[0]
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
