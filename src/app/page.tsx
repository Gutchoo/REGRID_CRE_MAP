import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapIcon, TableIcon, UploadIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function Home() {
  const user = await getUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">RE</span>
            </div>
            <span className="font-semibold text-lg">Real Estate Portfolio</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Manage Your Real Estate Portfolio
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Visualize, track, and manage your properties with interactive maps, 
              detailed tables, and powerful data insights powered by Regrid.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/sign-up">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            No credit card required • Start managing properties in minutes
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <MapIcon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Interactive Maps</CardTitle>
                <CardDescription>
                  Visualize your properties on interactive maps with parcel boundaries and detailed overlays.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TableIcon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Filter, search, and edit property details in powerful data tables with real-time updates.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <UploadIcon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Easy Import</CardTitle>
                <CardDescription>
                  Upload CSV files, enter APNs, or search addresses to quickly add properties to your portfolio.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
