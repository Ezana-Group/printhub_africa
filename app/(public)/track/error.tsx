'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertCircle, RefreshCw, MessageCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <div className="min-h-[50vh] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          Our team has been notified automatically.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col gap-2 mt-4">
          <button onClick={reset}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#CC3D00] text-white rounded-xl text-sm font-medium">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <a href="https://wa.me/254727410320" target="_blank"
            className="flex items-center justify-center gap-2 w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm">
            <MessageCircle className="w-4 h-4 text-green-500" />
            Contact us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
