import {
  commitUserSunscreenImage,
  editUserSunscreen,
  getActiveUserSunscreens,
  getUserSunscreens,
  InsertUserSunscreen,
  insertUserSunscreen,
  setUserSunscreenArchive,
  setUserSunscreenCardBorderOpacity,
  setUserSunscreenCardGradientOpacity,
  setUserSunscreenFavorite,
  SortDirection,
  SortOptions,
  sortUserSunscreens,
  UserSunscreen,
} from '@/lib/userSunscreen'
import { SQLiteDatabase } from 'expo-sqlite'
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

function useBooleanFieldToggle(
  db: SQLiteDatabase,
  refreshUserSunscreens: () => Promise<void>,
  latestSunscreens: React.RefObject<UserSunscreen[]>,
  getField: (sunscreen: UserSunscreen) => number,
  setField: (db: SQLiteDatabase, id: number, value: 0 | 1) => Promise<unknown>,
  label: string
) {
  const isToggling = useRef(false)

  return useCallback(
    async (id: number) => {
      if (isToggling.current) return
      isToggling.current = true

      try {
        const current = latestSunscreens.current.find((s) => s.id === id)
        if (!current) return

        await setField(db, id, getField(current) === 0 ? 1 : 0)
        await refreshUserSunscreens()
      } catch (error) {
        console.error(
          `Failed To Toggle ${label}: ${error instanceof Error ? error.message : String(error)}`
        )
      } finally {
        isToggling.current = false
      }
    },
    [db, refreshUserSunscreens, getField, setField, label]
  )
}

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
  toggleCardBorder: (id: number) => Promise<void>
  toggleCardGradient: (id: number) => Promise<void>
  archiveUserSunscreen: (id: number) => Promise<void>
  duplicateSunscreen: (sunscreen: UserSunscreen | InsertUserSunscreen) => Promise<number>
}

const UserSunscreenContext = createContext<UserSunscreenContextType | null>(null)

export function UserSunscreenProvider({ children }: { children: ReactNode }) {
  const { db, userId } = useAppContext()
  const [userSunscreens, setUserSunscreens] = useState<UserSunscreen[]>([])
  const [allUserSunscreens, setAllUserSunscreens] = useState<UserSunscreen[]>([])
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
    setAllUserSunscreens(await getUserSunscreens(db))
    setHasLoaded(true)
  }, [db, userId])

  useEffect(() => {
    refreshUserSunscreens()
  }, [refreshUserSunscreens])

  const getById = useCallback(
    (id: string | number) => allUserSunscreens.find((s) => String(s.id) === String(id)),
    [allUserSunscreens]
  )

  const latestSunscreens = useRef(userSunscreens)
  latestSunscreens.current = userSunscreens

  const toggleFavorite = useBooleanFieldToggle(
    db,
    refreshUserSunscreens,
    latestSunscreens,
    (s) => s.is_favorite,
    setUserSunscreenFavorite,
    'Favorite'
  )

  const toggleCardBorder = useBooleanFieldToggle(
    db,
    refreshUserSunscreens,
    latestSunscreens,
    (s) => s.card_border_opacity,
    setUserSunscreenCardBorderOpacity,
    'Card Border'
  )

  const toggleCardGradient = useBooleanFieldToggle(
    db,
    refreshUserSunscreens,
    latestSunscreens,
    (s) => s.card_gradient_opacity,
    setUserSunscreenCardGradientOpacity,
    'Card Gradient'
  )

  const archiveUserSunscreen = useCallback(
    async (id: number) => {
      await setUserSunscreenArchive(db, id, 1)
      await refreshUserSunscreens()
    },
    [db, refreshUserSunscreens]
  )

  const duplicateSunscreen = useCallback(
    async (sunscreen: UserSunscreen | InsertUserSunscreen) => {
      let insertSunscreen: InsertUserSunscreen = sunscreen
      let dest: [string | null, string | null] = [null, null]

      if ('id' in sunscreen) {
        const { id, is_archived, created_at, updated_at, synced_at, ...leftover } =
          sunscreen
        insertSunscreen = leftover
      }

      const dupeId = await insertUserSunscreen(db, {
        ...insertSunscreen,
        user_id: userId,
        cover_uri: null,
        image_uri: null,
      })

      if (sunscreen.cover_uri)
        dest[0] = await commitUserSunscreenImage(
          dupeId,
          sunscreen.cover_uri.split('?')[0],
          'cover',
          1
        )

      if (sunscreen.image_uri)
        dest[1] = await commitUserSunscreenImage(
          dupeId,
          sunscreen.image_uri.split('?')[0],
          'product',
          1
        )

      await editUserSunscreen(db, dupeId, {
        ...insertSunscreen,
        user_id: userId,
        cover_uri: dest[0],
        image_uri: dest[1],
      })
      await refreshUserSunscreens()

      return dupeId
    },
    [db, userId, insertUserSunscreen, refreshUserSunscreens]
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
      toggleCardBorder,
      toggleCardGradient,
      archiveUserSunscreen,
      duplicateSunscreen,
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
      toggleCardBorder,
      toggleCardGradient,
      archiveUserSunscreen,
      duplicateSunscreen,
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
