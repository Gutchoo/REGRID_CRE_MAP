import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">
            Manage your real estate portfolio
          </p>
        </div>
        <Button asChild>
          <Link href="/upload" className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Properties
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
          <CardDescription>
            View and manage all your properties in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <PlusIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by uploading your first property or adding one manually
            </p>
            <Button asChild>
              <Link href="/upload">
                Add Your First Property
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}