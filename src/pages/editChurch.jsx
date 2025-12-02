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
      physical_address: 200,
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

        const { error } = await supabase
            .from("church2")
            .update(updateData)
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
        <div className="max-w-2xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Edit Church</h1>
            {error && <p className="text-red-500 text-center mb-3">{error}</p>}

            {/* Photo Upload Section - Same as editMember */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Church Photo</label>
                {formData.photo_url && (
                    <div className="mb-3">
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

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    name="church_name"
                    value={formData.church_name || ""}
                    onChange={handleChange}
                    placeholder="Church Name"
                    className="w-full border rounded-lg p-2"
                    required
                    maxLength={200}
                />
                <input
                    name="physical_address"
                    value={formData.physical_address || ""}
                    onChange={handleChange}
                    placeholder="Physical Address"
                    className="w-full border rounded-lg p-2"
                    maxLength={200}
                />
                <div className="grid grid-cols-2 gap-4">
                    <input
                        name="physical_city"
                        value={formData.physical_city || ""}
                        onChange={handleChange}
                        placeholder="City"
                        className="border rounded-lg p-2"
                        maxLength={100}
                    />
                    <input
                        name="physical_state"
                        value={formData.physical_state || ""}
                        onChange={handleChange}
                        placeholder="State"
                        className="border rounded-lg p-2"
                        maxLength={2}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input
                        name="physical_zip"
                        value={formData.physical_zip || ""}
                        onChange={handleChange}
                        placeholder="ZIP Code"
                        className="border rounded-lg p-2"
                        maxLength={10}
                    />
                    <input
                        name="physical_county"
                        value={formData.physical_county || ""}
                        onChange={handleChange}
                        placeholder="County"
                        className="border rounded-lg p-2"
                        maxLength={100}
                    />
                </div>
                <input
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full border rounded-lg p-2"
                />
                <input
                    name="church_contact"
                    value={formData.church_contact || ""}
                    onChange={handleChange}
                    placeholder="Church Contact Name"
                    className="w-full border rounded-lg p-2"
                />
                <input
                    name="church_contact_phone"
                    value={formData.church_contact_phone || ""}
                    onChange={handleChange}
                    placeholder="Church Contact Phone"
                    className="w-full border rounded-lg p-2"
                />
                <input
                    name="church_contact_email"
                    type="email"
                    value={formData.church_contact_email || ""}
                    onChange={handleChange}
                    placeholder="Church Contact Email"
                    className="w-full border rounded-lg p-2"
                    maxLength={100}
                />
                <textarea
                    name="notes"
                    value={formData.notes || ""}
                    onChange={handleChange}
                    placeholder="Notes"
                    className="w-full border rounded-lg p-2"
                    rows="3"
                    maxLength={2000}
                ></textarea>

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