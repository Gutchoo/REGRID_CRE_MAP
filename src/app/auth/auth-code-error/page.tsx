import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            Something went wrong during the authentication process.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            We encountered an issue while signing you in. This might be due to:
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• Network connectivity issues</li>
            <li>• Browser security restrictions</li>
            <li>• Expired authentication request</li>
          </ul>
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/sign-in">Try Again</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}