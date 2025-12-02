import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { validatePhoneNumber } from "../utils/validation";

// Helper component for private bucket images - CHURCH VERSION
function PrivateBucketImage({ filePath, className }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        const getSignedUrl = async () => {
            if (!filePath) return;

            // If it's already a full URL (legacy), use it
            if (filePath.startsWith('http')) {
                setSignedUrl(filePath);
                return;
            }

            // Generate signed URL for church bucket
            const { data } = await supabase.storage
                .from('Church Images')
                .createSignedUrl(filePath, 3600); // 1 hour expiry

            if (data) {
                setSignedUrl(data.signedUrl);
            }
        };

        getSignedUrl();
    }, [filePath]);

    if (!signedUrl) {
        return <div className={`bg-gray-200 flex items-center justify-center ${className}`}>Loading...</div>;
    }

    return <img src={signedUrl} alt="Church" className={className} />;
}

export default function EditChurch() {
    const { churchName } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Fetch existing church data
    useEffect(() => {
        const fetchChurch = async () => {
            const { data, error } = await supabase
                .from("church2")
                .select("*")
                .eq("church_name", churchName)
                .single();

            if (error) {
                setError("Error loading church details.");
            } else {
                setFormData(data);
            }
        };

        fetchChurch();
    }, [churchName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Apply character limits
    const maxLengths = {
      church_name: 200,
      first_name: 50,
      last_name: 50,
      physical_address: 200,
      mailing_address: 200,
      mailing_address2: 200,
      physical_city: 100,
      physical_state: 2,
      physical_zip: 10,
      physical_county: 100,
      phone_number: 20,
      church_contact: 100,
      church_contact_phone: 20,
      church_contact_email: 100,
      notes: 2000,
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
            // Generate unique name for the image
            const fileExt = file.name.split('.').pop();
            const fileName = `${churchName}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to supabase - using Church Images bucket
            const { error: uploadError } = await supabase.storage
                .from('Church Images')
                .upload(fileName, file);

            if (uploadError) {
                throw new Error(uploadError.message || 'Upload failed. Please try again.');
            }

            const filePath = fileName;

            // Update form with file path
            setFormData(prev => ({ ...prev, photo_url: filePath }));

        } catch (error) {
            setError(error.message || 'Failed to upload photo. Please try again.');
            e.target.value = ''; // Clear the input on error
        } finally {
            setUploading(false);
        }
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate phone numbers
    if (formData.phone_number && !validatePhoneNumber(formData.phone_number)) {
      setError("Please enter a valid phone number (10 digits).");
      return;
    }
    
    if (formData.church_contact_phone && !validatePhoneNumber(formData.church_contact_phone)) {
      setError("Please enter a valid church contact phone number (10 digits).");
      return;
    }
    
    setLoading(true);
    setError(null);

    // Convert phone numbers to bigint if they exist
    const updateData = { ...formData };
        if (updateData.phone_number) {
            const phoneNumberBigint = String(updateData.phone_number).replace(/\D/g, '');
            updateData.phone_number = phoneNumberBigint === '' ? null : parseInt(phoneNumberBigint, 10);
        }
        if (updateData.church_contact_phone) {
            const churchContactPhoneBigint = String(updateData.church_contact_phone).replace(/\D/g, '');
            updateData.church_contact_phone = churchContactPhoneBigint === '' ? null : parseInt(churchContactPhoneBigint, 10);
        }

        // Remove fields that shouldn't be updated via this form
        const { id, created_at, project_leader, relations_member_2023, relations_member_2024, relations_member_2025, relations_member_2026, shoebox_2022, shoebox_2021, shoebox_2020, shoebox_2019, shoebox_2023, shoebox_2024, shoebox_2025, shoebox_2026, ...fieldsToUpdate } = updateData;
        
        const { error } = await supabase
            .from("church2")
            .update({
                ...fieldsToUpdate,
                updated_at: new Date().toISOString()
            })
            .eq("church_name", churchName);

        if (error) {
            setError("Error updating church information.");
        } else {
            navigate(`/church/${churchName}`);
        }

        setLoading(false);
    };

    if (!formData) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Church</h1>
            
            {error && <p className="text-red-600 mb-3 p-3 bg-red-50 rounded">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="border-b pb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Church Photo</label>
                    {formData.photo_url && (
                        <div className="mb-3 flex justify-center">
                            <PrivateBucketImage filePath={formData.photo_url} className="w-48 h-32 object-cover rounded-lg" />
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                        className="w-full border rounded-md px-3 py-2"
                    />
                    {uploading && <p className="text-sm text-gray-600 mt-1">Uploading...</p>}
                </div>

                {/* Basic Information Section */}
                <div className="border-b pb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Church Name</label>
                            <input
                                name="church_name"
                                value={formData.church_name || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                required
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                name="phone_number"
                                value={formData.phone_number || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                required
                                maxLength={20}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    name="first_name"
                                    value={formData.first_name || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={50}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    name="last_name"
                                    value={formData.last_name || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={50}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Physical Address Section */}
                <div className="border-b pb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Physical Address</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                            <input
                                name="physical_address"
                                value={formData.physical_address || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                maxLength={200}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    name="physical_city"
                                    value={formData.physical_city || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    required
                                    maxLength={100}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    name="physical_state"
                                    value={formData.physical_state || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    required
                                    maxLength={2}
                                    placeholder="e.g., AL"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                <input
                                    name="physical_zip"
                                    value={formData.physical_zip || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={10}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                                <input
                                    name="physical_county"
                                    value={formData.physical_county || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mailing Address Section */}
                <div className="border-b pb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Mailing Address</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mailing Address Line 1</label>
                            <input
                                name="mailing_address"
                                value={formData.mailing_address || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                maxLength={200}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mailing Address Line 2</label>
                            <input
                                name="mailing_address2"
                                value={formData.mailing_address2 || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                maxLength={200}
                            />
                        </div>
                    </div>
                </div>

                {/* Church Contact Section */}
                <div className="border-b pb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Church Contact</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                            <input
                                name="church_contact"
                                value={formData.church_contact || ""}
                                onChange={handleChange}
                                className="w-full border rounded-md px-3 py-2"
                                maxLength={100}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                <input
                                    name="church_contact_phone"
                                    value={formData.church_contact_phone || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={20}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                <input
                                    name="church_contact_email"
                                    type="email"
                                    value={formData.church_contact_email || ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="pb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Notes</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes || ""}
                            onChange={handleChange}
                            className="w-full border rounded-md px-3 py-2"
                            rows="4"
                            maxLength={2000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {(formData.notes || "").length} / 2000 characters
                        </p>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(`/church/${churchName}`)}
                        className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}