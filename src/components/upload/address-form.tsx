'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon, MapPinIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { debounce } from 'lodash'

const formSchema = z.object({
  address: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().optional(),
  state: z.string().optional(),
  user_notes: z.string().optional(),
  insurance_provider: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddressSuggestion {
  id: string
  apn: string
  address: string
  city: string
  state: string
  zip: string
  score: number
}

interface PropertyDetails {
  id: string
  apn: string
  address: string
  city: string
  state: string
  zip: string
  owner: string
  lot_size_sqft?: number
  assessed_value?: number
  property_type?: string
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export function AddressForm() {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyDetails | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: '',
      city: '',
      state: '',
      user_notes: '',
      insurance_provider: '',
    },
  })

  const searchAddresses = useCallback(
    debounce(async (query: string, city?: string, state?: string) => {
      if (query.length < 3) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsSearching(true)
      setSearchError(null)

      try {
        const params = new URLSearchParams({
          address: query,
          limit: '10'
        })
        if (city) params.append('city', city)
        if (state) params.append('state', state)

        const response = await fetch(`/api/properties/search?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Search failed')
        }

        setSuggestions(data.results || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Address search error:', error)
        setSearchError(error instanceof Error ? error.message : 'Failed to search addresses')
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 500),
    []
  )

  const handleAddressChange = (value: string) => {
    form.setValue('address', value)
    setSelectedProperty(null)
    const city = form.getValues('city')
    const state = form.getValues('state')
    searchAddresses(value, city, state)
  }

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setShowSuggestions(false)
    setIsLoadingDetails(true)
    
    // Update form with selected address
    form.setValue('address', suggestion.address)
    form.setValue('city', suggestion.city)
    form.setValue('state', suggestion.state)

    try {
      // Get detailed property information
      const response = await fetch(`/api/properties/${suggestion.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get property details')
      }

      const property = data.property
      setSelectedProperty({
        id: property.id,
        apn: property.apn,
        address: `${property.address.line1}${property.address.line2 ? `, ${property.address.line2}` : ''}`,
        city: property.address.city,
        state: property.address.state,
        zip: property.address.zip,
        owner: property.properties?.owner || 'Owner not available',
        lot_size_sqft: property.properties?.lot_size_sqft,
        assessed_value: property.properties?.assessed_value,
        property_type: property.properties?.property_type,
      })
    } catch (error) {
      console.error('Property details error:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to get property details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedProperty) {
      setSearchError('Please select a property from the suggestions')
      return
    }

    setIsSubmitting(true)
    setSearchError(null)

    try {
      const response = await fetch('/api/user-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: data.address,
          city: data.city,
          state: data.state,
          regrid_id: selectedProperty.id,
          user_notes: data.user_notes,
          insurance_provider: data.insurance_provider,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add property')
      }

      setSubmitSuccess(true)
    } catch (error) {
      console.error('Submit error:', error)
      setSearchError(error instanceof Error ? error.message : 'Failed to add property')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
              setSelectedProperty(null)
              setSuggestions([])
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
        <div className="relative" ref={suggestionRef}>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Start typing an address..."
                    onChange={(e) => handleAddressChange(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true)
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || isSearching) && (
            <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
              {isSearching && (
                <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Searching addresses...
                </div>
              )}
              
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left p-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{suggestion.address}</div>
                      <div className="text-sm text-muted-foreground">
                        {suggestion.city}, {suggestion.state} {suggestion.zip}
                      </div>
                      {suggestion.apn && (
                        <div className="text-xs text-muted-foreground mt-1">
                          APN: {suggestion.apn}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {Math.round(suggestion.score * 100)}%
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Los Angeles" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {searchError && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Search Error</AlertTitle>
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {isLoadingDetails && (
          <Alert>
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <AlertTitle>Loading Property Details</AlertTitle>
            <AlertDescription>Getting detailed property information...</AlertDescription>
          </Alert>
        )}

        {selectedProperty && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Property Selected
              </CardTitle>
              <CardDescription>Review the property details below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Address:</strong> {selectedProperty.address}
                {selectedProperty.city && `, ${selectedProperty.city}`}
                {selectedProperty.state && `, ${selectedProperty.state}`}
                {selectedProperty.zip && ` ${selectedProperty.zip}`}
              </div>
              {selectedProperty.apn && (
                <div>
                  <strong>APN:</strong> {selectedProperty.apn}
                </div>
              )}
              <div>
                <strong>Owner:</strong> {selectedProperty.owner}
              </div>
              {selectedProperty.property_type && (
                <div>
                  <strong>Property Type:</strong> {selectedProperty.property_type}
                </div>
              )}
              {selectedProperty.lot_size_sqft && (
                <div>
                  <strong>Lot Size:</strong> {selectedProperty.lot_size_sqft.toLocaleString()} sq ft
                </div>
              )}
              {selectedProperty.assessed_value && (
                <div>
                  <strong>Assessed Value:</strong> ${selectedProperty.assessed_value.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedProperty && (
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