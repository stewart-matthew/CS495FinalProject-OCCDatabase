// src/pages/addMember.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddMember() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    alt_phone_number: "",
    home_address: "",
    home_city: "",
    home_state: "",
    home_zip: "",
    home_county: "",
    date_of_birth: "",
    shirt_size: "",
    church_affiliation_name: "",
    church_affiliation_city: "",
    church_affiliation_state: "",
    church_affiliation_county: "",
    active: true,
    member_notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.from("team_members").insert([
      { ...form },
    ]);

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      navigate("/profile");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Member</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {Object.keys(form).map((field) => (
          field === "active" ? (
            <label key={field} className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              Active Member
            </label>
          ) : (
            <div key={field} className="col-span-1">
              <label className="block text-sm font-medium mb-1 capitalize">
                {field.replaceAll("_", " ")}
              </label>
              <input
                type={field === "date_of_birth" ? "date" : "text"}
                name={field}
                value={form[field]}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          )
        ))}

        <div className="col-span-2 flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            {loading ? "Saving..." : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}
