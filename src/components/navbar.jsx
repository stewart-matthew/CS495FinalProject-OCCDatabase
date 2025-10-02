import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import logo from "../assets/OCClogo.png";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null); // store team_members info
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // fetch matching team_members row
        const { data } = await supabase
          .from("team_members")
          .select("*")
          .eq("email", user.email)
          .single();
        setMember(data);
      } else {
        setMember(null);
      }
    };
    getUser();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        supabase
          .from("team_members")
          .select("*")
          .eq("email", currentUser.email)
          .single()
          .then(({ data }) => setMember(data));
      } else {
        setMember(null);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMember(null);
    navigate("/login");
  };

  const hideLinks = location.pathname === "/login";

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-gray-800 text-white shadow-md">
      <div className="flex items-center">
        <img src={logo} alt="App Logo" className="h-10 w-auto mr-3" />
        <span className="text-2xl font-bold">Operation Christmas Child</span>
      </div>

      {!hideLinks && (
        <div className="flex space-x-6">
          {!user ? (
            <Link to="/login" className="hover:text-gray-300">Login</Link>
          ) : (
            <>
              <Link to="/" className="hover:text-gray-300">Home</Link>
              <Link to="/about" className="hover:text-gray-300">About</Link>
              <Link to="/profile" className="hover:text-gray-300">Profile</Link>
              <Link to="/team-members" className="hover:text-gray-300">Team Members</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
