import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function EditChurch() {
  const { churchName } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChurch = async () => {
      const { data, error } = await supabase.from("church").select("*").eq("church_name", churchName).single();
      if (error) alert(error.message);
      else setFormData(data);
      setLoading(false);
    };
    fetchChurch();
  }, [churchName]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("church").update(formData).eq("church_name", churchName);
    setLoading(false);
    if (error) alert(error.message);
    else navigate("/home");
  };

  if (loading) return <p>Loading church data...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Church</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="church_name" placeholder="Church Name" value={formData.church_name || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="physical_city" placeholder="City" value={formData.physical_city || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="physical_state" placeholder="State" value={formData.physical_state || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="phone_number" placeholder="Phone" value={formData.phone_number || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
