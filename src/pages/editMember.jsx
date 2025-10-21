import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      const { data, error } = await supabase.from("team_members").select("*").eq("id", id).single();
      if (error) alert(error.message);
      else setFormData(data);
      setLoading(false);
    };
    fetchMember();
  }, [id]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("team_members").update(formData).eq("id", id);
    setLoading(false);
    if (error) alert(error.message);
    else navigate("/team-members");
  };

  if (loading) return <p>Loading member data...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Team Member</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="first_name" placeholder="First Name" value={formData.first_name || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="last_name" placeholder="Last Name" value={formData.last_name || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="email" type="email" placeholder="Email" value={formData.email || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="phone_number" placeholder="Phone Number" value={formData.phone_number || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
