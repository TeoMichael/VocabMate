import { useEffect, useRef, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  BookHeart,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Heart,
  LogOut,
  Menu,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/vocabulary', label: 'My vocabulary', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: GraduationCap },
  { to: '/weak-words', label: 'Words to review', icon: Target },
  { to: '/weekly-review', label: 'Weekly review', icon: CalendarDays },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
]

export function Brand() {
  return (
    <Link className="brand" to="/" aria-label="VocabMate home">
      <span className="brand-mark">
        <BookHeart size={24} strokeWidth={1.8} />
      </span>
      <span>
        Vocab<span className="brand-light">Mate</span>
        <small>Your little learning corner</small>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const location = useLocation()
  const current = navigation.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 781px)')
    function onViewportChange(event: MediaQueryListEvent) {
      if (event.matches) setMobileOpen(false)
    }
    desktop.addEventListener('change', onViewportChange)
    return () => desktop.removeEventListener('change', onViewportChange)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const menuControl = menuRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
      if (event.key !== 'Tab') return
      const controls = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [],
      ).filter((element) => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
      if (menuControl?.getClientRects().length) menuControl.focus()
    }
  }, [mobileOpen])

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to learning content
      </a>
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        id="learning-navigation"
        className={`sidebar ${mobileOpen ? 'is-open' : ''}`}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen || undefined}
        aria-label="Learning navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            ref={closeRef}
            type="button"
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <p className="nav-caption">YOUR LEARNING CORNER</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{label}</span>
              <ChevronRight className="nav-chevron" size={14} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sparkles size={20} />
          <p>
            A few words today,
            <br />
            <strong>a little more sparkle.</strong>
          </p>
          <span>Keep going. You’re doing lovely.</span>
        </div>
        <div className="sidebar-account">
          <div className="avatar">{user?.name.slice(0, 1).toUpperCase()}</div>
          <div className="account-name">
            <strong>{user?.name}</strong>
            <span>Personal learning space</span>
          </div>
          <button
            type="button"
            className="icon-button logout-button"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>
      <div className="main-area" inert={mobileOpen}>
        <header className="topbar">
          <div className="topbar-left">
            <button
              ref={menuRef}
              type="button"
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="learning-navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Your space <ChevronRight size={13} />{' '}
              <strong>{current?.label || 'Vocabulary'}</strong>
            </span>
          </div>
          <span className="topbar-tag">
            <Heart size={13} /> Made for your pace
          </span>
        </header>
        <main id="main-content" tabIndex={-1} className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          VocabMate <span>Build your vocabulary, one word at a time.</span>
        </footer>
      </div>
    </div>
  )
}
