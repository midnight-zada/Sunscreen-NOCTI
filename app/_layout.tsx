import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppContext, AppContextType } from '../context/AppContext'
import { UserSunscreenProvider } from '../context/UserSunscreenContext'

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
          <UserSunscreenProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="editProfile" />
              <Stack.Screen name="editUserSunscreen" />
              <Stack.Screen name="viewUserSunscreen" />
            </Stack>
          </UserSunscreenProvider>
        </AppContext.Provider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
