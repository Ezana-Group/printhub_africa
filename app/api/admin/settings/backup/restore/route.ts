import { NextResponse } from "next/server";
import { requireRole } from "@/lib/settings-api";
import { restoreDatabase } from "@/lib/backup-utils";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await requireRole(req, "SUPER_ADMIN");
  if (auth instanceof NextResponse) return auth;

  // SSE setup
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: string, status: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step, status })}\n\n`));
      };

      try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file || !file.name.endsWith(".zip")) {
          throw new Error("Invalid file upload. .zip required.");
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        const manifest = await restoreDatabase(buffer, (step, status) => {
          sendProgress(step, status === "in_progress" ? "in_progress" : "done");
        });

        await writeAudit({
          userId: auth.userId,
          action: "SYSTEM_RESTORED",
          entity: "SYSTEM",
          details: `System restored from backup: ${manifest.timestamp} (App v${manifest.appVersion})`,
        });

        sendProgress("Complete — restarting", "done");
        controller.close();
      } catch (error) {
        console.error("Restore failed:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Restore failed" })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
