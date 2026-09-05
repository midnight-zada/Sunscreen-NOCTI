import { SQLiteDatabase } from 'expo-sqlite'
import { createContext, useContext } from 'react'

export type AppContextType = {
  db: SQLiteDatabase
  userId: string
}

export const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)

  if (!ctx) throw new Error('useAppContext must be used within provider')
    
  return ctx
}