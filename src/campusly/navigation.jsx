import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createId } from './createId'

const NavigationContext = createContext(null)
const STATE_KEY = 'skillaiNavigation'
const initialView = () => ({ page: 'dashboard', mobileOpen: false, search: '' })

// Keep the router's own history state intact; portal steps share its existing URL.
export function PortalNavigation({ children }) {
  const stored = window.history.state?.[STATE_KEY]
  const session = useRef(null)
  if (session.current === null) session.current = stored?.session || createId()
  const [view, setView] = useState(() => stored?.view || initialView())
  const current = useRef(view)
  const navigationGuards = useRef(new Set())
  const registerNavigationGuard = useCallback(guard => {
    navigationGuards.current.add(guard)
    return () => navigationGuards.current.delete(guard)
  }, [])
  const confirmNavigation = useCallback(() => {
    for (const guard of navigationGuards.current) {
      if (!guard()) return false
    }
    return true
  }, [])
  const write = useCallback((next, replace = false, skipGuard = false) => {
    if (!skipGuard && !confirmNavigation()) return false
    current.current = next
    setView(next)
    window.history[replace ? 'replaceState' : 'pushState'](
      { ...window.history.state, [STATE_KEY]: { session: session.current, view: next } },
      '', window.location.href,
    )
    return true
  }, [confirmNavigation])

  useEffect(() => {
    write(current.current, true, true)
    const onPop = event => {
      const entry = event.state?.[STATE_KEY]
      const leavesCurrentPage = !entry || entry.session !== session.current ||
        entry.view?.page !== current.current.page ||
        entry.view?.search !== current.current.search
      if (leavesCurrentPage && !confirmNavigation()) {
        window.history.pushState(
          { ...window.history.state, [STATE_KEY]: { session: session.current, view: current.current } },
          '', window.location.href,
        )
        return
      }
      if (entry?.session !== session.current) {
        write(initialView(), true, true)
        return
      }
      current.current = entry.view
      setView(entry.view)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [confirmNavigation, write])

  const change = useCallback((key, value, fallback) => {
    const prev = current.current
    const before = prev[key] ?? fallback
    const next = typeof value === 'function' ? value(before) : value
    if (Object.is(before, next)) return
    const requiresGuard = key === 'page' || (key === 'search' && Boolean(next))
    if (requiresGuard && !confirmNavigation()) return
    if (key === 'page') {
      // Choosing a destination replaces its open menu/search step.
      write({ ...initialView(), page: next }, Boolean(prev.mobileOpen || prev.search), true)
    } else if ((next === fallback || !next) && before) {
      // Explicit Close and phone Back consume the very same step.
      window.history.back()
    } else {
      write({ ...prev, [key]: next }, key === 'search' && Boolean(before), true)
    }
  }, [confirmNavigation, write])

  const reset = useCallback(() => {
    session.current = createId()
    write(initialView(), true, true)
  }, [write])

  return <NavigationContext.Provider value={{ view, change, reset, registerNavigationGuard, confirmNavigation }}>{children}</NavigationContext.Provider>
}

export function usePortalState(key, fallback) {
  const navigation = useContext(NavigationContext)
  if (!navigation) throw new Error('PortalNavigation is required')
  const setValue = useCallback(value => navigation.change(key, value, fallback), [navigation.change, key, fallback])
  return [navigation.view[key] ?? fallback, setValue]
}

export function useResetNavigation() {
  const navigation = useContext(NavigationContext)
  if (!navigation) throw new Error('PortalNavigation is required')
  return navigation.reset
}

export function usePortalNavigationGuard() {
  const navigation = useContext(NavigationContext)
  if (!navigation) throw new Error('PortalNavigation is required')
  return {
    confirmNavigation: navigation.confirmNavigation,
    registerNavigationGuard: navigation.registerNavigationGuard,
  }
}