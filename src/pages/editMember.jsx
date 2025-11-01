// src/pages/editMember.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

// Helper component for private bucket images
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

            // Generate signed URL for private bucket
            const { data } = await supabase.storage
                .from('Team Images')
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

    return <img src={signedUrl} alt="Profile" className={className} />;
}

export default function EditMember() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadMember = async () => {
            const { data, error } = await supabase
                .from("team_members")
                .select("*")
                .eq("id", id)
                .single();

            if (error) setError(error.message);
            else setForm(data);
            setLoading(false);
        };
        loadMember();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            // Generate unique name for the image
            const fileExt = file.name.split('.').pop();
            const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to supabase
            const { error: uploadError } = await supabase.storage
                .from('Team Images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const filePath = fileName;

            // Update form with file path
            setForm({ ...form, photo_url: filePath });

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
        setError("");

        const { error } = await supabase
            .from("team_members")
            .update({ ...form, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error(error);
            setError(error.message);
        } else {
            navigate("/profile");
        }
        setLoading(false);
    };

    if (loading || !form) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-6">Edit Member</h1>

            {error && <p className="text-red-600 mb-3">{error}</p>}

            {/* Photo Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Profile Photo</label>
                {form.photo_url && (
                    <div className="mb-3">
                        <PrivateBucketImage filePath={form.photo_url} className="w-32 h-32 object-cover rounded-full" />
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

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                {Object.keys(form).map((field) =>
                    ["id", "created_at", "updated_at", "admin_flag", "photo_url"].includes(field)
                        ? null
                        : field === "active" ? (
                            <label key={field} className="col-span-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={form.active}
                                    onChange={handleChange}
                                />
                                Active Member
                            </label>
                        ) : (
                            <div key={field} className="col-span-1">
                                <label className="block text-sm font-medium mb-1 capitalize">
                                    {field.replaceAll("_", " ")}
                                </label>
                                <input
                                    type={field === "date_of_birth" ? "date" : "text"}
                                    name={field}
                                    value={form[field] ?? ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                        )
                )}

                <div className="col-span-2 flex justify-end gap-2 mt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        {loading ? "Saving..." : "Update Member"}
                    </button>
                </div>
            </form>
        </div>
    );
}