import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function AddIndividual() {
  const navigate = useNavigate();
  const { churchName } = useParams(); // Optional: if coming from church page
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    church_name: churchName || "",
    active_to_emails: true,
    craft_ideas: false,
    packing_party_ideas: false,
    fundraising_ideas: false,
    getting_more_people_involved: false,
    presentation_at_church_group: false,
    resources: false,
    other: false,
    other_description: "",
    role: "",
  });

  // Fetch churches for dropdown
  useEffect(() => {
    async function getChurches() {
      const { data, error } = await supabase
        .from("church")
        .select("church_name")
        .order("church_name", { ascending: true });
      
      if (!error && data) {
        setChurches(data);
      }
    }
    getChurches();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!form.first_name || !form.last_name) {
      setError("First name and last name are required.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("individuals").insert([
      {
        ...form,
        church_name: form.church_name || null,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
    } else {
      // Navigate back based on where we came from
      if (churchName) {
        navigate(`/church/${encodeURIComponent(churchName)}`);
      } else {
        navigate("/individuals");
      }
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Individual</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              required
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Church</label>
            <select
              name="church_name"
              value={form.church_name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="">Select a church...</option>
              {churches.map((church) => (
                <option key={church.church_name} value={church.church_name}>
                  {church.church_name.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <input
              type="text"
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="active_to_emails"
              checked={form.active_to_emails}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Active to Emails</label>
          </div>
        </div>

        {/* Resource Request Checkboxes */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Resources Requested</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="craft_ideas"
                checked={form.craft_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Craft Ideas</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="packing_party_ideas"
                checked={form.packing_party_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Packing Party Ideas</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="fundraising_ideas"
                checked={form.fundraising_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Fundraising Ideas</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="getting_more_people_involved"
                checked={form.getting_more_people_involved}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Getting More People Involved</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="presentation_at_church_group"
                checked={form.presentation_at_church_group}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Presentation at Church/Group</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="resources"
                checked={form.resources}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Resources</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="other"
                checked={form.other}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Other</span>
            </label>
          </div>

          {form.other && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Other Description</label>
              <textarea
                name="other_description"
                value={form.other_description}
                onChange={handleChange}
                placeholder="Please describe what you are requesting..."
                className="w-full border rounded-md px-3 py-2 min-h-[80px]"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => {
              if (churchName) {
                navigate(`/church/${encodeURIComponent(churchName)}`);
              } else {
                navigate("/individuals");
              }
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            {loading ? "Saving..." : "Add Individual"}
          </button>
        </div>
      </form>
    </div>
  );
}

