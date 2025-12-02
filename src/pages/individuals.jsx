import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Individuals() {
    const [individuals, setIndividuals] = useState([]);
    const [filteredIndividuals, setFilteredIndividuals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copyStatus, setCopyStatus] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const [editingIndividual, setEditingIndividual] = useState(null);
    const [savingIndividual, setSavingIndividual] = useState(false);
    const navigate = useNavigate();
    
    // Filter states
    const [filters, setFilters] = useState({
        churchName: "",
        activeToEmails: null, // null = all, true = active, false = inactive
        craftIdeas: false,
        packingPartyIdeas: false,
        fundraisingIdeas: false,
        gettingMorePeopleInvolved: false,
        presentationAtChurch: false,
        resources: false,
        other: false,
    });
    
    // Sort state
    const [sortBy, setSortBy] = useState("name_asc"); // name_asc, name_desc, church_asc, church_desc

    useEffect(() => {
        async function getIndividuals() {
            const { data, error } = await supabase
                .from("individuals")
                .select("*")
                .order("first_name", { ascending: true });
            
            if (error) {
                setIndividuals([]);
            } else {
                setIndividuals(data || []);
            }
            setLoading(false);
        }
        getIndividuals();
    }, []);

    // Fetch current team member and check admin status
    useEffect(() => {
        async function getCurrentTeamMember() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: memberData, error } = await supabase
                    .from("team_members")
                    .select("*")
                    .eq("email", user.email)
                    .single();
                if (error) {
                    // Error fetching current team member
                } else {
                    // Check if user is admin
                    setIsAdmin(memberData?.admin_flag === true || memberData?.admin_flag === "true");
                }
            }
        }
        getCurrentTeamMember();
    }, []);

    // Apply filters and sorting
    useEffect(() => {
        let filtered = [...individuals];

        // Filter by church name
        if (filters.churchName) {
            const searchValue = filters.churchName.replace(/ /g, "_");
            filtered = filtered.filter(ind => 
                ind.church_name && ind.church_name.toLowerCase().includes(searchValue.toLowerCase())
            );
        }

        // Filter by active to emails
        if (filters.activeToEmails !== null) {
            filtered = filtered.filter(ind => ind.active_to_emails === filters.activeToEmails);
        }

        // Filter by resource checkboxes
        if (filters.craftIdeas) {
            filtered = filtered.filter(ind => ind.craft_ideas === true);
        }
        if (filters.packingPartyIdeas) {
            filtered = filtered.filter(ind => ind.packing_party_ideas === true);
        }
        if (filters.fundraisingIdeas) {
            filtered = filtered.filter(ind => ind.fundraising_ideas === true);
        }
        if (filters.gettingMorePeopleInvolved) {
            filtered = filtered.filter(ind => ind.getting_more_people_involved === true);
        }
        if (filters.presentationAtChurch) {
            filtered = filtered.filter(ind => ind.presentation_at_church_group === true);
        }
        if (filters.resources) {
            filtered = filtered.filter(ind => ind.resources === true);
        }
        if (filters.other) {
            filtered = filtered.filter(ind => ind.other === true && ind.other_description);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name_asc":
                    const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
                    const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
                    return nameA.localeCompare(nameB);
                case "name_desc":
                    const nameA2 = `${a.first_name} ${a.last_name}`.toLowerCase();
                    const nameB2 = `${b.first_name} ${b.last_name}`.toLowerCase();
                    return nameB2.localeCompare(nameA2);
                case "church_asc":
                    const churchA = (a.church_name || "").toLowerCase();
                    const churchB = (b.church_name || "").toLowerCase();
                    return churchA.localeCompare(churchB);
                case "church_desc":
                    const churchA2 = (a.church_name || "").toLowerCase();
                    const churchB2 = (b.church_name || "").toLowerCase();
                    return churchB2.localeCompare(churchA2);
                default:
                    return 0;
            }
        });

        setFilteredIndividuals(filtered);
    }, [individuals, filters, sortBy]);

    const copyAllEmails = async () => {
        // Only copy emails from active individuals
        const emails = filteredIndividuals
            .filter(ind => ind.email && ind.active_to_emails === true)
            .map(ind => ind.email)
            .join(", ");

        if (!emails) {
            setCopyStatus("error");
            return;
        }

        try {
            await navigator.clipboard.writeText(emails);
            setCopyStatus("success");
            setTimeout(() => setCopyStatus(null), 3000);
        } catch (err) {
            setCopyStatus("error");
            setTimeout(() => setCopyStatus(null), 3000);
        }
    };

    const toggleActiveStatus = async (individual) => {
        if (!isAdmin) {
            alert("Only admins can update active/inactive status.");
            return;
        }

        const newStatus = !individual.active_to_emails;
        
        const { error } = await supabase
            .from("individuals")
            .update({ active_to_emails: newStatus })
            .eq("id", individual.id);

        if (error) {
            alert("Failed to update status. Please try again.");
        } else {
            // Update local state
            setIndividuals(prev => 
                prev.map(ind => 
                    ind.id === individual.id 
                        ? { ...ind, active_to_emails: newStatus }
                        : ind
                )
            );
        }
    };

    const handleRowClick = (individual) => {
        if (!isAdmin) return;
        
        if (expandedRow === individual.id) {
            setExpandedRow(null);
            setEditingIndividual(null);
        } else {
            setExpandedRow(individual.id);
            setEditingIndividual({
                craft_ideas: individual.craft_ideas || false,
                packing_party_ideas: individual.packing_party_ideas || false,
                fundraising_ideas: individual.fundraising_ideas || false,
                getting_more_people_involved: individual.getting_more_people_involved || false,
                presentation_at_church_group: individual.presentation_at_church_group || false,
                resources: individual.resources || false,
                other: individual.other || false,
                other_description: individual.other_description || "",
                notes: individual.notes || "",
            });
        }
    };

    const handleSaveIndividual = async (individualId) => {
        if (!isAdmin || !editingIndividual) return;

        setSavingIndividual(true);

        const updateData = {
            craft_ideas: editingIndividual.craft_ideas,
            packing_party_ideas: editingIndividual.packing_party_ideas,
            fundraising_ideas: editingIndividual.fundraising_ideas,
            getting_more_people_involved: editingIndividual.getting_more_people_involved,
            presentation_at_church_group: editingIndividual.presentation_at_church_group,
            resources: editingIndividual.resources,
            other: editingIndividual.other,
            other_description: editingIndividual.other ? editingIndividual.other_description : null,
            notes: editingIndividual.notes,
        };

        const { error } = await supabase
            .from("individuals")
            .update(updateData)
            .eq("id", individualId);

        if (error) {
            alert("Failed to update individual. Please try again.");
        } else {
            // Update local state
            setIndividuals(prev => 
                prev.map(ind => 
                    ind.id === individualId 
                        ? { ...ind, ...updateData }
                        : ind
                )
            );
            setExpandedRow(null);
            setEditingIndividual(null);
        }
        setSavingIndividual(false);
    };

    const handleCancelEdit = () => {
        setExpandedRow(null);
        setEditingIndividual(null);
    };

    if (loading) return <p className="text-center mt-10">Loading individuals...</p>;

    return (
        <div className="max-w-6xl mx-auto mt-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Individuals</h1>
                {isAdmin && (
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => navigate("/add-individual")}
                    >
                        Add Individual
                    </button>
                )}
            </div>

            {/* Filters Section */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Church Name</label>
                        <input
                            type="text"
                            placeholder="Search by church..."
                            value={filters.churchName}
                            onChange={(e) => setFilters({ ...filters, churchName: e.target.value })}
                            className="w-full border rounded-md p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Active to Emails</label>
                        <select
                            value={filters.activeToEmails === null ? "all" : filters.activeToEmails ? "true" : "false"}
                            onChange={(e) => {
                                const value = e.target.value === "all" ? null : e.target.value === "true";
                                setFilters({ ...filters, activeToEmails: value });
                            }}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="all">All</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Sort By</label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full border rounded-md p-2"
                        >
                            <option value="name_asc">Name (A → Z)</option>
                            <option value="name_desc">Name (Z → A)</option>
                            <option value="church_asc">Church (A → Z)</option>
                            <option value="church_desc">Church (Z → A)</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={copyAllEmails}
                            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                        >
                            {copyStatus === "success" ? "✓ Copied!" : copyStatus === "error" ? "No Emails" : "Copy All Emails"}
                        </button>
                    </div>
                </div>

                {/* Resource Checkboxes */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Filter by Resources Requested:</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.craftIdeas}
                                onChange={(e) => setFilters({ ...filters, craftIdeas: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Craft Ideas</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.packingPartyIdeas}
                                onChange={(e) => setFilters({ ...filters, packingPartyIdeas: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Packing Party Ideas</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.fundraisingIdeas}
                                onChange={(e) => setFilters({ ...filters, fundraisingIdeas: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Fundraising Ideas</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.gettingMorePeopleInvolved}
                                onChange={(e) => setFilters({ ...filters, gettingMorePeopleInvolved: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Getting More People Involved</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.presentationAtChurch}
                                onChange={(e) => setFilters({ ...filters, presentationAtChurch: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Presentation at Church/Group</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.resources}
                                onChange={(e) => setFilters({ ...filters, resources: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Resources</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={filters.other}
                                onChange={(e) => setFilters({ ...filters, other: e.target.checked })}
                                className="rounded"
                            />
                            <span className="text-sm">Other</span>
                        </label>
                    </div>
                </div>

                <button
                    onClick={() => {
                        setFilters({
                            churchName: "",
                            activeToEmails: null,
                            craftIdeas: false,
                            packingPartyIdeas: false,
                            fundraisingIdeas: false,
                            gettingMorePeopleInvolved: false,
                            presentationAtChurch: false,
                            resources: false,
                            other: false,
                        });
                        setSortBy("name_asc");
                    }}
                    className="mt-4 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                >
                    Clear All Filters
                </button>
            </div>

            {/* Results Count */}
            <div className="mb-4">
                <p className="text-gray-600">
                    Showing {filteredIndividuals.length} of {individuals.length} individuals
                </p>
            </div>

            {/* Individuals Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Church</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active to Emails</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resources Requested</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredIndividuals.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                        No individuals found matching the filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredIndividuals.map((ind) => (
                                    <>
                                        <tr 
                                            key={ind.id} 
                                            className={`hover:bg-gray-50 ${isAdmin ? "cursor-pointer" : ""} ${expandedRow === ind.id ? "bg-blue-50" : ""}`}
                                            onClick={() => handleRowClick(ind)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {ind.first_name} {ind.last_name}
                                                {isAdmin && expandedRow === ind.id && <span className="ml-2 text-blue-600 text-xs">(Click to collapse)</span>}
                                                {isAdmin && expandedRow !== ind.id && <span className="ml-2 text-gray-400 text-xs">(Click to edit)</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {ind.email || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {ind.church_name ? ind.church_name.replace(/_/g, " ") : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                                <label className={`flex items-center ${isAdmin ? "cursor-pointer" : "cursor-not-allowed"}`}>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={ind.active_to_emails || false}
                                                            onChange={() => toggleActiveStatus(ind)}
                                                            disabled={!isAdmin}
                                                            className="sr-only"
                                                        />
                                                        <div className={`block w-14 h-8 rounded-full transition-colors ${
                                                            ind.active_to_emails ? "bg-green-500" : "bg-gray-300"
                                                        } ${!isAdmin ? "opacity-60" : ""}`}></div>
                                                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
                                                            ind.active_to_emails ? "transform translate-x-6" : ""
                                                        }`}></div>
                                                    </div>
                                                    <span className={`ml-3 text-xs font-medium ${
                                                        ind.active_to_emails ? "text-green-700" : "text-gray-600"
                                                    }`}>
                                                        {ind.active_to_emails ? "Active" : "Inactive"}
                                                    </span>
                                                </label>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {ind.craft_ideas && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Craft Ideas</span>
                                                    )}
                                                    {ind.packing_party_ideas && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Packing Party</span>
                                                    )}
                                                    {ind.fundraising_ideas && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Fundraising</span>
                                                    )}
                                                    {ind.getting_more_people_involved && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">More People</span>
                                                    )}
                                                    {ind.presentation_at_church_group && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Presentation</span>
                                                    )}
                                                    {ind.resources && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Resources</span>
                                                    )}
                                                    {ind.other && ind.other_description && (
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs" title={ind.other_description}>
                                                            Other: {ind.other_description.length > 20 ? ind.other_description.substring(0, 20) + "..." : ind.other_description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === ind.id && isAdmin && editingIndividual && (
                                            <tr key={`${ind.id}-expand`}>
                                                <td colSpan="5" className="px-6 py-4 bg-gray-50">
                                                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                                        <h3 className="font-semibold text-lg mb-3">Edit Individual - {ind.first_name} {ind.last_name}</h3>
                                                        
                                                        {/* Resource Checkboxes */}
                                                        <div>
                                                            <label className="block text-sm font-medium mb-2">Resources Requested:</label>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.craft_ideas}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, craft_ideas: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Craft Ideas</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.packing_party_ideas}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, packing_party_ideas: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Packing Party Ideas</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.fundraising_ideas}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, fundraising_ideas: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Fundraising Ideas</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.getting_more_people_involved}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, getting_more_people_involved: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Getting More People Involved</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.presentation_at_church_group}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, presentation_at_church_group: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Presentation at Church/Group</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.resources}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, resources: e.target.checked })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Resources</span>
                                                                </label>
                                                                <label className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={editingIndividual.other}
                                                                        onChange={(e) => setEditingIndividual({ ...editingIndividual, other: e.target.checked, other_description: e.target.checked ? editingIndividual.other_description : "" })}
                                                                        disabled={savingIndividual}
                                                                        className="rounded"
                                                                    />
                                                                    <span className="text-sm">Other</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {/* Other Description */}
                                                        {editingIndividual.other && (
                                                            <div>
                                                                <label className="block text-sm font-medium mb-1">
                                                                    Other Description (max 500 characters):
                                                                </label>
                                                                <textarea
                                                                    value={editingIndividual.other_description}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.slice(0, 500);
                                                                        setEditingIndividual({ ...editingIndividual, other_description: value });
                                                                    }}
                                                                    maxLength={500}
                                                                    disabled={savingIndividual}
                                                                    className="w-full border rounded-md p-2 min-h-[80px]"
                                                                    placeholder="Describe what other resources are needed..."
                                                                />
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {editingIndividual.other_description.length}/500 characters
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Notes */}
                                                        <div>
                                                            <label className="block text-sm font-medium mb-1">
                                                                Notes (max 1000 characters):
                                                            </label>
                                                            <textarea
                                                                value={editingIndividual.notes}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.slice(0, 1000);
                                                                    setEditingIndividual({ ...editingIndividual, notes: value });
                                                                }}
                                                                maxLength={1000}
                                                                disabled={savingIndividual}
                                                                className="w-full border rounded-md p-2 min-h-[100px]"
                                                                placeholder="Add notes about this individual..."
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {editingIndividual.notes.length}/1000 characters
                                                            </p>
                                                        </div>

                                                        {/* Save/Cancel Buttons */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleSaveIndividual(ind.id)}
                                                                disabled={savingIndividual}
                                                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
                                                            >
                                                                {savingIndividual ? "Saving..." : "Save Changes"}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                disabled={savingIndividual}
                                                                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

