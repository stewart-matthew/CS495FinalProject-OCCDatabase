// src/pages/addChurch.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddChurch() {
  const [formData, setFormData] = useState({
    church_name: "",
    physical_city: "",
    physical_state: "",
    physical_zip: "",
    physical_county: "",
    phone_number: "",
    shoebox_2025: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Insert new church
    const { error } = await supabase.from("church").insert([formData]);

    if (error) {
      console.error("Error adding church:", error);
      return;
    }

    navigate("/home");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add Church</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="church_name"
          placeholder="Church Name"
          value={formData.church_name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_city"
          placeholder="City"
          value={formData.physical_city}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_state"
          placeholder="State"
          value={formData.physical_state}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          name="physical_zip"
          placeholder="Zip Code"
          value={formData.physical_zip}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="physical_county"
          placeholder="County"
          value={formData.physical_county}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="number"
          name="shoebox_2025"
          placeholder="Shoebox 2025 Count"
          value={formData.shoebox_2025}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Church
        </button>
      </form>
    </div>
  );
}
