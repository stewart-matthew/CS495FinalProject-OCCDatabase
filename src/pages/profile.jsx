// src/pages/profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

// Add the PrivateBucketImage component for profile photos
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

            // signed URL for Team Images bucket
            const { data } = await supabase.storage
                .from('Team Images')
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

    return <img src={signedUrl} alt="Profile" className={className} />;
}

const MANAGED_BY = {
    "Area Coordinator": "ALL",
    "Church Relations Coordinator": ["Church Relations Team Member"],
    "Logistics Coordinator": ["Central Dropoff Team Leader", "Dropoff Team Leader"],
    "Prayer Team Coordinator": ["Prayer Team Member"],
    "Community Relations Coordinator": ["Community Relations Team Member"],
    "Student Relations Coordinator": ["Student Relations Team Member"],
    "Media Support Team Member": [],
};

export default function Profile() {
    const [user, setUser] = useState(null);
    const [memberData, setMemberData] = useState(null);
    const [positions, setPositions] = useState([]); // array
    const [activeTab, setActiveTab] = useState("profile"); // "profile" | "myTeam"
    const [team, setTeam] = useState([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const [teamError, setTeamError] = useState(null);
    const [myNotes, setMyNotes] = useState([]);
    const [myChurches, setMyChurches] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [churchesLoading, setChurchesLoading] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteContent, setEditingNoteContent] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [affiliatedChurch, setAffiliatedChurch] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const getUserAndData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) {
                navigate("/login");
                return;
            }
            setUser(authUser);

            const { data: member, error: memberError } = await supabase
                .from("team_members")
                .select("*")
                .eq("email", authUser.email)
                .maybeSingle();

            if (memberError) {
                // Error fetching member data
            }

            setMemberData(member || null);

            if (member?.id) {
                const { data: posRows, error: posError } = await supabase
                    .from("member_positions")
                    .select("position")
                    .eq("member_id", member.id)
                    .is("end_date", null); // Only get active positions

                if (!posError && posRows) {
                    // Remove duplicates and get unique positions
                    const uniquePositions = [...new Set(posRows.map(r => r.position).filter(Boolean))];
                    setPositions(uniquePositions);
                }

                // Fetch affiliated church by name and city to get the correct one
                if (member.church_affiliation_name) {
                    // Try multiple name variants to handle both spaces and underscores
                    const churchNameVariants = [
                        member.church_affiliation_name, // Original
                        member.church_affiliation_name.replace(/ /g, "_"), // With underscores
                        member.church_affiliation_name.replace(/_/g, " ") // With spaces
                    ];
                    
                    let churchData = null;
                    
                    // Try each variant
                    for (const nameVariant of churchNameVariants) {
                        let churchQuery = supabase
                            .from("church2")
                            .select("id, church_name, church_physical_city, church_physical_state")
                            .eq("church_name", nameVariant);
                        
                        // If we have city info, filter by city to get the exact match
                        if (member.church_affiliation_city) {
                            churchQuery = churchQuery.ilike("church_physical_city", `%${member.church_affiliation_city}%`);
                        }
                        
                        const { data, error: churchError } = await churchQuery.maybeSingle();
                        
                        if (!churchError && data) {
                            churchData = data;
                            break; // Found it, stop searching
                        }
                    }
                    
                    if (churchData) {
                        setAffiliatedChurch(churchData);
                    }
                }
            } else {
                setPositions([]); // no member found → clear positions array
            }

        };

        getUserAndData();
    }, [navigate]);

    // Fetch notes added by current user
    useEffect(() => {
        async function getMyNotes() {
            if (!memberData?.id) return;

            setNotesLoading(true);
            // Try with foreign key join first
            let { data: notesData, error } = await supabase
                .from("notes")
                .select(`
          *,
          church2!notes_church_fkey(church_name)
        `)
                .eq("added_by_team_member_id", memberData.id)
                .order("created_at", { ascending: false });

            // If that fails, try without join
            if (error) {
                const { data: simpleData, error: simpleError } = await supabase
                    .from("notes")
                    .select("*")
                    .eq("added_by_team_member_id", memberData.id)
                    .order("created_at", { ascending: false });
                
                if (simpleError) {
                    setMyNotes([]);
                } else {
                    // Fetch church names separately
                    if (simpleData && simpleData.length > 0) {
                        const churchIds = [...new Set(simpleData.map(n => n.church_id).filter(Boolean))];
                        const { data: churchesData } = await supabase
                            .from("church2")
                            .select("id, church_name")
                            .in("id", churchIds);
                        
                        const churchesMap = {};
                        if (churchesData) {
                            churchesData.forEach(c => {
                                churchesMap[c.id] = c;
                            });
                        }
                        
                        notesData = simpleData.map(note => ({
                            ...note,
                            church: churchesMap[note.church_id] || null
                        }));
                    } else {
                        notesData = [];
                    }
                }
            }

            setMyNotes(notesData || []);
            setNotesLoading(false);
        }
        getMyNotes();
    }, [memberData]);

    // Fetch churches where user is the lead or project leader
    useEffect(() => {
        async function getMyChurches() {
            if (!memberData?.id) return;

            setChurchesLoading(true);
            const currentYear = new Date().getFullYear(); // Automatically updates when year changes
            const relationsField = `church_relations_member_${currentYear}`;

            // Fetch churches where user is the lead (church_relations_member_YEAR)
            const { data: leadChurches, error: leadError } = await supabase
                .from("church2")
                .select("id, church_name, church_physical_city, church_physical_state")
                .eq(relationsField, memberData.id);

            // Note: project_leader is now a boolean, not a name field
            // We don't fetch churches by project_leader name anymore
            const projectLeaderChurches = [];

            if (leadError) {
                // Error fetching lead churches
            }

            // Combine both results and remove duplicates
            const allChurches = [...(leadChurches || []), ...(projectLeaderChurches || [])];
            const uniqueChurches = Array.from(
                new Map(allChurches.map(church => [church.id, church])).values()
            ).sort((a, b) => (a.church_name || "").localeCompare(b.church_name || ""));

            setMyChurches(uniqueChurches);
            setChurchesLoading(false);
        }
        getMyChurches();
    }, [memberData]);

    const handleEditNote = (note) => {
        setEditingNoteId(note.id);
        setEditingNoteContent(note.content);
    };

    const handleCancelEditNote = () => {
        setEditingNoteId(null);
        setEditingNoteContent("");
    };

    const handleSaveNote = async (noteId) => {
        if (!editingNoteContent.trim()) {
            alert("Note content cannot be empty.");
            return;
        }

        if (!memberData?.id) {
            alert("Error: User information not available.");
            return;
        }

        setSavingNote(true);

        const { data, error } = await supabase
            .from("notes")
            .update({ content: editingNoteContent.trim() })
            .eq("id", noteId)
            .select();

        if (error) {
            alert(`Failed to update note: ${error.message}`);
        } else {
            if (data && data.length > 0) {
                setMyNotes(prev => prev.map(note => 
                    note.id === noteId 
                        ? { ...note, ...data[0] }
                        : note
                ));
                setEditingNoteId(null);
                setEditingNoteContent("");
            } else {
                alert("Failed to update note: The update was blocked. Please check your RLS policies.");
            }
        }
        setSavingNote(false);
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) {
            return;
        }

        const { data, error } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteId)
            .select();

        if (error) {
            alert(`Failed to delete note: ${error.message}`);
        } else {
            // Check if anything was actually deleted
            if (data && data.length > 0) {
                setMyNotes(prev => prev.filter(note => note.id !== noteId));
            } else {
                alert("Failed to delete note: The delete was blocked. Please check your RLS policies.");
            }
        }
    };

    const fetchMyTeam = async () => {
        if (!memberData) return;
        setActiveTab("myTeam");
        setTeamLoading(true);
        setTeamError(null);

        try {
            const scopes = positions.flatMap((p) => {
                const m = MANAGED_BY[p];
                return m ? [m] : [];
            });

            if (scopes.length === 0) {
                setTeam([]);
                return;
            }

            if (scopes.includes("ALL")) {
                const { data, error } = await supabase
                    .from("team_members")
                    .select("id, first_name, last_name, email, photo_url")
                    .order("last_name", { ascending: true });
                if (error) throw error;

                const members = data || [];

                // fetch and attach their positions
                const memberIds = members.map((m) => m.id);
                const { data: positionsData, error: posErr } = await supabase
                    .from("member_positions")
                    .select("member_id, position")
                    .in("member_id", memberIds);

                if (!posErr && positionsData) {
                    const posMap = {};
                    positionsData.forEach((p) => {
                        if (!posMap[p.member_id]) posMap[p.member_id] = [];
                        posMap[p.member_id].push(p.position);
                    });
                    members.forEach((m) => {
                        m.positions = posMap[m.id] || [];
                    });
                }

                setTeam(members);
                return;
            }

            const managedPositions = [...new Set(scopes.flat().filter(Boolean))];

            const { data: mpRows, error: mpErr } = await supabase
                .from("member_positions")
                .select("member_id, position")
                .in("position", managedPositions);

            if (mpErr) throw mpErr;

            const ids = [...new Set((mpRows || []).map((r) => r.member_id))];
            if (ids.length === 0) {
                setTeam([]);
                return;
            }

            const { data: members, error: tmErr } = await supabase
                .from("team_members")
                .select("id, first_name, last_name, email, photo_url, active")
                .in("id", ids)
                .eq("active", true);
                
            if (tmErr) throw tmErr;

            // fetch and attach their positions
            const { data: positionsData, error: posErr } = await supabase
                .from("member_positions")
                .select("member_id, position")
                .in("member_id", ids);

            if (!posErr && positionsData) {
                const posMap = {};
                positionsData.forEach((p) => {
                    if (!posMap[p.member_id]) posMap[p.member_id] = [];
                    posMap[p.member_id].push(p.position);
                });
                members.forEach((m) => {
                    m.positions = posMap[m.id] || [];
                });
            }

            const meId = memberData?.id;
            const unique = [...new Map((members || []).map((m) => [m.id, m])).values()]
                .filter((m) => m.id !== meId)
                .sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""));
            setTeam(unique);
        } catch (e) {
            setTeamError("Could not load your team.");
            setTeam([]);
        } finally {
            setTeamLoading(false);
        }
    };


    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/login");
    };

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold mb-4">Profile</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab("profile")}
                        className={`px-3 py-2 rounded ${activeTab === "profile" ? "bg-gray-900 text-white" : "bg-gray-200"}`}
                    >
                        Profile
                    </button>
                    <button
                        onClick={fetchMyTeam}
                        className={`px-3 py-2 rounded ${activeTab === "myTeam" ? "bg-emerald-700 text-white" : "bg-emerald-200"}`}
                    >
                        My Team
                    </button>
                </div>
            </div>

            {/* PROFILE TAB */}
            {activeTab === "profile" && user && memberData ? (
                <>
                    {/* Profile Photo Section */}
                    {memberData.photo_url && (
                        <div className="mb-4 flex justify-center">
                            <PrivateBucketImage
                                filePath={memberData.photo_url}
                                className="w-32 h-32 object-cover rounded-full"
                            />
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Basic Information */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
                            <div className="space-y-1 text-gray-700">
                                <p><strong>Name:</strong> {memberData.first_name} {memberData.last_name}</p>
                                <p><strong>Email:</strong> {memberData.email || user.email || "N/A"}</p>
                                <p><strong>Phone:</strong> {memberData.phone_number || "N/A"}</p>
                                {memberData.alt_phone_number && (
                                    <p><strong>Alt Phone:</strong> {memberData.alt_phone_number}</p>
                                )}
                                <p><strong>Active Status:</strong> {memberData.active ? "Active" : "Inactive"}</p>
                            </div>
                        </div>

                        {/* Positions */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Position{positions.length !== 1 ? "s" : ""}</h2>
                            {positions.length === 0 ? (
                                <p className="text-gray-600">Currently no positions assigned to user.</p>
                            ) : (
                                <ul className="list-disc ml-6">
                                    {positions.map((p, i) => (<li key={i}>{p}</li>))}
                                </ul>
                            )}
                        </div>

                        {/* Home Address */}
                        {(memberData.home_address || memberData.home_city || memberData.home_state || memberData.home_zip || memberData.home_county) && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Home Address</h2>
                                <p className="text-gray-700">
                                    {[
                                        memberData.home_address,
                                        memberData.home_city,
                                        memberData.home_state,
                                        memberData.home_zip
                                    ].filter(Boolean).join(", ")}
                                    {memberData.home_county && ` - ${memberData.home_county} County`}
                                </p>
                            </div>
                        )}

                        {/* Personal Information */}
                        {(memberData.date_of_birth || memberData.shirt_size) && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
                                <div className="space-y-1 text-gray-700">
                                    {memberData.date_of_birth && (
                                        <p><strong>Date of Birth:</strong> {
                                            (() => {
                                                // Handle date string to avoid timezone issues
                                                const dob = memberData.date_of_birth;
                                                if (typeof dob === 'string') {
                                                    // If it's a date string (YYYY-MM-DD), parse it directly
                                                    const [year, month, day] = dob.split('-');
                                                    if (year && month && day) {
                                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                                    }
                                                }
                                                // Fallback to standard date parsing
                                                return new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                            })()
                                        }</p>
                                    )}
                                    {memberData.shirt_size && (
                                        <p><strong>Shirt Size:</strong> {memberData.shirt_size}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Church Affiliation */}
                        {(memberData.church_affiliation_name || memberData.church_affiliation_city || memberData.church_affiliation_state || memberData.church_affiliation_county) && (
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Church Affiliation</h2>
                                <div className="space-y-1 text-gray-700">
                                    {memberData.church_affiliation_name && (
                                        <p>
                                            <strong>Church Name:</strong>{" "}
                                            {affiliatedChurch ? (
                                                <button
                                                    onClick={() => {
                                                        const cityParam = memberData.church_affiliation_city 
                                                            ? `?city=${encodeURIComponent(memberData.church_affiliation_city)}`
                                                            : '';
                                                        navigate(`/church/${encodeURIComponent(affiliatedChurch.church_name)}${cityParam}`);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {memberData.church_affiliation_name.replace(/_/g, " ")}
                                                </button>
                                            ) : (
                                                memberData.church_affiliation_name.replace(/_/g, " ")
                                            )}
                                        </p>
                                    )}
                                    {(memberData.church_affiliation_city || memberData.church_affiliation_state || memberData.church_affiliation_county) && (
                                        <p>
                                            <strong>Location:</strong>{" "}
                                            {[
                                                memberData.church_affiliation_city,
                                                memberData.church_affiliation_state
                                            ].filter(Boolean).join(", ")}
                                            {memberData.church_affiliation_county && ` - ${memberData.church_affiliation_county} County`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Link
                            to="/editProfile"
                            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Edit Information
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                        >
                            Logout
                        </button>
                    </div>
                </>
            ) : null}

            {/* MY TEAM TAB */}
            {activeTab === "myTeam" && (
                <div className="mt-2">
                    <h2 className="text-lg font-semibold mb-2">My Team — West Alabama</h2>
                    {teamLoading ? (
                        <p>Loading…</p>
                    ) : teamError ? (
                        <p className="text-red-600">{teamError}</p>
                    ) : team.length === 0 ? (
                        <p>No team members found for your current leadership role(s).</p>
                    ) : (
                        <ul className="divide-y">
                            {team.map((m) => (
                                <li key={m.id} className="py-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Team member photo */}
                                        {m.photo_url && (
                                            <PrivateBucketImage
                                                filePath={m.photo_url}
                                                className="w-12 h-12 object-cover rounded-full"
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium">{m.first_name} {m.last_name}
                                                {m.positions && m.positions.length > 0 && (
                                                    <span className="ml-2 text-gray-500 text-sm italic">
                                                        ({m.positions.join(", ")})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">{m.email}</div>
                                        </div>
                                    </div>
                                    <Link
                                        to={`/team-member/${m.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View details
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* MY NOTES SECTION */}
            {activeTab === "profile" && memberData && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">My Notes</h2>
                    {notesLoading ? (
                        <p>Loading notes...</p>
                    ) : myNotes.length === 0 ? (
                        <p className="text-gray-600">You haven't added any notes yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {myNotes.map((note) => {
                                const noteDate = new Date(note.created_at).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                });
                                const churchName = note.church?.church_name
                                    ? note.church.church_name.replace(/_/g, " ")
                                    : "Unknown Church";

                                const isEditing = editingNoteId === note.id;

                                return (
                                    <div key={note.id} className="bg-gray-50 p-3 rounded border">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm text-gray-600">
                                                <strong>Church:</strong>{" "}
                                                {note.church_id && note.church?.church_name ? (
                                                    <button
                                                        onClick={() => navigate(`/church/${encodeURIComponent(note.church.church_name)}`)}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {churchName}
                                                    </button>
                                                ) : (
                                                    churchName
                                                )}
                                                {" - "}
                                                {noteDate}
                                            </p>
                                            <div className="flex gap-2">
                                                {!isEditing && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleEditNote(note);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleDeleteNote(note.id);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editingNoteContent}
                                                    onChange={(e) => setEditingNoteContent(e.target.value)}
                                                    className="w-full border rounded-md p-2 min-h-[80px]"
                                                    disabled={savingNote}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleSaveNote(note.id);
                                                        }}
                                                        disabled={savingNote}
                                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-green-300"
                                                    >
                                                        {savingNote ? "Saving..." : "Save"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleCancelEditNote();
                                                        }}
                                                        disabled={savingNote}
                                                        className="bg-gray-300 text-black px-3 py-1 rounded text-sm hover:bg-gray-400"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MY CHURCHES SECTION */}
            {activeTab === "profile" && memberData && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold mb-2">My Churches</h2>
                    {churchesLoading ? (
                        <p>Loading churches...</p>
                    ) : myChurches.length === 0 ? (
                            <p className="text-gray-600">You are not currently the Church Relations Point of Contact for any churches.</p>
                    ) : (
                        <ul className="divide-y">
                            {myChurches.map((church) => (
                                <li key={church.id} className="py-2 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">
                                            {church.church_name?.replace(/_/g, " ") || "Unknown"}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {church["church_physical_city"]}, {church["church_physical_state"]}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/church/${encodeURIComponent(church.church_name)}`)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View Church
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {(!user || !memberData) && activeTab === "profile" && <p>Loading...</p>}
        </div>
    );
}