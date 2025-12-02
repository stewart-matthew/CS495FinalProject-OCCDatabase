// src/pages/editProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

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

export default function EditProfile() {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                if (userError || !authUser) {
                    navigate("/login");
                    return;
                }
                setUser(authUser);

                const { data: member, error: memberError } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("email", authUser.email)
                    .single();

                if (memberError || !member) {
                    alert("Could not load your profile data.");
                    setLoading(false);
                    return;
                }

                setFormData(member);
            } catch (err) {
                console.error(err);
                alert("An error occurred loading your profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError("");

        try {
            // Generate unique name for the image
            const fileExt = file.name.split('.').pop();
            const fileName = `${formData.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to supabase
            const { error: uploadError } = await supabase.storage
                .from('Team Images')
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

        try {
            const { error } = await supabase
                .from("team_members")
                .update({
                    first_name: formData.first_name ?? null,
                    last_name: formData.last_name ?? null,
                    phone_number: formData.phone_number ?? null,
                    alt_phone_number: formData.alt_phone_number ?? null,
                    home_address: formData.home_address ?? null,
                    home_city: formData.home_city ?? null,
                    home_state: formData.home_state ?? null,
                    home_zip: formData.home_zip ?? null,
                    home_county: formData.home_county ?? null,
                    date_of_birth: formData.date_of_birth ?? null,
                    shirt_size: formData.shirt_size ?? null,
                    church_affiliation_name: formData.church_affiliation_name ?? null,
                    church_affiliation_city: formData.church_affiliation_city ?? null,
                    church_affiliation_state: formData.church_affiliation_state ?? null,
                    church_affiliation_county: formData.church_affiliation_county ?? null,
                    active: formData.active ?? true,
                    member_notes: formData.member_notes ?? null,
                    admin_flag: formData.admin_flag ?? false,
                    photo_url: formData.photo_url ?? null,
                    updated_at: new Date().toISOString()
                })
                .eq("id", formData.id);

            if (error) {
                alert("Error updating profile: " + error.message);
            } else {
                navigate("/profile");
            }
        } catch (err) {
            console.error(err);
            alert("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

            {error && <p className="text-red-600 mb-3">{error}</p>}

            {/*Photo Upload*/}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Profile Photo</label>
                {formData.photo_url && (
                    <div className="mb-3 flex justify-center">
                        <PrivateBucketImage filePath={formData.photo_url} className="w-32 h-32 object-cover rounded-full" />
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
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={50}
                />
                <input
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={50}
                />
                <input
                    name="phone_number"
                    placeholder="Phone Number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    name="alt_phone_number"
                    placeholder="Alternate Phone"
                    value={formData.alt_phone_number || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    name="home_address"
                    placeholder="Home Address"
                    value={formData.home_address || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={200}
                />
                <input
                    name="home_city"
                    placeholder="Home City"
                    value={formData.home_city || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={100}
                />
                <input
                    name="home_state"
                    placeholder="Home State"
                    value={formData.home_state || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={2}
                />
                <input
                    name="home_zip"
                    placeholder="Home ZIP"
                    value={formData.home_zip || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={10}
                />
                <input
                    name="home_county"
                    placeholder="Home County"
                    value={formData.home_county || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={100}
                />
                <input
                    name="shirt_size"
                    placeholder="Shirt Size"
                    value={formData.shirt_size || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={10}
                />
                <input
                    name="member_notes"
                    placeholder="Member Notes"
                    value={formData.member_notes || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    maxLength={1000}
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    );
}