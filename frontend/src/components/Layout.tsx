import { useState } from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  Leaf,
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
        <Leaf size={24} strokeWidth={1.8} />
      </span>
      <span>
        Vocab<span className="brand-light">Mate</span>
        <small>Little words. Lasting progress.</small>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const current = navigation.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )

  return (
    <div className="app-layout">
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            type="button"
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={22} />
          </button>
        </div>
        <p className="nav-caption">YOUR LEARNING SPACE</p>
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
            A little practice,
            <br />
            <strong>a little more confidence.</strong>
          </p>
          <span>Your vocabulary grows with you.</span>
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
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
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
            <span /> Made for your pace
          </span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          VocabMate <span>Build your vocabulary, one word at a time.</span>
        </footer>
      </div>
    </div>
  )
}
