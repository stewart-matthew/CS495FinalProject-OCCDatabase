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
    const [isAdmin, setIsAdmin] = useState(false);
    const [availablePositions, setAvailablePositions] = useState([]);
    const [selectedPositions, setSelectedPositions] = useState([]);

    // Check if current user is admin
    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: memberData, error } = await supabase
                    .from("team_members")
                    .select("admin_flag")
                    .eq("email", user.email)
                    .single();
                
                if (!error && memberData) {
                    const adminStatus = memberData?.admin_flag === true || memberData?.admin_flag === "true";
                    setIsAdmin(adminStatus);
                }
            }
        };
        checkAdmin();
    }, []);

    // Fetch available positions from positions table
    useEffect(() => {
        const loadPositions = async () => {
            if (!isAdmin) return;
            
            // Get all positions from positions table
            const { data, error } = await supabase
                .from("positions")
                .select("*")
                .order("code", { ascending: true });
            
            if (!error && data) {
                setAvailablePositions(data);
            }
        };
        loadPositions();
    }, [isAdmin]);

    // Fetch current member positions
    useEffect(() => {
        const loadMemberPositions = async () => {
            if (!id || !isAdmin) return;
            
            const { data, error } = await supabase
                .from("member_positions")
                .select("position")
                .eq("member_id", id)
                .is("end_date", null); // Only get active positions (no end_date)
            
            if (!error && data) {
                const activePositions = data.map(p => p.position).filter(Boolean);
                setSelectedPositions(activePositions);
            } else {
                setSelectedPositions([]);
            }
        };
        loadMemberPositions();
    }, [id, isAdmin]);

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
            // Generate unique name for the image
            const fileExt = file.name.split('.').pop();
            const fileName = `${id}-${Math.random().toString(36).substring(2)}.${fileExt}`;

            // Upload to supabase
            const { error: uploadError } = await supabase.storage
                .from('Team Images')
                .upload(fileName, file);

            if (uploadError) {
                throw new Error(uploadError.message || 'Upload failed. Please try again.');
            }

            const filePath = fileName;

            // Update form with file path
            setForm({ ...form, photo_url: filePath });

        } catch (error) {
            setError(error.message || 'Failed to upload photo. Please try again.');
            e.target.value = ''; // Clear the input on error
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Prepare form data, converting empty strings to null for optional fields
        const formData = { ...form };
        if (formData.shirt_size === "") {
            formData.shirt_size = null;
        }

        // Update team member basic info
        const { error: memberError } = await supabase
            .from("team_members")
            .update({ ...formData, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (memberError) {
            setError(memberError.message);
            setLoading(false);
            return;
        }

        // Update positions if admin
        if (isAdmin) {
            const today = new Date().toISOString().split('T')[0];
            
            // Get current active positions to compare
            const { data: currentPositions } = await supabase
                .from("member_positions")
                .select("position")
                .eq("member_id", id)
                .is("end_date", null);
            
            const currentPositionCodes = (currentPositions || []).map(p => p.position);
            const selectedSet = new Set(selectedPositions);
            const currentSet = new Set(currentPositionCodes);
            
            // Check if positions actually changed
            const positionsChanged = 
                selectedPositions.length !== currentPositionCodes.length ||
                !selectedPositions.every(pos => currentSet.has(pos)) ||
                !currentPositionCodes.every(pos => selectedSet.has(pos));
            
            if (positionsChanged) {
                // End all current active positions
                const { error: endError } = await supabase
                    .from("member_positions")
                    .update({ end_date: today })
                    .eq("member_id", id)
                    .is("end_date", null);

                if (endError) {
                    setError(endError.message);
                    setLoading(false);
                    return;
                }

                // Add new positions for selected ones
                if (selectedPositions.length > 0) {
                    // Remove duplicates from selectedPositions
                    const uniqueSelectedPositions = [...new Set(selectedPositions.filter(pos => pos))];
                    
                    // Check for existing positions with the same start_date to avoid duplicates
                    const { data: existingToday } = await supabase
                        .from("member_positions")
                        .select("position")
                        .eq("member_id", id)
                        .eq("start_date", today)
                        .is("end_date", null);
                    
                    const existingPositionCodes = new Set((existingToday || []).map(p => p.position));
                    
                    // Only insert positions that don't already exist for today
                    const positionsToInsert = uniqueSelectedPositions
                        .filter(position => !existingPositionCodes.has(position))
                        .map(position => ({
                            member_id: id,
                            position: position,
                            start_date: today,
                            end_date: null
                        }));

                    if (positionsToInsert.length > 0) {
                        const { error: insertError } = await supabase
                            .from("member_positions")
                            .insert(positionsToInsert);

                        if (insertError) {
                            setError(insertError.message);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }
        }

        navigate("/team-members");
        setLoading(false);
    };

    const handlePositionToggle = (positionCode) => {
        setSelectedPositions(prev => {
            if (prev.includes(positionCode)) {
                return prev.filter(p => p !== positionCode);
            } else {
                return [...prev, positionCode];
            }
        });
    };

    if (loading || !form) return <p className="text-center mt-10">Loading...</p>;

    return (
        <div className="max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-4 md:p-6">
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(form).map((field) =>
                    ["id", "created_at", "updated_at", "admin_flag", "photo_url", "position"].includes(field)
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
                        ) : field === "shirt_size" ? (
                            <div key={field} className="col-span-1">
                                <label className="block text-sm font-medium mb-1 capitalize">
                                    {field.replaceAll("_", " ")}
                                </label>
                                <select
                                    name={field}
                                    value={form[field] ?? ""}
                                    onChange={handleChange}
                                    className="w-full border rounded-md px-3 py-2"
                                >
                                    <option value="">Select size (optional)</option>
                                    <option value="XS">XS</option>
                                    <option value="S">S</option>
                                    <option value="M">M</option>
                                    <option value="L">L</option>
                                    <option value="XL">XL</option>
                                    <option value="XXL">XXL</option>
                                    <option value="XXXL">XXXL</option>
                                </select>
                            </div>
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

                {/* Position Selection - Admin Only */}
                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Position(s)</label>
                    {!isAdmin ? (
                        <p className="text-sm text-gray-500">Only admins can edit positions.</p>
                    ) : availablePositions.length === 0 ? (
                        <p className="text-sm text-gray-500">Loading positions...</p>
                    ) : (
                        <div className="border rounded-md p-4 bg-gray-50 max-h-64 overflow-y-auto">
                            <div className="space-y-2">
                                {availablePositions.map((pos) => {
                                    const positionCode = pos.code || '';
                                    const displayName = pos.name || pos.description || pos.code || positionCode;
                                    const isSelected = selectedPositions.includes(positionCode);
                                    return (
                                        <label
                                            key={positionCode}
                                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handlePositionToggle(positionCode)}
                                                disabled={loading}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                                {displayName}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {selectedPositions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600">
                                        <strong>Selected:</strong> {selectedPositions.length} position{selectedPositions.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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