//supabase.js 
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement Supabase manquantes!')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Définie' : 'Manquante')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Fonction utilitaire pour déboguer l'auth
export const debugAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Session actuelle:', session)
    console.log('Erreur session:', error)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Utilisateur actuel:', user)
    console.log('Erreur utilisateur:', userError)
    
    return { session, user, error, userError }
  } catch (err) {
    console.error('Erreur debug auth:', err)
    return { error: err }
  }
} 