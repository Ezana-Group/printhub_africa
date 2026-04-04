import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: { service: string } }) {
  const session = await auth()
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = params.service.toLowerCase()
  const startTime = Date.now()

  try {
    let status = '❌'
    let success = false
    let responseMs = 0

    // Check environment variables
    const checkKey = (key: string) => {
        if (!process.env[key]) {
            return { status: '⚠️', error: `Missing ${key}` }
        }
        return { status: '✅', error: null }
    }

    // Health check logic based on service
    // For many services, we can just check if key exists and maybe do a minimal API call or just return the key status
    // To avoid actual costs on every poll, we mainly check configuration and maybe one small request
    switch (service) {
      case 'claude':
      case 'anthropic':
        ({ status } = checkKey('ANTHROPIC_API_KEY')); success = status === '✅'; break
      case 'gpt4o':
      case 'openai':
      case 'whisper':
      case 'dalle':
        ({ status } = checkKey('OPENAI_API_KEY')); success = status === '✅'; break
      case 'stability':
        ({ status } = checkKey('STABILITY_API_KEY')); success = status === '✅'; break
      case 'elevenlabs':
        ({ status } = checkKey('ELEVENLABS_API_KEY')); success = status === '✅'; break
      case 'runway':
        ({ status } = checkKey('RUNWAY_API_KEY')); success = status === '✅'; break
      case 'gemini':
        ({ status } = checkKey('GEMINI_API_KEY')); success = status === '✅'; break
      case 'perplexity':
        ({ status } = checkKey('PERPLEXITY_API_KEY')); success = status === '✅'; break
      case 'whatsapp':
        ({ status } = checkKey('WHATSAPP_ACCESS_TOKEN')); success = status === '✅'; break
      case 'meta':
        ({ status } = checkKey('META_ACCESS_TOKEN')); success = status === '✅'; break
      case 'tiktok':
        ({ status } = checkKey('TIKTOK_EVENTS_API_TOKEN')); success = status === '✅'; break
      default:
        return NextResponse.json({ error: 'Invalid service' }, { status: 400 })
    }

    responseMs = Date.now() - startTime

    return NextResponse.json({
      service,
      status,
      success,
      responseMs,
      lastSuccessfulCall: new Date().toISOString(),
    })
  } catch (err) {
    console.error(`[api/admin/ai/service-health/${service}] Error:`, err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
