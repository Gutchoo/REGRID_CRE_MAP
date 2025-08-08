'use client'

import { useState, useEffect } from 'react'
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

interface DuplicateProperty {
  id: string
  address: string
  city?: string
  state?: string
  apn: string
  created_at: string
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
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false)
  const [duplicateProperty, setDuplicateProperty] = useState<DuplicateProperty | null>(null)
  const [isRecentlyChanged, setIsRecentlyChanged] = useState(false)
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

  // Debounced duplicate checking with timing control
  useEffect(() => {
    // Set recently changed flag whenever APN changes
    setIsRecentlyChanged(true)
    setDuplicateProperty(null) // Clear previous results
    
    const checkForDuplicate = async (apn: string) => {
      if (!apn || apn.length < 3) {
        setDuplicateProperty(null)
        setIsDuplicateChecking(false)
        setIsRecentlyChanged(false)
        return
      }

      setIsDuplicateChecking(true)
      try {
        const response = await fetch(`/api/user-properties/check-apn?apn=${encodeURIComponent(apn)}`)
        const data = await response.json()

        if (response.ok && data.exists) {
          setDuplicateProperty(data.property)
        } else {
          setDuplicateProperty(null)
        }
      } catch (error) {
        console.error('Duplicate check error:', error)
        // Fail silently - don't block user if duplicate check fails
        setDuplicateProperty(null)
      } finally {
        setIsDuplicateChecking(false)
        setIsRecentlyChanged(false) // Allow button to be enabled after check completes
      }
    }

    const timeoutId = setTimeout(() => {
      checkForDuplicate(apnValue)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [apnValue])

  const handleSearch = async () => {
    const apn = form.getValues('apn')

    if (!apn) {
      setSearchError('Please enter an APN')
      return
    }

    // Prevent search if duplicate is found
    if (duplicateProperty) {
      setSearchError('This property already exists in your portfolio')
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to add property'
      
      // Special handling for duplicate property errors
      if (errorMessage.includes('already exists in your portfolio')) {
        setSearchError('This property is already in your portfolio. Please search for a different APN.')
        // Clear the property preview since it's a duplicate
        setPropertyPreview(null)
      } else {
        setSearchError(errorMessage)
      }
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
              
              {/* Duplicate property warning */}
              {duplicateProperty && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Property Already Exists
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This APN is already in your portfolio:</p>
                        <p className="font-medium">
                          {duplicateProperty.address}
                          {duplicateProperty.city && `, ${duplicateProperty.city}`}
                          {duplicateProperty.state && `, ${duplicateProperty.state}`}
                        </p>
                        <p className="text-xs mt-1">
                          Added on {new Date(duplicateProperty.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Duplicate checking indicator */}
              {isDuplicateChecking && apnValue && (
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                  Checking for duplicates...
                </div>
              )}
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSearch}
            disabled={isSearching || !apnValue || !!duplicateProperty || isDuplicateChecking || isRecentlyChanged}
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