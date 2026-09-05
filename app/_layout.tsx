import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppContext, AppContextType } from '../context/AppContext'

import { openDB } from '../lib/db'
import { getUserId } from '../lib/id'

export default function RootLayout() {
  const [ctx, setCtx] = useState<AppContextType | null>(null)
  const insets = useSafeAreaInsets()

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
      <StatusBar style="dark" />
      <View style={{ height: insets.top, backgroundColor: '#faf9f6' }} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AppContext.Provider>
  )
}
