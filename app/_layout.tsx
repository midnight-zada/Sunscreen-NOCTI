import { Stack } from 'expo-router'
import { SQLiteDatabase } from 'expo-sqlite'
import { createContext, useContext, useEffect, useState } from 'react'
import { openDB } from '../lib/db'
import { getUserId } from '../lib/id'

type AppContextType = {
  db: SQLiteDatabase
  userId: string
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within provider')
  return ctx
}

export default function RootLayout() {
  const [ctx, setCtx] = useState<AppContextType | null>(null)

  useEffect(() => {
    async function initApp() {
      const db = await openDB()
      const userId = await getUserId(db)
      setCtx({ db, userId })
    }

    initApp()
  }, [])

  if (!ctx) return null

  return (
    <AppContext.Provider value={ctx}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppContext.Provider>
  )
}
