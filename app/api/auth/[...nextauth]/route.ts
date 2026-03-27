import { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { customerAuthOptions } from '@/lib/auth-customer'
import { adminAuthOptions } from '@/lib/auth-admin'

function isAdminRequest(req: NextRequest): boolean {
  const host = req.headers.get('host') ?? ''
  return (
    host.startsWith('admin.') ||
    host.includes('admin.printhub.africa') ||
    (process.env.NODE_ENV === 'development' && 
     req.nextUrl.searchParams.get('_admin') === '1')
  )
}

const handler = async (req: NextRequest, ctx: unknown) => {
  const config = isAdminRequest(req) 
    ? adminAuthOptions 
    : customerAuthOptions
  return NextAuth(config)(req, ctx)
}

export { handler as GET, handler as POST }
