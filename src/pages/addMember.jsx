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
    photo_url: "", // Added photo_url field
    active: true, // Always true by default — no checkbox needed
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // Generate unique name for the image
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to supabase - using member-images bucket
      const { error: uploadError } = await supabase.storage
        .from('member-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update form with file path
      setForm(prev => ({ ...prev, photo_url: fileName }));

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload photo: ' + error.message);
      setPhotoPreview("");
    } finally {
      setUploading(false);
    }
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

  // Filter out "active" and "photo_url" so they don't appear in the regular form fields
  const formFields = Object.keys(form).filter((field) => 
    field !== "active" && field !== "photo_url"
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Member</h1>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <div className="mb-6 p-4 border rounded-lg">
        <label className="block text-lg font-medium mb-2">Member Photo</label>
        
        {photoPreview && (
          <div className="mb-3">
            <img 
              src={photoPreview} 
              alt="Preview" 
              className="w-48 h-48 object-cover rounded-lg"
            />
            <p className="text-sm text-gray-600 mt-1">Photo preview</p>
          </div>
        )}
        
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          disabled={uploading}
          className="w-full border rounded-md px-3 py-2"
        />
        
        {uploading && <p className="text-sm text-blue-600 mt-1">Uploading photo...</p>}
        <p className="text-sm text-gray-500 mt-1">
          Upload a photo of the member (optional)
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          {formFields.map((field) => (
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
          ))}
        </div>

        <div className="col-span-2 flex justify-end gap-2 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300"
          >
            {loading ? "Saving..." : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  );
}