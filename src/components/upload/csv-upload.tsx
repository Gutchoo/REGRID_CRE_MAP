'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UploadIcon, CheckCircleIcon, AlertCircleIcon, XCircleIcon } from 'lucide-react'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

interface CSVRow {
  apn?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  detectedFormat: 'apn' | 'address' | 'unknown'
  sampleData: CSVRow[]
}

export function CSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setValidation(null)
    setUploadResults(null)
    validateCSV(selectedFile)
  }

  const validateCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      preview: 5, // Only parse first 5 rows for validation
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[]
        const errors: string[] = []

        if (data.length === 0) {
          errors.push('CSV file appears to be empty')
          setValidation({ isValid: false, errors, detectedFormat: 'unknown', sampleData: [] })
          return
        }

        // Check for required columns
        const headers = Object.keys(data[0]).map(h => h.toLowerCase())
        
        let detectedFormat: 'apn' | 'address' | 'unknown' = 'unknown'

        // Check for APN format
        if (headers.some(h => h.includes('apn') || h.includes('parcel'))) {
          detectedFormat = 'apn'
        } 
        // Check for address format
        else if (headers.some(h => h.includes('address')) || 
                 (headers.includes('city') && headers.includes('state'))) {
          detectedFormat = 'address'
        }

        if (detectedFormat === 'unknown') {
          errors.push('Could not detect valid format. Expected columns: APN, or Address/City/State')
        }

        // Validate data quality
        if (detectedFormat === 'apn') {
          const apnColumn = headers.find(h => h.includes('apn') || h.includes('parcel'))
          const emptyApns = data.filter(row => !row[apnColumn!])
          if (emptyApns.length > 0) {
            errors.push(`${emptyApns.length} rows have empty APN values`)
          }
        } else if (detectedFormat === 'address') {
          const emptyAddresses = data.filter(row => !row.address && !row.Address)
          if (emptyAddresses.length > 0) {
            errors.push(`${emptyAddresses.length} rows have empty address values`)
          }
        }

        setValidation({
          isValid: errors.length === 0,
          errors,
          detectedFormat,
          sampleData: data.slice(0, 3) // Show first 3 rows as preview
        })
      },
      error: (error) => {
        setValidation({
          isValid: false,
          errors: [`Failed to parse CSV: ${error.message}`],
          detectedFormat: 'unknown',
          sampleData: []
        })
      }
    })
  }

  const handleUpload = async () => {
    if (!file || !validation?.isValid) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Parse entire file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (parseResults) => {
          const data = parseResults.data as CSVRow[]
          
          // Transform data based on detected format
          const properties = data.map(row => {
            if (validation.detectedFormat === 'apn') {
              const apnKey = Object.keys(row).find(k => 
                k.toLowerCase().includes('apn') || k.toLowerCase().includes('parcel')
              )
              return {
                apn: row[apnKey!],
                address: row.address || row.Address || `Property ${row[apnKey!]}` // Fallback address
              }
            } else {
              return {
                address: row.address || row.Address,
                city: row.city || row.City,
                state: row.state || row.State,
                zip_code: row.zip || row.ZIP || row.zip_code
              }
            }
          })

          // Upload in batches to avoid overwhelming the API
          const batchSize = 10
          const results = []
          const errors = []

          for (let i = 0; i < properties.length; i += batchSize) {
            const batch = properties.slice(i, i + batchSize)
            setUploadProgress((i / properties.length) * 100)

            try {
              const response = await fetch('/api/user-properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  properties: batch,
                  source: 'csv'
                })
              })

              const result = await response.json()
              if (!response.ok) {
                throw new Error(result.error || 'Upload failed')
              }

              results.push(...result.created)
              errors.push(...result.errors)
            } catch (error) {
              console.error('Batch upload error:', error)
              errors.push({
                batch: i / batchSize + 1,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
            }
          }

          setUploadProgress(100)
          setUploadResults({
            total: properties.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
          })
        }
      })
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResults({
        total: 0,
        successful: 0,
        failed: 1,
        results: [],
        errors: [{ error: error instanceof Error ? error.message : 'Upload failed' }]
      })
    } finally {
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setValidation(null)
    setUploadResults(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (uploadResults) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircleIcon className="h-4 w-4" />
          <AlertTitle>Upload Complete</AlertTitle>
          <AlertDescription>
            Successfully processed {uploadResults.successful} of {uploadResults.total} properties.
            {uploadResults.failed > 0 && ` ${uploadResults.failed} failed.`}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            View Properties
          </Button>
          <Button variant="outline" onClick={resetUpload}>
            Upload Another File
          </Button>
        </div>

        {uploadResults.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Some Properties Failed</AlertTitle>
            <AlertDescription>
              <details className="mt-2">
                <summary>View error details</summary>
                <pre className="mt-2 text-xs whitespace-pre-wrap">
                  {JSON.stringify(uploadResults.errors.slice(0, 5), null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="csv-file">CSV File</Label>
        <Input
          ref={fileInputRef}
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Support formats: APN column, or Address/City/State columns
        </p>
      </div>

      {validation && (
        <div className="space-y-4">
          <Alert variant={validation.isValid ? 'default' : 'destructive'}>
            {validation.isValid ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <XCircleIcon className="h-4 w-4" />
            )}
            <AlertTitle>
              {validation.isValid ? 'File Valid' : 'Validation Failed'}
            </AlertTitle>
            <AlertDescription>
              {validation.isValid ? (
                <div className="flex items-center gap-2">
                  <span>Detected format:</span>
                  <Badge variant="outline">{validation.detectedFormat.toUpperCase()}</Badge>
                </div>
              ) : (
                <ul className="list-disc list-inside mt-2">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>

          {validation.isValid && validation.sampleData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Data Preview</h4>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(validation.sampleData[0]).slice(0, 4).map(key => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validation.sampleData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).slice(0, 4).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>{String(value || '')}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading properties...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      <div className="flex gap-4">
        <Button
          onClick={handleUpload}
          disabled={!validation?.isValid || isUploading}
          className="flex-1"
        >
          <UploadIcon className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Properties'}
        </Button>
        {file && (
          <Button variant="outline" onClick={resetUpload}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}