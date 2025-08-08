import { NextRequest, NextResponse } from 'next/server'
import { RegridService } from '@/lib/regrid'
import { getUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const apn = searchParams.get('apn')
    const address = searchParams.get('address')
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!apn && !address) {
      return NextResponse.json(
        { error: 'Either APN or address is required' }, 
        { status: 400 }
      )
    }

    let results

    if (apn) {
      // Search by APN
      const property = await RegridService.searchByAPN(apn, state || undefined)
      results = property ? [property] : []
    } else if (address) {
      // Search by address for autocomplete
      results = await RegridService.searchByAddress(
        address, 
        city || undefined, 
        state || undefined,
        limit
      )
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Property search error:', error)
    return NextResponse.json(
      { error: 'Failed to search properties' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { apns, addresses } = body

    let results = []

    if (apns && Array.isArray(apns)) {
      // Batch search by APNs
      results = await RegridService.batchSearchByAPNs(apns, body.state)
    } else if (addresses && Array.isArray(addresses)) {
      // Batch search by addresses
      results = await RegridService.batchSearchByAddresses(addresses)
    } else {
      return NextResponse.json(
        { error: 'Either apns or addresses array is required' }, 
        { status: 400 }
      )
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Batch property search error:', error)
    return NextResponse.json(
      { error: 'Failed to search properties' }, 
      { status: 500 }
    )
  }
}