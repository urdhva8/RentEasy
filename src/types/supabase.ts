
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string | null
          name: string | null
          role: string | null
          phone_number: string | null
          profile_image_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email?: string | null
          name?: string | null
          role?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
          name?: string | null
          role?: string | null
          phone_number?: string | null
          profile_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      properties: {
        Row: {
            id: string
            created_at: string
            owner_id: string
            name: string
            address: string
            price: number
            description: string
            image_urls: string[] | null
        }
        Insert: {
            id?: string
            created_at?: string
            owner_id: string
            name: string
            address: string
            price: number
            description: string
            image_urls?: string[] | null
        }
        Update: {
            id?: string
            created_at?: string
            owner_id?: string
            name?: string
            address?: string
            price?: number
            description?: string
            image_urls?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type UserRole = Database['public']['Tables']['users']['Row']['role'];
