import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/OCClogo.png";

export default function Navbar() {
  const [user, setUser] = useState(null);

  // Track user session
  useEffect(() => {
    // Get current user
    const sessionUser = supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
      <div className="flex items-center">
        <img src={logo} alt="App Logo" className="h-10 w-auto mr-3" />
        <span className="text-2xl font-bold">Operation Christmas Child</span>
      </div>

      <div className="flex space-x-6">
        <Link to="/" className="hover:text-gray-300">
          Home
        </Link>
        <Link to="/about" className="hover:text-gray-300">
          About
        </Link>

        {user ? (
          <>
            <Link to="/profile" className="hover:text-gray-300">
              Profile
            </Link>
          </>
        ) : (
          <Link to="/login" className="hover:text-gray-300">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
