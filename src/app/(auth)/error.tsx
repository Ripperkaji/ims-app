
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import Link from 'next/link'

export default function AuthSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Auth Segment Error Boundary Caught:", error);
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 text-center">
      <h2 className="text-2xl font-bold mb-4 text-destructive">Login Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Sorry, we couldn't process your login request at this time. Please try again.
      </p>
      <pre className="mb-6 p-3 bg-muted rounded-md text-xs text-left max-w-md overflow-auto">
        {error.message}
      </pre>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          variant="outline"
        >
          Try Again
        </Button>
         <Button asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" /> Go to Login Selection
          </Link>
        </Button>
      </div>
    </div>
  )
}
