/**
 * Validates that a request is coming from an internal service
 * using the shared INTERNAL_SERVICE_SECRET.
 */
export async function validateInternalRequest(req: Request): Promise<boolean> {
  const secret = process.env.INTERNAL_SERVICE_SECRET;
  if (!secret) {
    console.error("INTERNAL_SERVICE_SECRET is not configured.");
    return false;
  }

  const incomingSecret = req.headers.get("x-internal-service");
  return incomingSecret === secret;
}

/**
 * Helper to call an internal API with proper headers.
 */
export async function callInternalApi<T>(
  path: string, 
  method: string = "GET", 
  body?: unknown, 
  adminJwt?: string
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://printhub.africa";
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-internal-service": process.env.INTERNAL_SERVICE_SECRET || "",
  };

  if (adminJwt) {
    headers["x-admin-session"] = adminJwt;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Internal API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}
