// src/pages/addMember.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { validatePhoneNumber } from "../utils/validation";

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
    member_notes: "",
    photo_url: "", // Added photo_url field
    active: true, // Always true by default — no checkbox needed
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply character limits based on field type
    const maxLengths = {
      first_name: 50,
      last_name: 50,
      email: 100,
      phone_number: 20,
      alt_phone_number: 20,
      home_address: 200,
      home_city: 100,
      home_state: 2,
      home_zip: 10,
      home_county: 100,
      church_affiliation_name: 200,
      church_affiliation_city: 100,
      church_affiliation_state: 2,
      church_affiliation_county: 100,
      member_notes: 1000,
    };
    
    const processedValue = maxLengths[name] ? value.slice(0, maxLengths[name]) : value;
    setForm({ ...form, [name]: processedValue });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side file type validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).');
      e.target.value = ''; // Clear the input
      return;
    }

    if (file.size > maxSize) {
      setError('File size too large. Please upload an image smaller than 5MB.');
      e.target.value = ''; // Clear the input
      return;
    }

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

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed. Please try again.');
      }

      // Update form with file path
      setForm(prev => ({ ...prev, photo_url: fileName }));

    } catch (error) {
      setError(error.message || 'Failed to upload photo. Please try again.');
      setPhotoPreview("");
      e.target.value = ''; // Clear the input on error
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate phone numbers
    if (form.phone_number && !validatePhoneNumber(form.phone_number)) {
      setError("Please enter a valid phone number (10 digits).");
      setLoading(false);
      return;
    }
    
    if (form.alt_phone_number && !validatePhoneNumber(form.alt_phone_number)) {
      setError("Please enter a valid alternate phone number (10 digits).");
      setLoading(false);
      return;
    }

    // Prepare form data, converting empty strings to null for optional fields
    const formData = { ...form };
    if (formData.shirt_size === "") {
      formData.shirt_size = null;
    }

    const { error } = await supabase.from("team_members").insert([
      formData,
    ]);

    if (error) {
      setError(error.message);
    } else {
      navigate("/team-members");
    }

    setLoading(false);
  };

  // Filter out "active" and "photo_url" so they don't appear in the regular form fields
  const formFields = Object.keys(form).filter((field) => 
    field !== "active" && field !== "photo_url"
  );

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-4 md:p-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formFields.map((field) => (
            <div key={field} className="col-span-1">
              <label className="block text-sm font-medium mb-1 capitalize">
                {field.replaceAll("_", " ")}
              </label>
              {field === "shirt_size" ? (
                <select
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Select size (optional)</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="2XL">2XL</option>
                  <option value="3XL">3XL</option>
                </select>
              ) : (
                <input
                  type={field === "date_of_birth" ? "date" : field === "email" ? "email" : "text"}
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2"
                  maxLength={
                    field === "first_name" ? 50 :
                    field === "last_name" ? 50 :
                    field === "email" ? 100 :
                    field === "phone_number" ? 20 :
                    field === "alt_phone_number" ? 20 :
                    field === "home_address" ? 200 :
                    field === "home_city" ? 100 :
                    field === "home_state" ? 2 :
                    field === "home_zip" ? 10 :
                    field === "home_county" ? 100 :
                    field === "church_affiliation_name" ? 200 :
                    field === "church_affiliation_city" ? 100 :
                    field === "church_affiliation_state" ? 2 :
                    field === "church_affiliation_county" ? 100 :
                    field === "member_notes" ? 1000 :
                    undefined
                  }
                />
              )}
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
