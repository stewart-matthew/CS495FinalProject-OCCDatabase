import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { validatePhoneNumber } from "../utils/validation";

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
    photo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply character limits
    const maxLengths = {
      church_name: 200,
      physical_address: 200,
      physical_city: 100,
      physical_state: 2,
      physical_zip: 10,
      physical_county: 100,
      phone_number: 20,
      church_contact: 100,
      church_contact_phone: 20,
      church_contact_email: 100,
    };
    
    const processedValue = maxLengths[name] ? value.slice(0, maxLengths[name]) : value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
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
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `church-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('church-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed. Please try again.');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('church-photos')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, photo_url: publicUrl }));
    } catch (err) {
      setError(err.message || 'Failed to upload photo. Please try again.');
      e.target.value = ''; // Clear the input on error
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate phone numbers
    if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
      setError("Please enter a valid phone number (10 digits).");
      setLoading(false);
      return;
    }
    
    if (formData.church_contact_phone && !validatePhoneNumber(formData.church_contact_phone)) {
      setError("Please enter a valid church contact phone number (10 digits).");
      setLoading(false);
      return;
    }

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
          maxLength={200}
        />
        <input
          name="physical_address"
          value={formData.physical_address}
          onChange={handleChange}
          placeholder="Physical Address"
          className="w-full border rounded-lg p-2"
          maxLength={200}
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="physical_city"
            value={formData.physical_city}
            onChange={handleChange}
            placeholder="City"
            className="border rounded-lg p-2"
            maxLength={100}
          />
          <input
            name="physical_state"
            value={formData.physical_state}
            onChange={handleChange}
            placeholder="State"
            className="border rounded-lg p-2"
            maxLength={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            name="physical_zip"
            value={formData.physical_zip}
            onChange={handleChange}
            placeholder="ZIP Code"
            className="border rounded-lg p-2"
            maxLength={10}
          />
          <input
            name="physical_county"
            value={formData.physical_county}
            onChange={handleChange}
            placeholder="County"
            className="border rounded-lg p-2"
            maxLength={100}
          />
        </div>
        <input
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full border rounded-lg p-2"
          maxLength={20}
        />
        <input
          name="church_contact"
          value={formData.church_contact}
          onChange={handleChange}
          placeholder="Church Contact Name"
          className="w-full border rounded-lg p-2"
          maxLength={100}
        />
        <input
          name="church_contact_phone"
          value={formData.church_contact_phone}
          onChange={handleChange}
          placeholder="Church Contact Phone"
          className="w-full border rounded-lg p-2"
          maxLength={20}
        />
        <input
          name="church_contact_email"
          type="email"
          value={formData.church_contact_email}
          onChange={handleChange}
          placeholder="Church Contact Email"
          className="w-full border rounded-lg p-2"
          maxLength={100}
        />
        
        {/* Photo Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Church Photo
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full border rounded-lg p-2"
            disabled={uploading}
          />
          {uploading && (
            <p className="text-blue-500 text-sm">Uploading photo...</p>
          )}
          {formData.photo_url && !uploading && (
            <div className="mt-2">
              <p className="text-green-500 text-sm">✓ Photo uploaded successfully</p>
              <img 
                src={formData.photo_url} 
                alt="Preview" 
                className="mt-2 w-32 h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? "Adding..." : "Add Church"}
        </button>
      </form>
    </div>
  );
}