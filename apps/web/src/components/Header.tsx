import { ArrowRightLeft, BookOpen, Library, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <BookOpen className="h-5 w-5" />
          BookShare
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/browse"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <BookOpen className="h-4 w-4" />
                Browse
              </Link>
              <Link
                to="/my-library"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <Library className="h-4 w-4" />
                My Library
              </Link>
              <Link
                to="/requests"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Requests
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <ThemeToggle />
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/signin" className="text-sm text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
