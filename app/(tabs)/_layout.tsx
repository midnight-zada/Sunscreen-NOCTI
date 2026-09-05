import { Tabs } from 'expo-router'
import NavBar from '../../components/NavBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NavBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'home' }} />
      <Tabs.Screen name="log" options={{ title: 'log' }} />
      <Tabs.Screen name="profile" options={{ title: 'profile' }} />
    </Tabs>
  )
}
