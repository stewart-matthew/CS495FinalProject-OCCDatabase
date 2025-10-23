import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddMember() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    church_affiliation_name: "",
    church_affiliation_city: "",
    active: true,
    admin_flag: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.from("team_members").insert([
      {
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error(error);
      setError("Error adding member. Please try again.");
    } else {
      navigate("/team-members");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Add Team Member</h1>
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            className="border rounded-lg p-2"
            required
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            className="border rounded-lg p-2"
            required
          />
        </div>
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
          required
        />
        <input
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <input
          name="church_affiliation_name"
          placeholder="Church Name"
          value={formData.church_affiliation_name}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <input
          name="church_affiliation_city"
          placeholder="Church City"
          value={formData.church_affiliation_city}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="admin_flag"
            checked={formData.admin_flag}
            onChange={handleChange}
          />
          <span>Admin?</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          {loading ? "Adding..." : "Add Member"}
        </button>
      </form>
    </div>
  );
}
