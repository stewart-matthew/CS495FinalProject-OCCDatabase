import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddIndividual() {
  const navigate = useNavigate();
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    church_name: "",
    role: "",
    active_to_emails: true,
    craft_ideas: false,
    packing_party_ideas: false,
    fundraising_ideas: false,
    getting_more_people_involved: false,
    presentation_at_church_group: false,
    resources: false,
    other: false,
    other_description: "",
    notes: "",
  });

  // Fetch churches for dropdown
  useEffect(() => {
    async function getChurches() {
      const { data, error } = await supabase
        .from("church2")
        .select("church_name")
        .order("church_name", { ascending: true });
      
      if (error) {
        // Error fetching churches
      } else {
        setChurches(data || []);
      }
    }
    getChurches();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTextareaChange = (name, value, maxLength) => {
    const limitedValue = value.slice(0, maxLength);
    setFormData((prev) => ({ ...prev, [name]: limitedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Use the church name as-is (from dropdown, which has the actual database value)
    // No need to convert - the dropdown already has the correct format from the database

    const submitData = {
      ...formData,
      church_name: formData.church_name, // Use as-is from dropdown
      other_description: formData.other ? formData.other_description : null,
    };

    const { error: insertError } = await supabase
      .from("individuals")
      .insert([submitData]);

    setLoading(false);

    if (insertError) {
      setError("Error adding individual. Please try again.");
    } else {
      navigate("/individuals");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-4 md:p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Add Individual</h1>
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="First Name"
            required
            className="border rounded-lg p-2"
          />
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Last Name"
            required
            className="border rounded-lg p-2"
          />
        </div>

        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border rounded-lg p-2"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            name="church_name"
            value={formData.church_name}
            onChange={handleChange}
            className="border rounded-lg p-2"
          >
            <option value="">Select Church...</option>
            {churches.map((church) => (
              <option key={church.church_name} value={church.church_name}>
                {church.church_name.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <input
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Role"
            className="border rounded-lg p-2"
          />
        </div>

        {/* Active to Emails */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="active_to_emails"
            checked={formData.active_to_emails}
            onChange={handleChange}
            className="rounded"
          />
          <label className="text-sm font-medium">Active to Emails</label>
        </div>

        {/* Resource Checkboxes */}
        <div>
          <label className="block text-sm font-medium mb-2">Resources Requested:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="craft_ideas"
                checked={formData.craft_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Craft Ideas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="packing_party_ideas"
                checked={formData.packing_party_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Packing Party Ideas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="fundraising_ideas"
                checked={formData.fundraising_ideas}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Fundraising Ideas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="getting_more_people_involved"
                checked={formData.getting_more_people_involved}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Getting More People Involved</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="presentation_at_church_group"
                checked={formData.presentation_at_church_group}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Presentation at Church/Group</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="resources"
                checked={formData.resources}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Resources</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="other"
                checked={formData.other}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Other</span>
            </label>
          </div>
        </div>

        {/* Other Description */}
        {formData.other && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Other Description (max 500 characters):
            </label>
            <textarea
              value={formData.other_description}
              onChange={(e) => handleTextareaChange("other_description", e.target.value, 500)}
              maxLength={500}
              className="w-full border rounded-lg p-2 min-h-[80px]"
              placeholder="Describe what other resources are needed..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.other_description.length}/500 characters
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (max 1000 characters):
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleTextareaChange("notes", e.target.value, 1000)}
            maxLength={1000}
            className="w-full border rounded-lg p-2 min-h-[100px]"
            placeholder="Add notes about this individual..."
            rows="3"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.notes.length}/1000 characters
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => navigate("/individuals")}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
          >
            {loading ? "Adding..." : "Add Individual"}
          </button>
        </div>
      </form>
    </div>
  );
}

