import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapIcon, TableIcon, SettingsIcon } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">RE</span>
              </div>
              <span className="font-semibold text-lg">Real Estate Portfolio</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  Properties
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/map" className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  Map View
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden md:flex">
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </Link>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}