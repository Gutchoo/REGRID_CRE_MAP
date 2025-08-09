'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchIcon, XIcon } from 'lucide-react'

interface SearchBarProps {
  onSearchChange: (query: string) => void
  placeholder?: string
  resultsCount?: number
  totalCount?: number
}

export function SearchBar({ 
  onSearchChange, 
  placeholder = "Search properties by address, owner, APN, zip code...",
  resultsCount,
  totalCount
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(query)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query, onSearchChange])

  const handleClear = () => {
    setQuery('')
    onSearchChange('')
  }

  const showResultsCount = resultsCount !== undefined && totalCount !== undefined
  const hasResults = resultsCount !== undefined && resultsCount > 0
  const isFiltered = query.trim().length > 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Results Counter */}
      {showResultsCount && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {isFiltered ? (
              hasResults ? (
                <span>
                  Showing <span className="font-medium text-foreground">{resultsCount}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> properties
                </span>
              ) : (
                <span className="text-amber-600">
                  No properties match &quot;{query}&quot;
                </span>
              )
            ) : (
              <span>
                <span className="font-medium text-foreground">{totalCount}</span> properties total
              </span>
            )}
          </div>
          
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-auto p-1 text-xs hover:bg-muted"
            >
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}