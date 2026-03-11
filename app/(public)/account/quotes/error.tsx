'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function QuotesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Couldn&apos;t load your quotes
        </h2>
        <p className="text-gray-500 mb-6">
          {error.message?.includes('relation')
            ? 'The quotes system is still being set up. Please check back shortly.'
            : 'Something went wrong loading your quotes. Please try again.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="bg-[#FF4D00] text-white">
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/account')}>
            Back to account
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Need help? WhatsApp us on{' '}
          <a href="https://wa.me/254727410320" className="underline">
            +254 727 410 320
          </a>
        </p>
      </div>
    </div>
  )
}
