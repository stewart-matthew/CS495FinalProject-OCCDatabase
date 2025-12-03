import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { validatePhoneNumber } from "../utils/validation";

export default function AddChurch() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [formData, setFormData] = useState({
    church_name: "",
    "church_POC_first_name": "",
    "church_POC_last_name": "",
    "church_physical_address": "",
    "church_physical_city": "",
    "church_physical_state": "",
    "church_physical_zip": "",
    "church_physical_county": "",
    "church_phone_number": "",
    church_contact: "",
    "church_POC_phone": "",
    "church_POC_email": "",
    "church_mailing_address": "",
    "church_mailing_city": "",
    "church_mailing_state": "",
    "church_mailing_zip": "",
    notes: "",
    photo_url: "",
    project_leader: false, // Boolean: TRUE = POC is project leader, FALSE = different person
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      const { data: memberData } = await supabase
        .from("team_members")
        .select("admin_flag")
        .eq("email", user.email)
        .single();

      const adminStatus = memberData?.admin_flag === true || memberData?.admin_flag === "true";
      setIsAdmin(adminStatus);
      setCheckingAdmin(false);

      if (!adminStatus) {
        navigate("/home");
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Apply character limits
    const maxLengths = {
      church_name: 200,
      "church_POC_first_name": 50,
      "church_POC_last_name": 50,
      "church_physical_address": 200,
      "church_physical_city": 100,
      "church_physical_state": 2,
      "church_physical_zip": 10,
      "church_physical_county": 100,
      "church_phone_number": 20,
      church_contact: 100,
      "church_POC_phone": 20,
      "church_POC_email": 100,
      "church_mailing_address": 200,
      "church_mailing_city": 100,
      "church_mailing_state": 2,
      "church_mailing_zip": 10,
      notes: 2000,
    };
    
    const processedValue = type === "checkbox" ? checked : (maxLengths[name] ? value.slice(0, maxLengths[name]) : value);
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
      // Use church name or timestamp for unique filename
      const churchName = formData.church_name || 'new-church';
      // Sanitize the church name: replace spaces with underscores and remove special characters
      const sanitizedChurchName = churchName
        .replace(/\s+/g, '_')  // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_-]/g, '')  // Remove special characters except underscores and hyphens
        .toLowerCase();
      const fileName = `${sanitizedChurchName}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to the correct bucket: 'Church Images' (same as editChurch)
      const { error: uploadError } = await supabase.storage
        .from('Church Images')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed. Please try again.');
      }

      // Store the file path (just the filename) - same as editChurch
      setFormData((prev) => ({ ...prev, photo_url: fileName }));
      
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

    // Validate required fields
    if (!formData["church_physical_city"] || !formData["church_physical_city"].trim()) {
      setError("City is required.");
      setLoading(false);
      return;
    }
    
    if (!formData["church_physical_state"] || !formData["church_physical_state"].trim()) {
      setError("State is required.");
      setLoading(false);
      return;
    }
    
    // Validate phone numbers only if provided
    if (formData["church_phone_number"] && formData["church_phone_number"].trim()) {
      if (!validatePhoneNumber(formData["church_phone_number"])) {
        setError("Please enter a valid phone number (10 digits).");
        setLoading(false);
        return;
      }
    }
    
    if (formData["church_POC_phone"] && !validatePhoneNumber(formData["church_POC_phone"])) {
      setError("Please enter a valid POC phone number (10 digits).");
      setLoading(false);
      return;
    }

    // Convert phone numbers to bigint (remove non-digits and convert)
    const phoneNumberBigint = formData["church_phone_number"].replace(/\D/g, '');
    const churchPOCPhoneBigint = formData["church_POC_phone"] 
      ? formData["church_POC_phone"].replace(/\D/g, '') 
      : null;

    const { error } = await supabase.from("church2").insert([
      {
        church_name: formData.church_name,
        "church_POC_first_name": formData["church_POC_first_name"] || null,
        "church_POC_last_name": formData["church_POC_last_name"] || null,
        project_leader: formData.project_leader,
        "church_physical_address": formData["church_physical_address"] || null,
        "church_physical_city": formData["church_physical_city"],
        "church_physical_state": formData["church_physical_state"],
        "church_physical_zip": formData["church_physical_zip"] || null,
        "church_physical_county": formData["church_physical_county"] || null,
        "church_phone_number": phoneNumberBigint ? parseInt(phoneNumberBigint, 10) : null,
        church_contact: formData.church_contact || null,
        "church_POC_phone": churchPOCPhoneBigint ? parseInt(churchPOCPhoneBigint, 10) : null,
        "church_POC_email": formData["church_POC_email"] || null,
        "church_mailing_address": formData["church_mailing_address"] || null,
        "church_mailing_city": formData["church_mailing_city"] || null,
        "church_mailing_state": formData["church_mailing_state"] || null,
        "church_mailing_zip": formData["church_mailing_zip"] || null,
        notes: formData.notes || null,
        photo_url: formData.photo_url || null,
        created_at: new Date().toISOString(),
        // Hidden defaults for optional fields:
        shoebox_2023: null,
        shoebox_2024: null,
        shoebox_2025: null,
        "church_relations_member_2023": null,
        "church_relations_member_2024": null,
        "church_relations_member_2025": null,
      },
    ]);

    setLoading(false);

    if (error) {
      setError("Error adding church. Please try again.");
    } else {
      navigate("/home");
    }
  };

  if (checkingAdmin || !isAdmin) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white p-4 md:p-6 rounded-2xl shadow">
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
          name="church_phone_number"
          value={formData["church_phone_number"]}
          onChange={handleChange}
          placeholder="Church Phone Number"
          className="w-full border rounded-lg p-2"
          maxLength={20}
        />
        <input
          name="church_physical_address"
          value={formData["church_physical_address"]}
          onChange={handleChange}
          placeholder="Physical Address"
          className="w-full border rounded-lg p-2"
          maxLength={200}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="church_physical_city"
            value={formData["church_physical_city"]}
            onChange={handleChange}
            placeholder="City"
            required
            className="border rounded-lg p-2"
            maxLength={100}
          />
          <input
            name="church_physical_state"
            value={formData["church_physical_state"]}
            onChange={handleChange}
            placeholder="State"
            required
            className="border rounded-lg p-2"
            maxLength={2}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="church_physical_zip"
            value={formData["church_physical_zip"]}
            onChange={handleChange}
            placeholder="ZIP Code"
            className="border rounded-lg p-2"
            maxLength={10}
          />
          <input
            name="church_physical_county"
            value={formData["church_physical_county"]}
            onChange={handleChange}
            placeholder="County"
            className="border rounded-lg p-2"
            maxLength={100}
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mailing Address
            </label>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  "church_mailing_address": prev["church_physical_address"],
                  "church_mailing_city": prev["church_physical_city"],
                  "church_mailing_state": prev["church_physical_state"],
                  "church_mailing_zip": prev["church_physical_zip"],
                }));
              }}
              className="mb-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Use same as physical address
            </button>
            <input
              name="church_mailing_address"
              value={formData["church_mailing_address"]}
              onChange={handleChange}
              placeholder="Mailing Address"
              className="w-full border rounded-lg p-2"
              maxLength={200}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="church_mailing_city"
              value={formData["church_mailing_city"]}
              onChange={handleChange}
              placeholder="Mailing City"
              className="border rounded-lg p-2"
              maxLength={100}
            />
            <input
              name="church_mailing_state"
              value={formData["church_mailing_state"]}
              onChange={handleChange}
              placeholder="Mailing State"
              className="border rounded-lg p-2"
              maxLength={2}
            />
          </div>
          <input
            name="church_mailing_zip"
            value={formData["church_mailing_zip"]}
            onChange={handleChange}
            placeholder="Mailing ZIP Code"
            className="w-full border rounded-lg p-2"
            maxLength={10}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="church_POC_first_name"
            value={formData["church_POC_first_name"]}
            onChange={handleChange}
            placeholder="POC First Name"
            className="border rounded-lg p-2"
            maxLength={50}
          />
          <input
            name="church_POC_last_name"
            value={formData["church_POC_last_name"]}
            onChange={handleChange}
            placeholder="POC Last Name"
            className="border rounded-lg p-2"
            maxLength={50}
          />
        </div>
        <input
          name="church_POC_phone"
          value={formData["church_POC_phone"]}
          onChange={handleChange}
          placeholder="POC Phone"
          className="w-full border rounded-lg p-2"
          maxLength={20}
        />
        <input
          name="church_POC_email"
          type="email"
          value={formData["church_POC_email"]}
          onChange={handleChange}
          placeholder="POC Email"
          className="w-full border rounded-lg p-2"
          maxLength={100}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="project_leader"
            checked={formData.project_leader}
            onChange={handleChange}
            className="w-4 h-4"
          />
          <span>POC is the Project Leader</span>
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Notes"
          className="w-full border rounded-lg p-2"
          rows="3"
          maxLength={2000}
        ></textarea>
        
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
              {/* Simple placeholder instead of image preview */}
              <div className="mt-2 w-32 h-32 bg-gray-200 flex items-center justify-center rounded-lg">
                <span className="text-gray-500 text-sm">Photo uploaded</span>
              </div>
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