import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LedgerHead } from '@/components/Ledger'

export function NotFound() {
  return (
    <div className="flex flex-col gap-6 pt-8">
      <LedgerHead label="404" />
      <h1 className="de text-balance text-4xl" lang="de">Diese Seite gibt es nicht.</h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        That page is not here. Your progress is safe: it lives in this browser, not in the URL.
      </p>
      <Button asChild className="w-fit">
        <Link to="/">Back to practice</Link>
      </Button>
    </div>
  )
}
