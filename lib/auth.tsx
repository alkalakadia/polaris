"use client"

/**
 * Client-side auth for the patient app.
 *
 * The whole patient experience is client-rendered, so we use Supabase's
 * browser client with its default localStorage-backed session. No SSR /
 * middleware needed for the prototype. When Supabase isn't configured the
 * provider reports `configured: false` and the app stays in on-device mode.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"
import { browserClient, isSupabaseConfigured } from "@/lib/supabase"
import { migrateLocalToCloud, resetMigrationGuard } from "@/lib/tracker-store"

interface AuthState {
  user: User | null
  loading: boolean
  configured: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<{ error?: string; needsConfirm?: boolean }>
  signOut: () => Promise<void>
  updateName: (displayName: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const c = browserClient()
    if (!c) {
      setLoading(false)
      return
    }
    c.auth
      .getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    const { data: sub } = c.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) void migrateLocalToCloud()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const c = browserClient()
    if (!c) return { error: "Cloud sync isn't set up yet." }
    const { error } = await c.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const c = browserClient()
      if (!c) return { error: "Cloud sync isn't set up yet." }
      const { data, error } = await c.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName ?? "" } },
      })
      if (error) return { error: error.message }
      // No session means email confirmation is required.
      return { needsConfirm: !data.session }
    },
    []
  )

  const signOut = useCallback(async () => {
    const c = browserClient()
    if (c) await c.auth.signOut()
    resetMigrationGuard()
    setUser(null)
  }, [])

  const updateName = useCallback(async (displayName: string) => {
    const c = browserClient()
    if (!c) return { error: "Not connected." }
    const name = displayName.trim()
    const { data, error } = await c.auth.updateUser({ data: { display_name: name } })
    if (error) return { error: error.message }
    if (data.user) setUser(data.user)
    // Keep the profiles row in sync (best-effort).
    if (data.user) await c.from("profiles").update({ display_name: name }).eq("id", data.user.id)
    return {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, configured, signIn, signUp, signOut, updateName }}>
      {children}
    </AuthContext.Provider>
  )
}
