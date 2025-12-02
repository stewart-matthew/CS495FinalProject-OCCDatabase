import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

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
                console.error(error);
                setError("Error loading church details.");
            } else {
                setFormData(data);
            }
        };

        fetchChurch();
    }, [churchName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

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

            if (uploadError) throw uploadError;

            const filePath = fileName;

            // Update form with file path
            setFormData(prev => ({ ...prev, photo_url: filePath }));

        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload photo: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase
            .from("church2")
            .update({
                ...formData,
            })
            .eq("church_name", churchName);

        if (error) {
            console.error(error);
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