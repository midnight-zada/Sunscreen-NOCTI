import {
  getActiveUserSunscreens,
  setUserSunscreenArchive,
  setUserSunscreenFavorite,
  SortDirection,
  SortOptions,
  sortUserSunscreens,
  UserSunscreen,
} from '@/lib/userSunscreen'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAppContext } from './AppContext'

export type UserSunscreenContextType = {
  userSunscreenList: UserSunscreen[]
  hasLoaded: boolean
  sortOption: SortOptions
  setSortOption: (sortOption: SortOptions) => void
  sortDirection: SortDirection
  toggleSortDirection: () => void
  getById: (id: string | number) => UserSunscreen | undefined
  refreshUserSunscreens: () => Promise<void>
  toggleFavorite: (id: number) => Promise<void>
  archiveUserSunscreen: (id: number) => Promise<void>
}

const UserSunscreenContext = createContext<UserSunscreenContextType | null>(null)

export function UserSunscreenProvider({ children }: { children: ReactNode }) {
  const { db, userId } = useAppContext()
  const [userSunscreens, setUserSunscreens] = useState<UserSunscreen[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [sortOption, setSortOption] = useState<SortOptions>('favorites')
  const [sortDirection, setSortDirection] = useState<SortDirection>('default')

  const toggleSortDirection = useCallback(() => {
    setSortDirection((current) => (current === 'default' ? 'reversed' : 'default'))
  }, [])

  const userSunscreenList = useMemo(
    () => sortUserSunscreens(userSunscreens, sortOption, sortDirection),
    [userSunscreens, sortOption, sortDirection]
  )

  const refreshUserSunscreens = useCallback(async () => {
    setUserSunscreens(await getActiveUserSunscreens(db))
    setHasLoaded(true)
  }, [db, userId])

  useEffect(() => {
    refreshUserSunscreens()
  }, [refreshUserSunscreens])

  const getById = useCallback(
    (id: string | number) => userSunscreens.find((s) => String(s.id) === String(id)),
    [userSunscreens]
  )

  const latestSunscreens = useRef(userSunscreens)
  latestSunscreens.current = userSunscreens
  const isToggling = useRef(false)

  const toggleFavorite = useCallback(
    async (id: number) => {
      if (isToggling.current) return
      isToggling.current = true

      try {
        const current = latestSunscreens.current.find((s) => s.id === id)
        if (!current) return

        await setUserSunscreenFavorite(db, id, current.is_favorite === 1 ? 0 : 1)
        await refreshUserSunscreens()
      } catch (error) {
        console.error(
          `Failed To Toggle Favorite: ${error instanceof Error ? error.message : String(error)}`
        )
      } finally {
        isToggling.current = false
      }
    },
    [db, refreshUserSunscreens]
  )

  const archiveUserSunscreen = useCallback(
    async (id: number) => {
      await setUserSunscreenArchive(db, id, 1)
      await refreshUserSunscreens()
    },
    [db, refreshUserSunscreens]
  )

  const value = useMemo(
    () => ({
      userSunscreenList,
      hasLoaded,
      sortOption,
      setSortOption,
      sortDirection,
      toggleSortDirection,
      getById,
      refreshUserSunscreens,
      toggleFavorite,
      archiveUserSunscreen,
    }),
    [
      userSunscreenList,
      hasLoaded,
      sortOption,
      sortDirection,
      toggleSortDirection,
      getById,
      refreshUserSunscreens,
      toggleFavorite,
      archiveUserSunscreen,
    ]
  )

  return (
    <UserSunscreenContext.Provider value={value}>
      {children}
    </UserSunscreenContext.Provider>
  )
}

export function useUserSunscreens() {
  const ctx = useContext(UserSunscreenContext)

  if (!ctx) throw new Error('useUserSunscreens must be used within UserSunscreenProvider')

  return ctx
}
