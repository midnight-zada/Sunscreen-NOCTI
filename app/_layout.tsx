import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppContext, AppContextType } from '../context/AppContext'

import { openDB } from '../lib/db'
import { getUserId } from '../lib/id'

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AppContext.Provider value={ctx}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="editProfile" />
          </Stack>
        </AppContext.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
