import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function PrivateBucketImage({ filePath, className, showPlaceholder = false }) {
    const [signedUrl, setSignedUrl] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!filePath || showPlaceholder) {
            setError(true);
            return;
        }

        const getSignedUrl = async () => {
            // If it's already a full URL, use it
            if (filePath.startsWith('http')) {
                setSignedUrl(filePath);
                return;
            }

            // signed URL
            const { data, error: urlError } = await supabase.storage
                .from('Team Images')
                .createSignedUrl(filePath, 3600); // images lasts for 1 hour

            if (urlError || !data) {
                setError(true);
            } else {
                setSignedUrl(data.signedUrl);
            }
        };

        getSignedUrl();
    }, [filePath, showPlaceholder]);

    if (error || !filePath || showPlaceholder) {
        return (
            <div className={`bg-gray-200 flex items-center justify-center text-gray-500 text-xs text-center p-2 ${className}`}>
                No picture added
            </div>
        );
    }

    if (!signedUrl) {
        return <div className={`bg-gray-200 flex items-center justify-center ${className}`}>Loading...</div>;
    }

    return <img src={signedUrl} alt="Profile" className={className} onError={() => setError(true)} />;
}

export default function TeamMembers() {
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copyStatus, setCopyStatus] = useState(null);
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchFilters, setSearchFilters] = useState({
        name: "",
        churchName: "",
        county: "",
    });
    const navigate = useNavigate();

    // Fetch current logged-in user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: memberData, error } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("email", user.email)
                    .single();
                if (error) {
                    // Error fetching current user
                } else {
                    setCurrentUser(memberData);
                }
            }
        };
        fetchUser();
    }, []);

    // Fetch team members with church data
    useEffect(() => {
        const fetchMembers = async () => {
            const { data: membersData, error } = await supabase
                .from("team_members")
                .select(`*, member_positions(position, end_date)`);

            if (error) {
                setMembers([]);
                setLoading(false);
                return;
            }

            // Fetch church data for each member
            const membersWithChurchData = await Promise.all(
                membersData.map(async (m) => {
                    let churchData = null;
                    if (m.church_affiliation_name) {
                        const { data: church, error: churchError } = await supabase
                            .from("church2")
                            .select("church_name, physical_county")
                            .eq("church_name", m.church_affiliation_name)
                            .single();
                        
                        if (!churchError && church) {
                            churchData = church;
                        }
                    }
                    
                    // Filter to only active positions (no end_date)
                    let positionsText = "N/A";
                    if (Array.isArray(m.member_positions) && m.member_positions.length > 0) {
                        const activePositions = m.member_positions
                            .filter(p => !p.end_date) // Only positions without end_date
                            .map((p) => p.position)
                            .filter(Boolean);
                        if (activePositions.length > 0) {
                            positionsText = activePositions.join(", ");
                        }
                    }

                    return {
                        ...m,
                        position: positionsText,
                        church_name: churchData?.church_name || m.church_affiliation_name || null,
                        church_county: churchData?.physical_county || null,
                    };
                })
            );

            setMembers(membersWithChurchData);
            setLoading(false);
        };

        fetchMembers();
    }, []);

    // Apply search filters
    useEffect(() => {
        let filtered = [...members];

        // Filter by name
        if (searchFilters.name) {
            const searchTerm = searchFilters.name.toLowerCase();
            filtered = filtered.filter(member => 
                `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm) ||
                member.first_name.toLowerCase().includes(searchTerm) ||
                member.last_name.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by church name
        if (searchFilters.churchName) {
            const searchTerm = searchFilters.churchName.toLowerCase();
            filtered = filtered.filter(member => 
                member.church_name && member.church_name.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by county
        if (searchFilters.county) {
            const searchTerm = searchFilters.county.toLowerCase();
            filtered = filtered.filter(member => 
                member.church_county && member.church_county.toLowerCase().includes(searchTerm)
            );
        }

        setFilteredMembers(filtered);
    }, [members, searchFilters]);

    // Clear status messages after a short delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setCopyStatus(null);
            setDownloadStatus(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, [copyStatus, downloadStatus]);

    const copyAllEmailsToClipboard = async () => {
        const emails = filteredMembers
            .filter((member) => member.email)
            .map((member) => member.email)
            .join(", ");

        if (!emails) {
            setCopyStatus("error");
            return;
        }

        try {
            await navigator.clipboard.writeText(emails);
            setCopyStatus("success");
        } catch (err) {
            setCopyStatus("error");
        }
    };

    const downloadAllAddresses = () => {
        const addresses = filteredMembers.filter(
            (m) => m.home_address && m.home_city && m.home_state && m.home_zip
        );

        if (addresses.length === 0) {
            setDownloadStatus("error");
            return;
        }

        const headers = ["First Name", "Last Name", "Address", "City", "State", "Zip"];
        const csvRows = [headers.join(",")];

        addresses.forEach((member) => {
            const row = [
                `"${member.first_name}"`,
                `"${member.last_name}"`,
                `"${member.home_address}"`,
                `"${member.home_city}"`,
                `"${member.home_state}"`,
                `"${member.home_zip}"`,
            ].join(",");
            csvRows.push(row);
        });

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "team_member_addresses.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadStatus("success");
    };


    if (loading) return <p className="text-center mt-10">Loading team members...</p>;

    const isAdmin =
        currentUser &&
        (currentUser.admin_flag === true || currentUser.admin_flag === "true");

    // Split filtered members into active and former
    const activeMembers = filteredMembers.filter((m) => m.active === true || m.active === "true");
    const formerMembers = filteredMembers.filter((m) => m.active === false || m.active === "false");

    return (
        <div className="max-w-6xl mx-auto mt-10 px-4">
            <h1 className="text-3xl font-bold mb-6">Team Members</h1>

            {/* Search Filters */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchFilters.name}
                            onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                            className="w-full border rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Church Name</label>
                        <input
                            type="text"
                            placeholder="Search by church..."
                            value={searchFilters.churchName}
                            onChange={(e) => setSearchFilters({ ...searchFilters, churchName: e.target.value })}
                            className="w-full border rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">County</label>
                        <input
                            type="text"
                            placeholder="Search by county..."
                            value={searchFilters.county}
                            onChange={(e) => setSearchFilters({ ...searchFilters, county: e.target.value })}
                            className="w-full border rounded-md p-2"
                        />
                    </div>
                </div>
                <button
                    onClick={() => setSearchFilters({ name: "", churchName: "", county: "" })}
                    className="mt-4 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                    Clear Filters
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div className="text-gray-600">
                    Showing {filteredMembers.length} of {members.length} team members
                </div>
                <div className="flex flex-wrap gap-2">
                    {copyStatus === "success" && (
                        <span className="text-sm font-semibold text-green-600 self-center">Emails copied! 📋</span>
                    )}
                    {copyStatus === "error" && (
                        <span className="text-sm font-semibold text-red-600 self-center">No emails found.</span>
                    )}

                    <button
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                        onClick={copyAllEmailsToClipboard}
                    >
                        Copy All Emails
                    </button>

                    {downloadStatus === "success" && (
                        <span className="text-sm font-semibold text-green-600 self-center">Downloaded! 👇</span>
                    )}
                    {downloadStatus === "error" && (
                        <span className="text-sm font-semibold text-red-600 self-center">No addresses found.</span>
                    )}

                    <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                        onClick={downloadAllAddresses}
                    >
                        Download Addresses (CSV)
                    </button>

                    {isAdmin && (
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                            onClick={() => navigate("/add-member")}
                        >
                            Add Team Member
                        </button>
                    )}
                </div>
            </div>

            {/* Active Members */}
            {activeMembers.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Active Members</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeMembers.map((member) => (
                            <div key={member.id} className="bg-white shadow-lg rounded-xl p-6 flex flex-col hover:shadow-xl transition-shadow">
                                <div className="flex justify-center mb-4">
                                    <PrivateBucketImage
                                        filePath={member.photo_url}
                                        showPlaceholder={!member.photo_url}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                    />
                                </div>
                                
                                <h2 className="text-xl font-bold text-center mb-2">
                                    {member.first_name} {member.last_name}
                                </h2>
                                
                                <div className="space-y-2 mb-4 text-sm">
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Email:</strong> {member.email || "N/A"}
                                    </p>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Phone:</strong> {member.phone_number || "N/A"}
                                    </p>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Position:</strong> {member.position}
                                    </p>
                                    {member.church_name && (
                                        <p className="text-gray-600">
                                            <strong className="text-gray-800">Church:</strong> {member.church_name.replace(/_/g, " ")}
                                        </p>
                                    )}
                                    {member.church_county && (
                                        <p className="text-gray-600">
                                            <strong className="text-gray-800">County:</strong> {member.church_county}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-auto space-y-2">
                                    <button
                                        onClick={() => navigate(`/team-member/${member.id}`)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        View Profile
                                    </button>

                                    {isAdmin && (
                                        <button
                                            onClick={() => navigate(`/edit-member/${member.id}`)}
                                            className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                                        >
                                            Edit Member
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Former Members Section (admins only) */}
            {isAdmin && formerMembers.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-gray-600">Former Members</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {formerMembers.map((member) => (
                            <div key={member.id} className="bg-gray-50 shadow-md rounded-xl p-6 flex flex-col opacity-75">
                                <div className="flex justify-center mb-4">
                                    <PrivateBucketImage
                                        filePath={member.photo_url}
                                        showPlaceholder={!member.photo_url}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-300"
                                    />
                                </div>
                                
                                <h2 className="text-xl font-bold text-center mb-2">
                                    {member.first_name} {member.last_name}
                                </h2>
                                
                                <div className="space-y-2 mb-4 text-sm">
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Email:</strong> {member.email || "N/A"}
                                    </p>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Phone:</strong> {member.phone_number || "N/A"}
                                    </p>
                                    <p className="text-gray-600">
                                        <strong className="text-gray-800">Position:</strong> {member.position}
                                    </p>
                                    {member.church_name && (
                                        <p className="text-gray-600">
                                            <strong className="text-gray-800">Church:</strong> {member.church_name.replace(/_/g, " ")}
                                        </p>
                                    )}
                                    {member.church_county && (
                                        <p className="text-gray-600">
                                            <strong className="text-gray-800">County:</strong> {member.church_county}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-auto space-y-2">
                                    <button
                                        onClick={() => navigate(`/team-member/${member.id}`)}
                                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        View Profile
                                    </button>

                                    <button
                                        onClick={() => navigate(`/edit-member/${member.id}`)}
                                        className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                                    >
                                        Edit Member
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredMembers.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-600 text-lg">No team members found matching your search criteria.</p>
                </div>
            )}
        </div>
    );
}