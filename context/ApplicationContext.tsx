import {
  Application,
  getApplications,
  InsertApplication,
  insertApplication,
} from '@/lib/application'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAppContext } from './AppContext'

export type ApplicationContextType = {
  applications: Application[]
  hasLoaded: boolean
  refreshApplications: () => Promise<void>
  getByUserSunscreenId: (userSunscreenId: number) => Application[]
  addApplication: (application: InsertApplication) => Promise<number>
}

const ApplicationContext = createContext<ApplicationContextType | null>(null)

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const { db, userId } = useAppContext()
  const [applications, setApplications] = useState<Application[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const refreshApplications = useCallback(async () => {
    setApplications(await getApplications(db, userId))
    setHasLoaded(true)
  }, [db, userId])

  useEffect(() => {
    refreshApplications()
  }, [refreshApplications])

  const getByUserSunscreenId = useCallback(
    (userSunscreenId: number) =>
      applications.filter((a) => a.user_sunscreen_id === userSunscreenId),
    [applications]
  )

  const addApplication = useCallback(
    async (application: InsertApplication) => {
      const id = await insertApplication(db, application)
      await refreshApplications()

      return id
    },
    [db, refreshApplications]
  )

  const value = useMemo(
    () => ({
      applications,
      hasLoaded,
      refreshApplications,
      getByUserSunscreenId,
      addApplication,
    }),
    [applications, hasLoaded, refreshApplications, getByUserSunscreenId, addApplication]
  )

  return (
    <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>
  )
}

export function useApplications() {
  const ctx = useContext(ApplicationContext)

  if (!ctx) throw new Error('useApplications must be used within ApplicationProvider')

  return ctx
}
