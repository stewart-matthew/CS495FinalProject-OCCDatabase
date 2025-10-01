import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/OCClogo.png";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user session on load
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // Subscribe to auth changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
      <div className="flex items-center">
        <img src={logo} alt="App Logo" className="h-10 w-auto mr-3" />
        <span className="text-2xl font-bold">Operation Christmas Child</span>
      </div>

      <div className="flex space-x-6">
        {!user ? (
          <Link to="/login" className="hover:text-gray-300">Login</Link>
        ) : (
          <>
            <Link to="/" className="hover:text-gray-300">Home</Link>
            <Link to="/about" className="hover:text-gray-300">About</Link>
            <Link to="/profile" className="hover:text-gray-300">Profile</Link>
          </>
        )}
      </div>
    </nav>
  );
}
