'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSVUpload } from '@/components/upload/csv-upload'
import { APNForm } from '@/components/upload/apn-form'
import { AddressForm } from '@/components/upload/address-form'
import { UploadIcon, FileTextIcon, MapPinIcon } from 'lucide-react'

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Properties</h1>
        <p className="text-muted-foreground">
          Import properties to your portfolio using CSV files, APNs, or addresses
        </p>
      </div>

      <Tabs defaultValue="csv" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="csv" className="flex items-center gap-2">
            <UploadIcon className="h-4 w-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="apn" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            APN Entry
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4" />
            Address Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV File Upload</CardTitle>
              <CardDescription>
                Upload a CSV file containing property data. Supported formats include APN-only files 
                or address-based files with columns for address, city, and state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CSVUpload />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apn" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add by APN</CardTitle>
              <CardDescription>
                Enter an Assessor Parcel Number (APN) to fetch property details automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APNForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add by Address</CardTitle>
              <CardDescription>
                Search for properties by address with autocomplete suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddressForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}