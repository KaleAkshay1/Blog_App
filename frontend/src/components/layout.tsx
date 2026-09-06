import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Search,
  PenLine,
  ArrowUpRight,
  Menu,
  X,
  Bookmark,
  LogOut,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/auth-dialog'
import { Avatar } from '@/components/story-card'
import { useAuth } from '@/context/auth'
import { cn } from '@/lib/utils'

export function WriteButton({
  className,
  label = 'Start writing',
}: {
  className?: string
  label?: string
}) {
  const { user, openAuth } = useAuth()
  const navigate = useNavigate()
  return (
    <Button
      className={className}
      onClick={() => (user ? navigate('/write') : openAuth('register', '/write'))}
    >
      <PenLine />
      {label}
    </Button>
  )
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Story home"
      className={cn('inline-flex items-center gap-2.5 text-primary', light && 'text-white')}
    >
      <BookOpen size={29} strokeWidth={1.65} />
      <span className="font-serif text-[34px] font-semibold leading-none tracking-[-0.07em]">
        story<span className="text-[#92a76c]">.</span>
      </span>
    </Link>
  )
}
export function Layout() {
  const { user, logout, openAuth } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [menuOpen])
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('search')?.toString().trim() || ''
    navigate(`/?search=${encodeURIComponent(value)}`)
    setSearchOpen(false)
    setMobileOpen(false)
    setTimeout(
      () => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' }),
      100,
    )
  }
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:p-3 focus:text-white"
      >
        Skip to content
      </a>
      <header className="site-header">
        <div className="page-shell flex h-[84px] items-center justify-between gap-5">
          <Logo />
          <nav
            aria-label="Main navigation"
            className="desktop-nav flex items-center gap-8 text-[13px] font-medium"
          >
            <NavLink to="/" end>
              Discover
            </NavLink>
            <NavLink to="/topics">Topics</NavLink>
            <NavLink to="/about">
              Our story <ArrowUpRight className="inline size-3.5" />
            </NavLink>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search stories"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="!size-[19px]" strokeWidth={1.6} />
            </Button>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  className="flex items-center gap-1.5 rounded-full focus-visible:outline-2 focus-visible:outline-primary"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Open account menu"
                  aria-expanded={menuOpen}
                >
                  <Avatar author={user} className="size-9" />
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border bg-background p-2 shadow-lg">
                    <div className="mb-1 border-b px-3 py-2">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Link className="menu-item" to="/dashboard" onClick={() => setMenuOpen(false)}>
                      <FileText />
                      My stories
                    </Link>
                    <Link className="menu-item" to="/saved" onClick={() => setMenuOpen(false)}>
                      <Bookmark />
                      Reading list
                    </Link>
                    <button
                      className="menu-item w-full"
                      onClick={() => {
                        void logout()
                        setMenuOpen(false)
                      }}
                    >
                      <LogOut />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="hidden text-[13px] font-medium hover:text-primary sm:block"
                onClick={() => openAuth('login')}
              >
                Sign in
              </button>
            )}
            <WriteButton className="hidden h-10 px-4 text-xs sm:inline-flex" />
            <Button
              className="mobile-toggle"
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={search} className="page-shell flex items-center gap-3 pb-5">
            <Search className="size-5 text-muted-foreground" />
            <input
              autoFocus
              name="search"
              type="search"
              maxLength={100}
              aria-label="Search by title or topic"
              placeholder="What are you curious about?"
              className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        )}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="page-shell flex flex-col gap-4 border-t py-5 text-sm"
          >
            <Link to="/">Discover</Link>
            <Link to="/topics">Topics</Link>
            <Link to="/about">Our story</Link>
            {!user && (
              <button
                className="text-left"
                onClick={() => {
                  openAuth('login')
                  setMobileOpen(false)
                }}
              >
                Sign in
              </button>
            )}
            <WriteButton className="w-fit" />
          </nav>
        )}
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="page-shell">
          <div className="flex flex-col justify-between gap-8 pb-9 sm:flex-row">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                A home for good stories.
                <br />
                And the people behind them.
              </p>
            </div>
            <div className="flex gap-12 text-sm">
              <div className="space-y-3">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Explore
                </p>
                <Link className="block hover:text-primary" to="/">
                  Discover stories
                </Link>
                <Link className="block hover:text-primary" to="/topics">
                  Browse topics
                </Link>
              </div>
              <div className="space-y-3">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Make yourself at home
                </p>
                <Link className="block hover:text-primary" to="/about">
                  Our story
                </Link>
                <button
                  className="block hover:text-primary"
                  onClick={() => (user ? navigate('/write') : openAuth('register', '/write'))}
                >
                  Become a writer <ArrowUpRight className="ml-1 inline size-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3 border-t pt-5 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Story. Made for the curious.</p>
            <p className="flex items-center gap-1.5">
              A little less noise. A little more meaning.
              <span className="ml-1 text-primary">✳</span>
            </p>
          </div>
        </div>
      </footer>
      <AuthDialog />
    </>
  )
}
