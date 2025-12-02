import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AddChurch() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    church_name: "",
    physical_address: "",
    physical_city: "",
    physical_state: "",
    physical_zip: "",
    physical_county: "",
    phone_number: "",
    church_contact: "",
    church_contact_phone: "",
    church_contact_email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("church2").insert([
      {
        ...formData,
        created_at: new Date().toISOString(),
        // Hidden defaults for optional fields:
        mailing_address: "",
        mailing_city: formData.physical_city,
        mailing_state: formData.physical_state,
        mailing_zip: formData.physical_zip,
        shoebox_2023: null,
        shoebox_2024: null,
        shoebox_2025: null,
        relations_member_2023: null,
        relations_member_2024: null,
        relations_member_2025: null,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Error adding church. Please try again.");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Add Church</h1>
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="church_name"
          value={formData.church_name}
          onChange={handleChange}
          placeholder="Church Name"
          required
          className="w-full border rounded-lg p-2"
        />
        <input
          name="physical_address"
          value={formData.physical_address}
          onChange={handleChange}
          placeholder="Physical Address"
          className="w-full border rounded-lg p-2"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="physical_city"
            value={formData.physical_city}
            onChange={handleChange}
            placeholder="City"
            className="border rounded-lg p-2"
          />
          <input
            name="physical_state"
            value={formData.physical_state}
            onChange={handleChange}
            placeholder="State"
            className="border rounded-lg p-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="physical_zip"
            value={formData.physical_zip}
            onChange={handleChange}
            placeholder="ZIP Code"
            className="border rounded-lg p-2"
          />
          <input
            name="physical_county"
            value={formData.physical_county}
            onChange={handleChange}
            placeholder="County"
            className="border rounded-lg p-2"
          />
        </div>
        <input
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="church_contact"
          value={formData.church_contact}
          onChange={handleChange}
          placeholder="Church Contact Name"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="church_contact_phone"
          value={formData.church_contact_phone}
          onChange={handleChange}
          placeholder="Church Contact Phone"
          className="w-full border rounded-lg p-2"
        />
        <input
          name="church_contact_email"
          type="email"
          value={formData.church_contact_email}
          onChange={handleChange}
          placeholder="Church Contact Email"
          className="w-full border rounded-lg p-2"
        />
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes"
          className="w-full border rounded-lg p-2"
          rows="3"
        ></textarea>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Church"}
        </button>
      </form>
    </div>
  );
}
