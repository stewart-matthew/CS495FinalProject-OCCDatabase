// src/pages/editChurch.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function EditChurch() {
  const { churchName } = useParams();
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChurch = async () => {
      const { data, error } = await supabase
        .from("church")
        .select("*")
        .eq("church_name", churchName)
        .single();

      if (data) setFormData(data);
      if (error) console.error(error);
    };

    fetchChurch();
  }, [churchName]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from("church")
      .update(formData)
      .eq("church_name", churchName);

    if (error) {
      console.error("Error updating church:", error);
      return;
    }

    navigate(`/church/${encodeURIComponent(churchName)}`);
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Church</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="church_name"
          placeholder="Church Name"
          value={formData.church_name || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_city"
          placeholder="City"
          value={formData.physical_city || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_state"
          placeholder="State"
          value={formData.physical_state || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_zip"
          placeholder="Zip Code"
          value={formData.physical_zip || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="physical_county"
          placeholder="County"
          value={formData.physical_county || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="number"
          name="shoebox_2025"
          placeholder="Shoebox 2025 Count"
          value={formData.shoebox_2025 || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
