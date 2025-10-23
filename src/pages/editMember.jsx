import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function EditMember() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMember = async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", id)
        .single();

      if (error) setError("Error loading member.");
      else setFormData(data);
    };
    fetchMember();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("team_members")
      .update({
        ...formData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      setError("Error updating member.");
    } else {
      navigate("/team-members");
    }

    setLoading(false);
  };

  if (!formData) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Edit Member</h1>
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            name="first_name"
            value={formData.first_name || ""}
            onChange={handleChange}
            placeholder="First Name"
            className="border rounded-lg p-2"
          />
          <input
            name="last_name"
            value={formData.last_name || ""}
            onChange={handleChange}
            placeholder="Last Name"
            className="border rounded-lg p-2"
          />
        </div>
        <input
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="phone_number"
          value={formData.phone_number || ""}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full border rounded-lg p-2"
        />
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="admin_flag"
            checked={formData.admin_flag || false}
            onChange={handleChange}
          />
          <span>Admin?</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
