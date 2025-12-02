import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/OCClogo.png";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const hideLinks = ["/login", "/reset-password"].includes(location.pathname);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center min-w-0 flex-1">
          <img src={logo} alt="App Logo" className="h-8 md:h-10 w-auto mr-2 md:mr-3 flex-shrink-0" />
          <span className="text-base md:text-xl lg:text-2xl font-bold truncate">
            <span className="hidden sm:inline">Operation Christmas Child - </span>
            <span>West Alabama</span>
          </span>
        </div>

        {!hideLinks && (
          <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              {!user ? (
                <Link to="/login" className="hover:text-gray-300">Login</Link>
              ) : (
                <>
                  <Link to="/" className="hover:text-gray-300">Home</Link>
                  <Link to="/team-members" className="hover:text-gray-300">Team Members</Link>
                  <Link to="/individuals" className="hover:text-gray-300">Individuals</Link>
                  <Link to="/about" className="hover:text-gray-300">About</Link>
                  <Link to="/profile" className="hover:text-gray-300">Profile</Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-gray-700 rounded"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {!hideLinks && isMenuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-gray-800">
          <div className="px-4 py-2 space-y-2">
            {!user ? (
              <Link to="/login" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Login</Link>
            ) : (
              <>
                <Link to="/" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link to="/team-members" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Team Members</Link>
                <Link to="/individuals" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Individuals</Link>
                <Link to="/about" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>About</Link>
                <Link to="/profile" className="block py-2 hover:text-gray-300" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
