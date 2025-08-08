import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Property } from './supabase'

async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

export class DatabaseService {
  
  // Create a new property
  static async createProperty(propertyData: Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user to ensure we have authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }
    
    // Explicitly include user_id in the insert
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        user_id: user.id
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Get all properties for a user
  static async getUserProperties(userId: string): Promise<Property[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  // Get a single property by ID
  static async getProperty(id: string, userId: string): Promise<Property | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  }

  // Update a property
  static async updateProperty(id: string, userId: string, updates: Partial<Property>) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Delete a property
  static async deleteProperty(id: string, userId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }

  // Search properties by address (for autocomplete)
  static async searchPropertiesByAddress(searchTerm: string, userId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('search_properties_by_address', {
        search_term: searchTerm,
        user_id_param: userId
      })
    
    if (error) throw error
    return data || []
  }

  // Bulk insert properties (for CSV upload)
  static async bulkCreateProperties(properties: Omit<Property, 'id' | 'created_at' | 'updated_at'>[]) {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user to ensure we have authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Authentication required')
    }
    
    // Add user_id to all properties
    const propertiesWithUserId = properties.map(prop => ({
      ...prop,
      user_id: user.id
    }))
    
    const { data, error } = await supabase
      .from('properties')
      .insert(propertiesWithUserId)
      .select()
    
    if (error) throw error
    return data
  }

  // Get properties with filters
  static async getFilteredProperties(
    userId: string,
    filters: {
      city?: string
      state?: string
      tags?: string[]
      search?: string
    }
  ) {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('properties')
      .select('*')
      .eq('user_id', userId)

    if (filters.city) {
      query = query.eq('city', filters.city)
    }

    if (filters.state) {
      query = query.eq('state', filters.state)
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags)
    }

    if (filters.search) {
      query = query.or(`address.ilike.%${filters.search}%,city.ilike.%${filters.search}%,apn.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}