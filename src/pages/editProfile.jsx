// src/pages/editProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [positions, setPositions] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // track if current user is admin
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);

      // Fetch team_member info
      const { data: member } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", user.email)
        .single();
      setFormData(member || {});

      // Fetch member's current position
      const { data: memberPos } = await supabase
        .from("member_positions")
        .select("position")
        .eq("member_id", member.id)
        .single();

      if (memberPos) {
        setSelectedPosition(memberPos.position);
        if (memberPos.position === "Admin") setIsAdmin(true);
      }

      // Fetch all possible positions
      const { data: allPositions } = await supabase
        .from("positions")
        .select("code");
      setPositions(allPositions ? allPositions.map(p => p.code) : []);

      setLoading(false);
    };

    getUserAndData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Update team_members table
    await supabase
      .from("team_members")
      .update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        shirt_size: formData.shirt_size
      })
      .eq("email", user.email);

    // Update member_positions only if admin
    if (isAdmin && selectedPosition) {
      const { data: existing } = await supabase
        .from("member_positions")
        .select("id")
        .eq("member_id", formData.id)
        .single();

      if (!existing) {
        await supabase.from("member_positions").insert({
          member_id: formData.id,
          position: selectedPosition
        });
      } else {
        await supabase.from("member_positions")
          .update({ position: selectedPosition })
          .eq("member_id", formData.id);
      }
    }

    navigate("/profile");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="first_name"
          value={formData.first_name || ""}
          onChange={handleChange}
          placeholder="First Name"
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="last_name"
          value={formData.last_name || ""}
          onChange={handleChange}
          placeholder="Last Name"
          className="w-full border px-3 py-2 rounded"
        />
        <select
          name="shirt_size"
          value={formData.shirt_size || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Select Shirt Size</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="2XL">2XL</option>
          <option value="3XL">3XL</option>
        </select>
        <select
          value={selectedPosition || ""}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          disabled={!isAdmin} // only editable if admin
        >
          <option value="">Select Position</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
