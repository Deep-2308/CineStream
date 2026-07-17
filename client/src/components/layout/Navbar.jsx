import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useScroll } from '../../hooks/useScroll.js';
import { useAuthStore } from '../../store/authStore.js';
import { cn } from '../../lib/utils.js';
import Button from '../ui/Button.jsx';
import AskCineStream from '../../features/askCineStream/AskCineStream.jsx';

export default function Navbar() {
  const scrolled = useScroll(20);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Originals', to: '/originals' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out',
        scrolled ? 'bg-surface/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary" aria-label="CineStream home">
          CineStream
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-txt-muted transition-colors hover:text-txt"
            >
              {link.label}
            </Link>
          ))}

          <button
            onClick={() => navigate('/search')}
            className="rounded-full p-2 text-txt-muted transition-colors hover:bg-surface hover:text-txt"
            aria-label="Search movies"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={() => setAskOpen(true)}
            className="rounded-full p-2 text-primary transition-colors hover:bg-surface flex items-center gap-2 font-medium"
            aria-label="Ask CineStream"
          >
            <Sparkles className="h-5 w-5 fill-primary" />
            <span className="text-sm">Ask AI</span>
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/watchlist"
                className="text-sm font-medium text-txt-muted transition-colors hover:text-txt"
              >
                Watchlist
              </Link>
              <span className="text-sm text-txt-muted">{user?.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="rounded-lg p-2 text-txt-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-surface bg-background px-4 pb-4 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block py-3 text-sm font-medium text-txt-muted hover:text-txt"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/search"
            className="block py-3 text-sm font-medium text-txt-muted hover:text-txt"
            onClick={() => setMobileOpen(false)}
          >
            Search
          </Link>
          <button
            onClick={() => { setAskOpen(true); setMobileOpen(false); }}
            className="w-full text-left py-3 text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 fill-primary" />
            Ask AI
          </button>
          {isAuthenticated ? (
            <>
              <Link
                to="/watchlist"
                className="block py-3 text-sm font-medium text-txt-muted hover:text-txt"
                onClick={() => setMobileOpen(false)}
              >
                Watchlist
              </Link>
            </>
          ) : (
            <div className="flex gap-2 pt-3">
              <Button variant="ghost" size="sm" onClick={() => { navigate('/login'); setMobileOpen(false); }}>
                Log In
              </Button>
              <Button variant="primary" size="sm" onClick={() => { navigate('/signup'); setMobileOpen(false); }}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Slide-over UI */}
      <AskCineStream isOpen={askOpen} onClose={() => setAskOpen(false)} />
    </nav>
  );
}
