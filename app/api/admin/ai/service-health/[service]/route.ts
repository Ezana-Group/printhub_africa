import { NextResponse } from 'next/server'
import { requireAdminApi } from "@/lib/admin-api-guard";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function GET(req: Request, { params }: { params: { service: string } }) {
  const auth = await requireAdminApi({ permission: "settings_view" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const verify = url.searchParams.get('verify') === 'true';
  const serviceKey = params.service.toLowerCase();
  const startTime = Date.now();

  try {
    let status: "healthy" | "degraded" | "down" = 'down';
    let reachable = false;
    let errorMessage: string | null = null;
    let lastVerifiedAt: Date | null = null;

    const envMap: Record<string, string> = {
      'claude': 'ANTHROPIC_API_KEY',
      'openai-gpt4o': 'OPENAI_API_KEY',
      'openai-gpt4o-mini': 'OPENAI_API_KEY',
      'dalle3': 'OPENAI_API_KEY',
      'whisper': 'OPENAI_API_KEY',
      'stability': 'STABILITY_API_KEY',
      'elevenlabs': 'ELEVENLABS_API_KEY',
      'runway': 'RUNWAY_API_KEY',
      'gemini': 'GEMINI_API_KEY',
      'perplexity': 'PERPLEXITY_API_KEY',
      'whatsapp': 'WHATSAPP_ACCESS_TOKEN',
    };

    const envVar = envMap[serviceKey];
    const apiKey = envVar ? process.env[envVar] : null;

    if (apiKey) {
      reachable = true;
      const currentHash = hashApiKey(apiKey);

      // Check for existing verification
      const existing = await prisma.aiServiceVerification.findUnique({
        where: { service: serviceKey }
      });

      if (existing) {
        lastVerifiedAt = existing.lastVerifiedAt;
        if (existing.apiKeyHash === currentHash && !verify) {
          status = existing.status as any;
          errorMessage = existing.errorMessage;
        }
      }

      // If we need to verify (either forced or no valid record)
      if (verify || !existing || existing.apiKeyHash !== currentHash) {
        try {
          // Minimal connectivity ping for each provider
          if (serviceKey.includes('openai') || serviceKey === 'dalle3' || serviceKey === 'whisper') {
            const res = await fetch('https://api.openai.com/v1/models', {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!res.ok) throw new Error(`OpenAI: ${res.status} ${res.statusText}`);
          } else if (serviceKey === 'claude') {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1,
                messages: [{ role: 'user', content: 'ping' }]
              })
            });
            if (!res.ok) throw new Error(`Anthropic: ${res.status} ${res.statusText}`);
          } else if (serviceKey === 'gemini') {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!res.ok) throw new Error(`Gemini: ${res.status} ${res.statusText}`);
          } else if (serviceKey === 'elevenlabs') {
            const res = await fetch('https://api.elevenlabs.io/v1/user', {
              headers: { 'xi-api-key': apiKey }
            });
            if (!res.ok) throw new Error(`ElevenLabs: ${res.status} ${res.statusText}`);
          } else if (serviceKey === 'stability') {
            const res = await fetch('https://api.stability.ai/v1/user/account', {
              headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!res.ok) throw new Error(`Stability: ${res.status} ${res.statusText}`);
          }

          status = 'healthy';
          errorMessage = null;
        } catch (pingErr: any) {
          status = 'down';
          errorMessage = pingErr.message;
        }

        // Persist the result
        const now = new Date();
        await prisma.aiServiceVerification.upsert({
          where: { service: serviceKey },
          create: {
            service: serviceKey,
            apiKeyHash: currentHash,
            status,
            errorMessage,
            lastVerifiedAt: now
          },
          update: {
            apiKeyHash: currentHash,
            status,
            errorMessage,
            lastVerifiedAt: now
          }
        });
        lastVerifiedAt = now;
      }
    } else {
      errorMessage = `Missing ${envVar || serviceKey.toUpperCase() + '_API_KEY'}`;
    }

    // Fetch monthly stats from DB
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCalls, successfulCalls, costSum] = await Promise.all([
      prisma.aiServiceLog.count({
        where: { service: serviceKey, createdAt: { gte: startOfMonth } }
      }),
      prisma.aiServiceLog.count({
        where: { service: serviceKey, success: true, createdAt: { gte: startOfMonth } }
      }),
      prisma.aiServiceLog.aggregate({
        where: { service: serviceKey, createdAt: { gte: startOfMonth } },
        _sum: { costUsd: true }
      })
    ]);

    const successRate = totalCalls > 0 ? Math.round((successfulCalls / totalCalls) * 100) : 0;

    return NextResponse.json({
      service: serviceKey,
      status,
      reachable,
      errorMessage,
      responseMs: Date.now() - startTime,
      lastSuccessAt: lastVerifiedAt?.toISOString() || null,
      consecutiveFailures: status === 'down' ? 1 : 0,
      monthlyStats: {
        totalCalls,
        successRate,
        totalCostUsd: Number(costSum._sum?.costUsd || 0)
      }
    });
  } catch (err) {
    console.error(`[api/admin/ai/service-health/${serviceKey}] Error:`, err);
    return NextResponse.json({
      service: serviceKey,
      status: 'down',
      reachable: false,
      monthlyStats: { totalCalls: 0, successRate: 0, totalCostUsd: 0 }
    });
  }
}
