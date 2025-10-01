import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Always get fresh session from Supabase
      const { data: { user } } = await supabase.auth.getUser();

      // If session exists AND token is valid, user is logged in
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Subscribe to login/logout changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  // Force login if no user or ephemeral session
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
