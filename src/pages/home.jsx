import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const COUNTY_OPTIONS = ["Pickens", "Fayette", "Lamar", "Tuscaloosa"];

// PrivateBucketImage component for church images
function PrivateBucketImage({ filePath, className }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        const getSignedUrl = async () => {
            if (!filePath) return;

            // If it's already a full URL, use it
            if (filePath.startsWith('http')) {
                setSignedUrl(filePath);
                return;
            }

            // signed URL for Church Images bucket
            const { data } = await supabase.storage
                .from('Church Images')
                .createSignedUrl(filePath, 3600);

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

function UpdateShoeboxModal({ isOpen, onClose, churches, shoeboxFieldName, refreshChurches, isAdmin }) {
    const [updates, setUpdates] = useState({});
    const [loading, setLoading] = useState(false);
    const shoeboxYear = shoeboxFieldName.split('_')[1];

    // If not admin, close modal immediately
    useEffect(() => {
        if (isOpen && !isAdmin) {
            onClose();
        }
    }, [isOpen, isAdmin, onClose]);

    useEffect(() => {
        if (isOpen) {
            const initialUpdates = {};
            churches.forEach(church => {
                initialUpdates[church.church_name] = church[shoeboxFieldName] || '';
            });
            setUpdates(initialUpdates);
        }
    }, [isOpen, churches, shoeboxFieldName]);
    const handleChange = (churchName, value) => {
        const numericValue = value === '' ? null : parseInt(value, 10);
        setUpdates(prev => ({
            ...prev,
            [churchName]: isNaN(numericValue) ? '' : value,
        }));
    };

    const handleSubmit = async () => {
        if (!isAdmin) {
            onClose();
            return;
        }
        setLoading(true);
        const updatesToRun = [];

        churches.forEach(church => {
            const oldValue = church[shoeboxFieldName] || null;
            const newValue = updates[church.church_name] === '' ? null : parseInt(updates[church.church_name], 10);

            if (newValue !== oldValue) {
                const updatePayload = { [shoeboxFieldName]: newValue };
                updatesToRun.push(
                    supabase
                        .from("church2")
                        .update(updatePayload)
                        .eq("church_name", church.church_name)
                );
            }
        });

        await Promise.all(updatesToRun);
        setLoading(false);
        refreshChurches();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <h3 className="text-xl font-bold mb-4">Update {shoeboxYear} Shoebox Counts</h3>
                <div className="max-h-96 overflow-y-auto mb-4 border p-2 rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Church</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {churches.map((church, index) => (
                                <tr key={church.id || church.church_name || `church-${index}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{church.church_name.replace(/_/g, " ")}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-28">
                                        <input
                                            type="number"
                                            min="0"
                                            value={updates[church.church_name] === null ? '' : updates[church.church_name]}
                                            onChange={(e) => handleChange(church.church_name, e.target.value)}
                                            className="w-full border rounded-md p-1 text-center"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Save All Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Home() {
    // Get current year dynamically
    const currentYear = new Date().getFullYear();
    
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [filters, setFilters] = useState({
        churchName: "",
        zipcode: "",
        shoeboxMin: "",
        sortBy: "name_asc", // Default to alphabetical
        selectedCounties: [],
        selectedYear: currentYear,
    });
    const navigate = useNavigate();

    const shoeboxFieldName = `shoebox_${filters.selectedYear}`;
    const modalShoeboxField = `shoebox_${filters.selectedYear}`;

    // Fetch churches with optional filters
    async function getChurches(filterValues = filters) {
        setLoading(true);
        // Explicitly select all fields including relations member fields
        let query = supabase.from("church2").select("*");

        if (filterValues.churchName) {
            const searchValue = filterValues.churchName.replace(/ /g, "_");
            query = query.ilike("church_name", `%${searchValue}%`);
        }
        if (filterValues.zipcode) query = query.eq("church_physical_zip", filterValues.zipcode);
        const shoeboxField = `shoebox_${filterValues.selectedYear}`;
        if (filterValues.shoeboxMin) query = query.gte(shoeboxField, filterValues.shoeboxMin);
        if (filterValues.selectedCounties.length > 0) query = query.in("church_physical_county", filterValues.selectedCounties);

        const { data, error } = await query;
        if (error) {
            setChurches([]);
        } else {
            // Get current year relations member field
            const currentYear = new Date().getFullYear();
            const relationsField = `church_relations_member_${currentYear}`;
            
            // Collect all unique team member IDs from relations member fields
            // Note: church_relations_member_* fields are text type, storing team member IDs
            const teamMemberIds = new Set();
            data.forEach(church => {
                const relationsId = church[relationsField];
                if (relationsId) {
                    // Store as string and trim whitespace
                    const idStr = String(relationsId).trim();
                    if (idStr && idStr !== "null" && idStr !== "undefined") {
                        teamMemberIds.add(idStr);
                        // Also add original (in case of any formatting differences)
                        teamMemberIds.add(String(relationsId));
                    }
                }
            });
            
            // Fetch team member names
            let teamMembersMap = {};
            if (teamMemberIds.size > 0) {
                // Convert to array and filter out empty strings and invalid values
                const idArray = Array.from(teamMemberIds).filter(id => id && id !== "null" && id !== "undefined" && id.trim() !== "");
                if (idArray.length > 0) {
                    // Query team members - Supabase should handle UUID conversion from text automatically
                    // But we'll ensure IDs are valid UUID format strings
                    const validUuidArray = idArray.filter(id => {
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        return uuidRegex.test(String(id).trim());
                    });
                    
                    if (validUuidArray.length > 0) {
                        const { data: teamMembersData, error: teamError } = await supabase
                            .from("team_members")
                            .select("id, first_name, last_name")
                            .in("id", validUuidArray);
                        
                        if (teamError) {
                            console.error("Error fetching team members:", teamError, "IDs queried:", validUuidArray);
                        }
                        
                        if (teamMembersData && teamMembersData.length > 0) {
                            teamMembersData.forEach(member => {
                                const memberName = `${member.first_name} ${member.last_name}`;
                                // Store with multiple formats for flexible lookup
                                const memberId = member.id;
                                const memberIdStr = String(memberId).trim();
                                const memberIdLower = memberIdStr.toLowerCase();
                                
                                // Store with various formats to ensure we can find it
                                teamMembersMap[memberIdStr] = memberName;
                                teamMembersMap[String(memberId)] = memberName;
                                teamMembersMap[memberIdLower] = memberName;
                                // Also store the UUID object if it exists
                                if (memberId) {
                                    teamMembersMap[memberId] = memberName;
                                }
                            });
                        }
                    }
                }
            }
            
            // Map team member names to churches and determine project leader name
            const churchesWithTeamMembers = data.map(church => {
                // Get POC name - use email as fallback if name is empty
                const pocFirstName = church["church_POC_first_name"] || "";
                const pocLastName = church["church_POC_last_name"] || "";
                let pocName = `${pocFirstName} ${pocLastName}`.trim();
                if (!pocName && church["church_POC_email"]) {
                    pocName = church["church_POC_email"];
                }
                
                // Determine project leader name
                let projectLeaderName = "N/A";
                if (church.project_leader === true) {
                    // POC is the project leader
                    projectLeaderName = pocName || "N/A";
                } else if (church.project_leader === false) {
                    // Different person
                    projectLeaderName = "Different from POC";
                }
                
                // Get relations member name - check if the ID exists in our map
                const relationsMemberId = church[relationsField];
                let relationsMemberName = "N/A";
                if (relationsMemberId) {
                    // Convert to string for consistent lookup - handle both UUID and text formats
                    const memberIdStr = String(relationsMemberId).trim();
                    const memberIdLower = memberIdStr.toLowerCase();
                    
                    // Try multiple lookup strategies
                    if (teamMembersMap[memberIdStr]) {
                        relationsMemberName = teamMembersMap[memberIdStr];
                    } else if (teamMembersMap[memberIdLower]) {
                        relationsMemberName = teamMembersMap[memberIdLower];
                    } else if (teamMembersMap[String(relationsMemberId)]) {
                        relationsMemberName = teamMembersMap[String(relationsMemberId)];
                    } else {
                        // Try case-insensitive match and also check all keys
                        const foundKey = Object.keys(teamMembersMap).find(key => 
                            key.toLowerCase() === memberIdLower || 
                            key.trim().toLowerCase() === memberIdLower ||
                            String(key).toLowerCase() === memberIdLower
                        );
                        if (foundKey) {
                            relationsMemberName = teamMembersMap[foundKey];
                        }
                    }
                }
                
                return {
                    ...church,
                    relationsMemberName: relationsMemberName,
                    projectLeaderName: projectLeaderName,
                    pocName: pocName
                };
            });
            
            // Sort by church name alphabetically by default
            let sortedData = [...churchesWithTeamMembers];
            const shoeboxField = `shoebox_${filterValues.selectedYear}`;
            if (filterValues.sortBy === "shoebox_desc") {
                sortedData.sort((a, b) => (b[shoeboxField] || 0) - (a[shoeboxField] || 0));
            } else if (filterValues.sortBy === "name_desc") {
                sortedData.sort((a, b) => b.church_name.localeCompare(a.church_name));
            } else {
                // Default: alphabetical by name (name_asc or no sort specified)
                sortedData.sort((a, b) => a.church_name.localeCompare(b.church_name));
            }
            setChurches(sortedData);
        }
        setLoading(false);
    }

    const toggleCountyFilter = (county) => {
        const isSelected = filters.selectedCounties.includes(county);
        const newSelectedCounties = isSelected
            ? filters.selectedCounties.filter((c) => c !== county)
            : [...filters.selectedCounties, county];
        const newFilters = { ...filters, selectedCounties: newSelectedCounties };
        setFilters(newFilters);
        getChurches(newFilters);
    };

    useEffect(() => {
        const checkAdminStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: memberData } = await supabase
                    .from("team_members")
                    .select("admin_flag")
                    .eq("email", user.email)
                    .single();
                
                setIsAdmin(memberData?.admin_flag === true || memberData?.admin_flag === "true");
            }
        };
        checkAdminStatus();
    }, []);

    useEffect(() => {
        getChurches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <p>Loading...</p>;
    if (churches.length === 0 && filters.selectedCounties.length > 0) return <p>No churches found in the selected counties.</p>;
    if (churches.length === 0) return <p>No churches found.</p>;

    return (
        <div className="max-w-6xl mx-auto mt-10 px-4 md:px-0">
            <UpdateShoeboxModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                churches={churches}
                shoeboxFieldName={modalShoeboxField}
                refreshChurches={() => getChurches()}
                isAdmin={isAdmin}
            />
            
            <div className="flex justify-between items-center mb-6">
                {/* Update Shoebox Counts Button - Admin Only */}
                {isAdmin && (
                    <button
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Update {filters.selectedYear} Shoebox Counts
                    </button>
                )}
                
                {/* Add Church Button - Admin Only */}
                {isAdmin && (
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => navigate("/add-church")}
                    >
                        Add Church
                    </button>
                )}
            </div>

            {/* County Filters */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Filter by County</h2>
                <div className="flex flex-wrap gap-3">
                    {COUNTY_OPTIONS.map((county) => (
                        <button
                            key={county}
                            onClick={() => toggleCountyFilter(county)}
                            className={`px-4 py-2 rounded-full font-medium transition-colors ${filters.selectedCounties.includes(county)
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-200 text-gray-700 hover:bg-blue-200"
                                }`}
                        >
                            {county}
                        </button>
                    ))}
                </div>
            </div>

            {/* Other Filters */}
            <div className="mb-6 bg-gray-100 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-3">Other Filters</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="Search by church name"
                        value={filters.churchName}
                        onChange={(e) => setFilters({ ...filters, churchName: e.target.value })}
                        className="border p-2 rounded w-full md:w-1/3"
                    />
                    <input
                        type="text"
                        placeholder="Filter by zipcode"
                        value={filters.zipcode}
                        onChange={(e) => setFilters({ ...filters, zipcode: e.target.value })}
                        className="border p-2 rounded w-full md:w-1/3"
                    />
                    <input
                        type="number"
                        placeholder={`Minimum shoebox ${filters.selectedYear}`}
                        value={filters.shoeboxMin}
                        onChange={(e) => setFilters({ ...filters, shoeboxMin: e.target.value })}
                        className="border p-2 rounded w-full md:w-1/3"
                    />
                </div>

                <div className="mt-4 flex flex-col md:flex-row md:items-center gap-4">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={() => getChurches()}
                    >
                        Apply Other Filters
                    </button>

                    <button
                        className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                        onClick={() => {
                            const clearedFilters = { churchName: "", zipcode: "", shoeboxMin: "", sortBy: "", selectedCounties: [], selectedYear: currentYear };
                            setFilters(clearedFilters);
                            getChurches(clearedFilters);
                        }}
                    >
                        Clear All Filters
                    </button>

                    {/* Year and Sort Dropdowns */}
                    <div className="ml-auto flex gap-4 items-center">
                        <div>
                            <label className="mr-2 font-medium">Year:</label>
                            <select
                                value={filters.selectedYear}
                                onChange={(e) => {
                                    const selectedYear = parseInt(e.target.value);
                                    const newFilters = { ...filters, selectedYear };
                                    setFilters(newFilters);
                                    getChurches(newFilters);
                                }}
                                className="border p-2 rounded"
                            >
                                {Array.from({ length: currentYear - 2022 }, (_, i) => 2023 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mr-2 font-medium">Sort by:</label>
                            <select
                                value={filters.sortBy || "name_asc"}
                                onChange={(e) => {
                                    const sortBy = e.target.value;
                                    const newFilters = { ...filters, sortBy };
                                    setFilters(newFilters);
                                    getChurches(newFilters);
                                }}
                                className="border p-2 rounded"
                            >
                                <option value="name_asc">Name (A → Z)</option>
                                <option value="name_desc">Name (Z → A)</option>
                                <option value="shoebox_desc">Shoebox Count (High → Low)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Church Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {churches.map((church, index) => (
                    <div key={church.id || church.church_name || `church-card-${index}`} className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-2">{church.church_name.replace(/_/g, " ")}</h2>
                            <p className="text-gray-700">{church["church_physical_city"]}, {church["church_physical_state"]} - <strong>{church["church_physical_county"]} County</strong></p>
                            {church[shoeboxFieldName] !== undefined && <p className="text-gray-700"><strong>Shoebox {filters.selectedYear}:</strong> {church[shoeboxFieldName]}</p>}
                            {church.pocName && (
                                <p className="text-gray-700"><strong>Point of Contact:</strong> {church.pocName}</p>
                            )}
                            {!church.pocName && church["church_POC_email"] && (
                                <p className="text-gray-700"><strong>Point of Contact:</strong> {church["church_POC_email"]}</p>
                            )}
                            <p className="text-gray-700">
                                <strong>Project Leader:</strong> {church.projectLeaderName || "N/A"}
                            </p>
                            <p className="text-gray-700"><strong>Church Relations Team Member:</strong> {church.relationsMemberName}</p>
                        </div>
                        {church.photo_url && (
                            <PrivateBucketImage
                                filePath={church.photo_url}
                                className="max-w-full h-auto rounded mt-2"
                            />
                        )}
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            onClick={() => {
                                // Use the actual church name from database (may have spaces or underscores)
                                const actualChurchName = church.church_name;
                                const cityParam = church["church_physical_city"] 
                                    ? `?city=${encodeURIComponent(church["church_physical_city"])}`
                                    : '';
                                // Encode the church name as-is from the database
                                navigate(`/church/${encodeURIComponent(actualChurchName)}${cityParam}`);
                            }}
                        >
                            Church Information
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}