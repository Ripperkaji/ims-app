
'use client' 

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global Error Boundary Caught:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-3xl font-bold mb-2">Oops, Something Went Wrong</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            An unexpected error occurred. We apologize for the inconvenience.
            You can try to refresh the page or go back to the dashboard.
          </p>
          <pre className="mb-6 p-4 bg-muted rounded-md text-sm max-w-xl overflow-auto">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
          <div className="flex gap-4">
            <Button
              onClick={() => reset()}
              variant="outline"
            >
              Try Again
            </Button>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
