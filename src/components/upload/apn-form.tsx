'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchIcon, CheckCircleIcon, AlertCircleIcon, LoaderIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  apn: z.string().min(1, 'APN is required'),
  user_notes: z.string().optional(),
  insurance_provider: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface PropertyPreview {
  id: string
  apn: string
  address: string
  city: string
  state: string
  zip_code: string
  owner: string
  lot_size_sqft?: number
  assessed_value?: number
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

export function APNForm() {
  const [isSearching, setIsSearching] = useState(false)
  const [propertyPreview, setPropertyPreview] = useState<PropertyPreview | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apn: '',
      user_notes: '',
      insurance_provider: '',
    },
  })

  // Watch the APN field for reactive updates
  const apnValue = form.watch('apn')

  const handleSearch = async () => {
    const apn = form.getValues('apn')

    if (!apn) {
      setSearchError('Please enter an APN')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setPropertyPreview(null)

    try {
      const response = await fetch(`/api/properties/search?apn=${encodeURIComponent(apn)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      if (data.results && data.results.length > 0) {
        const property = data.results[0]
        setPropertyPreview({
          id: property.id,
          apn: property.apn,
          address: property.address?.line1 || 'Address not available',
          city: property.address?.city || '',
          state: property.address?.state || '',
          zip_code: property.address?.zip || '',
          owner: property.properties?.owner || 'Owner not available',
          lot_size_sqft: property.properties?.lot_size_sqft,
          assessed_value: property.properties?.assessed_value,
        })
      } else {
        setSearchError('No property found with this APN')
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to search property')
    } finally {
      setIsSearching(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!propertyPreview) {
      setSearchError('Please search for a property first')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apn: data.apn,
          address: propertyPreview.address,
          city: propertyPreview.city,
          state: propertyPreview.state,
          zip_code: propertyPreview.zip_code,
          regrid_id: propertyPreview.id,
          user_notes: data.user_notes,
          insurance_provider: data.insurance_provider,
        }),
      })

      let result
      try {
        const responseText = await response.text()
        console.log('API response status:', response.status)
        console.log('API response text:', responseText)
        
        if (!responseText) {
          throw new Error('Empty response from server')
        }
        
        result = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError)
        throw new Error('Invalid response from server. Please check the server logs.')
      }

      if (!response.ok) {
        throw new Error(result?.error || `Server error (${response.status})`)
      }

      setSubmitSuccess(true)
    } catch (error) {
      console.error('Submit error:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to add property')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <Alert>
        <CheckCircleIcon className="h-4 w-4" />
        <AlertTitle>Property Added Successfully</AlertTitle>
        <AlertDescription>
          The property has been added to your portfolio.
        </AlertDescription>
        <div className="mt-4 flex gap-4">
          <Button onClick={() => router.push('/dashboard')}>
            View Properties
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setSubmitSuccess(false)
              setPropertyPreview(null)
              setSearchError(null)
              form.reset()
            }}
          >
            Add Another Property
          </Button>
        </div>
      </Alert>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="apn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assessor Parcel Number (APN)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. 123-456-789-000"
                  onChange={(e) => {
                    field.onChange(e)
                    setPropertyPreview(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (apnValue && !isSearching) {
                        handleSearch()
                      }
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching || !apnValue}
            className="flex items-center gap-2"
          >
            {isSearching ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            {isSearching ? 'Searching...' : 'Search Property'}
          </Button>
        </div>

        {searchError && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {propertyPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Property Found</CardTitle>
              <CardDescription>Review the property details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>APN:</strong> {propertyPreview.apn}
              </div>
              <div>
                <strong>Address:</strong> {propertyPreview.address}
                {propertyPreview.city && `, ${propertyPreview.city}`}
                {propertyPreview.state && `, ${propertyPreview.state}`}
                {propertyPreview.zip_code && ` ${propertyPreview.zip_code}`}
              </div>
              <div>
                <strong>Owner:</strong> {propertyPreview.owner}
              </div>
              {propertyPreview.lot_size_sqft && (
                <div>
                  <strong>Lot Size:</strong> {propertyPreview.lot_size_sqft.toLocaleString()} sq ft
                </div>
              )}
              {propertyPreview.assessed_value && (
                <div>
                  <strong>Assessed Value:</strong> ${propertyPreview.assessed_value.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {propertyPreview && (
          <>
            <FormField
              control={form.control}
              name="user_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about this property..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insurance_provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurance Provider (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. State Farm, Allstate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Adding Property...' : 'Add Property to Portfolio'}
            </Button>
          </>
        )}
      </form>
    </Form>
  )
}