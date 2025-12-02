import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/OCClogo.png";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
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
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
      <div className="flex items-center">
        <img src={logo} alt="App Logo" className="h-10 w-auto mr-3" />
        <span className="text-2xl font-bold">Operation Christmas Child - West Alabama</span>
      </div>

      {!hideLinks && (
        <div className="flex space-x-6">
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
      )}
    </nav>
  );
}
