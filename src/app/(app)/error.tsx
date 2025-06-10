
'use client' 

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App Segment Error Boundary Caught:", error);
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
      <AlertTriangle className="w-12 h-12 text-destructive mb-3" />
      <h2 className="text-2xl font-semibold mb-3">An Error Occurred in This Section</h2>
      <p className="text-muted-foreground mb-4 max-w-lg">
        We've encountered a problem while trying to load this part of the application.
        Please try again or navigate to a different section.
      </p>
       <pre className="mb-4 p-3 bg-muted rounded-md text-xs text-left max-w-md overflow-auto">
        {error.message}
      </pre>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          variant="outline"
          size="sm"
        >
          Try Again
        </Button>
        <Button asChild size="sm">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
