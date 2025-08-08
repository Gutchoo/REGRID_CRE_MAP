import { NextRequest, NextResponse } from 'next/server'
import { RegridService } from '@/lib/regrid'
import { getUserId } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        { error: 'Property ID is required' }, 
        { status: 400 }
      )
    }

    const property = await RegridService.getPropertyById(id)
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' }, 
        { status: 404 }
      )
    }

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Get property error:', error)
    return NextResponse.json(
      { error: 'Failed to get property details' }, 
      { status: 500 }
    )
  }
}