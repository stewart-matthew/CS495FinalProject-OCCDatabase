// src/pages/profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [position, setPosition] = useState(""); // default empty string
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Get team_member info
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", user.email)
        .single();

      if (!memberError) setMemberData(member);

      // Get position info from member_positions
      const { data: pos, error: posError } = await supabase
        .from("member_positions")
        .select("position")
        .eq("member_id", member.id)
        .single();

      if (!posError && pos) setPosition(pos.position);
    };
    getUserAndData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {user && memberData ? (
        <>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {memberData.first_name} {memberData.last_name}</p>
          <p><strong>Position:</strong> {position || "N/A"}</p>

          <Link
            to="/editProfile"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Information
          </Link>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
