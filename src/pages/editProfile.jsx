// src/pages/editProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [positions, setPositions] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // we are tracking if user is admin but false but default
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserAndData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate("/login");
        return;
      }
      setUser(authUser);

      // Fetch team_member info
      const { data: member , error:memberError} = await supabase
        .from("team_members")
        .select("*")
        .eq("email", authUser.email)
        .single();

        if (memberError || !member) {
        console.error(memberError);
        setLoading(false);
        return;
      }
      setFormData(member || {});

      // Fetch member's current position
      const { data: memberPosRows, error: mpErr } = await supabase
        .from("member_positions")
        .select("position")
        .eq("member_id", member.id);

      if (mpErr) {
        console.error(mpErr);
        setSelectedPositions([]);
      } else {
        setSelectedPositions((memberPosRows || []).map(r => r.position));
      }

      // Fetch all possible positions
      const { data: allPositions, error: posErr } = await supabase
        .from("positions")
        .select("code");
      // setPositions(allPositions ? allPositions.map(p => p.code) : []);
      if (posErr){
        console.error(posErr)
        setPositions([]);
      } else {
        setPositions((allPositions || []).map(p => p.code));
      }

      setLoading(false);
    };

    getUserAndData();
  }, [navigate]);

    useEffect(() => {
      setIsAdmin(selectedPositions.includes("Admin")); // adjust literal if your code differs
    }, [selectedPositions]);
  
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePositionsChange = (e) => {
    const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
    setSelectedPositions(values);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !formData?.id) return;

    // Update team_members table
    {
    const { error } = await supabase
      .from("team_members")
      .update({
        first_name: formData.first_name ?? null,
        last_name: formData.last_name ?? null,
        shirt_size: formData.shirt_size ?? null,
      })
      .eq("id", formData.id);

      if (error) {
        console.error("Update team_members failed:", error);
        // (optional) show a toast / message to user
      }
    }

    // Update member_positions only if admin
    if (isAdmin) {
      // Fetch current rows again to avoid drift
      const { data: currentRows, error: curErr } = await supabase
        .from("member_positions")
        .select("position")
        .eq("member_id", formData.id);

      if (curErr) {
        console.error("Read member_positions failed:", curErr);
      } else {
        const current = new Set((currentRows || []).map(r => r.position));
        const desired = new Set(selectedPositions);

        // compute diffs
        const toAdd = [...desired].filter(p => !current.has(p));
        const toRemove = [...current].filter(p => !desired.has(p));

        // Insert new rows
        if (toAdd.length > 0) {
          const { error: insErr } = await supabase
            .from("member_positions")
            .insert(toAdd.map(p => ({ member_id: formData.id, position: p })));
          if (insErr) console.error("Insert member_positions failed:", insErr);
        }

        // Delete removed rows
        if (toRemove.length > 0) {
          const { error: delErr } = await supabase
            .from("member_positions")
            .delete()
            .eq("member_id", formData.id)
            .in("position", toRemove);
          if (delErr) console.error("Delete member_positions failed:", delErr);
        }
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
        <label className="block text-sm font-medium">Positions (hold Ctrl/Cmd to multi-select)</label>
        <select
          multiple
          value={selectedPositions}
          onChange={handlePositionsChange}
          className="w-full border px-3 py-2 rounded h-40"
          disabled={!isAdmin}
        >
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
