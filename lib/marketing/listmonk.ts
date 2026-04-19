const BASE = process.env.LISTMONK_URL!;
const AUTH = Buffer.from(
  `${process.env.LISTMONK_ADMIN_USER}:${process.env.LISTMONK_ADMIN_PASSWORD}`
).toString("base64");

export async function subscribeToList(email: string, name: string, listId: number) {
  await fetch(`${BASE}/api/subscribers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ email, name, lists: [listId], status: "enabled" }),
  });
}

export async function sendTransactional(
  templateId: number,
  email: string,
  data: Record<string, unknown>
) {
  await fetch(`${BASE}/api/tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ subscriber_email: email, template_id: templateId, data }),
  });
}
