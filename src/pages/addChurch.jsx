import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddChurch() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    church_name: "",
    physical_city: "",
    physical_state: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("church").insert([formData]);
    setLoading(false);
    if (error) alert(error.message);
    else navigate("/home");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add Church</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="church_name" placeholder="Church Name" value={formData.church_name} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="physical_city" placeholder="City" value={formData.physical_city} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="physical_state" placeholder="State" value={formData.physical_state} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <input name="phone_number" placeholder="Phone" value={formData.phone_number} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {loading ? "Adding..." : "Add Church"}
        </button>
      </form>
    </div>
  );
}
