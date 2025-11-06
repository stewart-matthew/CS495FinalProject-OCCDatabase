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

function UpdateShoeboxModal({ isOpen, onClose, churches, shoeboxFieldName, refreshChurches }) {
    const [updates, setUpdates] = useState({});
    const [loading, setLoading] = useState(false);
    const shoeboxYear = shoeboxFieldName.split('_')[1];

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
        setLoading(true);
        const updatesToRun = [];

        churches.forEach(church => {
            const oldValue = church[shoeboxFieldName] || null;
            const newValue = updates[church.church_name] === '' ? null : parseInt(updates[church.church_name], 10);

            if (newValue !== oldValue) {
                const updatePayload = { [shoeboxFieldName]: newValue };
                updatesToRun.push(
                    supabase
                        .from("church")
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
                            {churches.map((church) => (
                                <tr key={church.church_name}>
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
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        churchName: "",
        zipcode: "",
        shoebox_2025: "",
        sortBy: "",
        selectedCounties: [],
        selectedYear: 2025,
    });
    const navigate = useNavigate();

    const shoeboxFieldName = `shoebox_${filters.selectedYear}`;
    const modalShoeboxField = `shoebox_${filters.selectedYear}`;

    // Fetch churches with optional filters
    async function getChurches(filterValues = filters) {
        setLoading(true);
        let query = supabase.from("church").select("*");

        if (filterValues.churchName) {
            const searchValue = filterValues.churchName.replace(/ /g, "_");
            query = query.ilike("church_name", `%${searchValue}%`);
        }
        if (filterValues.zipcode) query = query.eq("physical_zip", filterValues.zipcode);
        const shoeboxField = `shoebox_${filterValues.selectedYear}`;
        if (filterValues.shoebox_2025) query = query.gte(shoeboxField, filterValues.shoebox_2025);
        if (filterValues.selectedCounties.length > 0) query = query.in("physical_county", filterValues.selectedCounties);

        const { data, error } = await query;
        if (error) {
            console.error("Error fetching churches:", error);
            setChurches([]);
        } else {
            let sortedData = [...data];
            const shoeboxField = `shoebox_${filterValues.selectedYear}`;
            if (filterValues.sortBy === "shoebox_desc") {
                sortedData.sort((a, b) => (b[shoeboxField] || 0) - (a[shoeboxField] || 0));
            } else if (filterValues.sortBy === "name_asc") {
                sortedData.sort((a, b) => a.church_name.localeCompare(b.church_name));
            } else if (filterValues.sortBy === "name_desc") {
                sortedData.sort((a, b) => b.church_name.localeCompare(a.church_name));
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
        getChurches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) return <p>Loading...</p>;
    if (churches.length === 0 && filters.selectedCounties.length > 0) return <p>No churches found in the selected counties.</p>;
    if (churches.length === 0) return <p>No churches found.</p>;

    return (
        <div className="max-w-6xl mx-auto mt-10">
            <UpdateShoeboxModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                churches={churches}
                shoeboxFieldName={modalShoeboxField}
                refreshChurches={() => getChurches()}
            />
            
            <div className="flex justify-between items-center mb-6">
                <button
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    onClick={() => setIsModalOpen(true)}
                >
                    Update  {filters.selectedYear} Shoebox Counts
                </button>

                {/* Add Church Button */}
                <div className="flex justify-end">
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => navigate("/add-church")}
                    >
                        Add Church
                    </button>
                </div>
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
                        value={filters.shoebox_2025}
                        onChange={(e) => setFilters({ ...filters, shoebox_2025: e.target.value })}
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
                            const clearedFilters = { churchName: "", zipcode: "", shoebox_2025: "", sortBy: "", selectedCounties: [], selectedYear: 2025 };
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
                                <option value="2023">2023</option>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                            </select>
                        </div>
                        <div>
                            <label className="mr-2 font-medium">Sort by:</label>
                            <select
                                value={filters.sortBy || ""}
                                onChange={(e) => {
                                    const sortBy = e.target.value;
                                    const newFilters = { ...filters, sortBy };
                                    setFilters(newFilters);
                                    getChurches(newFilters);
                                }}
                                className="border p-2 rounded"
                            >
                                <option value="">Select...</option>
                                <option value="shoebox_desc">Shoebox Count (High → Low)</option>
                                <option value="name_asc">Name (A → Z)</option>
                                <option value="name_desc">Name (Z → A)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Church Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {churches.map((church) => (
                    <div key={church.church_name} className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-2">{church.church_name.replace(/_/g, " ")}</h2>
                            <p className="text-gray-700">{church.physical_city}, {church.physical_state} - <strong>{church.physical_county} County</strong></p>
                            {church[shoeboxFieldName] !== undefined && <p className="text-gray-700"><strong>Shoebox {filters.selectedYear}:</strong> {church[shoeboxFieldName]}</p>}
                            {church.physical_zip && <p className="text-gray-700"><strong>Zip Code:</strong> {church.physical_zip}</p>}
                        </div>
                        {church.photo_url && (
                            <PrivateBucketImage
                                filePath={church.photo_url}
                                className="max-w-full h-auto rounded mt-2"
                            />
                        )}
                        <button
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            onClick={() => navigate(`/church/${encodeURIComponent(church.church_name)}`)}
                        >
                            Church Information
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}