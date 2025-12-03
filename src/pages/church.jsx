import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const [searchParams] = useSearchParams();
  const [church, setChurch] = useState(null);
  const [individuals, setIndividuals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentTeamMember, setCurrentTeamMember] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [isEditingShoebox, setIsEditingShoebox] = useState(false);
  const [shoeboxEditValues, setShoeboxEditValues] = useState({});
  const [savingShoebox, setSavingShoebox] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isEditingProjectLeader, setIsEditingProjectLeader] = useState(false);
  const [selectedProjectLeader, setSelectedProjectLeader] = useState(false);
  const [savingProjectLeader, setSavingProjectLeader] = useState(false);
  const [isEditingRelationsMember, setIsEditingRelationsMember] = useState(false);
  const [selectedRelationsMember, setSelectedRelationsMember] = useState("");
  const [savingRelationsMember, setSavingRelationsMember] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const navigate = useNavigate();
  
  // Get current year dynamically - automatically switches to 2026 when the year changes
  const SHOEBOX_YEAR = new Date().getFullYear();
  const relationsFieldName = `church_relations_member_${SHOEBOX_YEAR}`; 

  useEffect(() => {
    async function getChurch() {
      // Decode the church name from URL (may have spaces or underscores)
      const decodedChurchName = decodeURIComponent(churchName);
      const city = searchParams.get("city");
      
      // Try multiple formats: exact match, with spaces, with underscores
      const churchNameVariants = [
        decodedChurchName, // Original from URL
        decodedChurchName.replace(/ /g, "_"), // With underscores
        decodedChurchName.replace(/_/g, " ") // With spaces
      ];
      
      let churchData = null;
      
      // Try each variant
      for (const nameVariant of churchNameVariants) {
        let query = supabase
          .from("church2")
          .select("*")
          .eq("church_name", nameVariant);
        
        // If city is provided in query params, filter by city to get the exact match
        if (city) {
          query = query.ilike("church_physical_city", `%${city}%`);
        }
        
        const { data, error } = await query.maybeSingle();
        
        if (!error && data) {
          churchData = data;
          break; // Found it, stop searching
        }
      }
      
      // If still not found and we have city, try without city filter
      if (!churchData && city) {
        for (const nameVariant of churchNameVariants) {
          const { data, error } = await supabase
            .from("church2")
            .select("*")
            .eq("church_name", nameVariant)
            .maybeSingle();
          
          if (!error && data) {
            churchData = data;
            break;
          }
        }
      }
      
      if (churchData) {
        setChurch(churchData);
      }
      setLoading(false);
    }
    getChurch();
  }, [churchName, searchParams]);

  // Fetch current team member
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
          setCurrentTeamMember(memberData);
          // Check if user is admin
          setIsAdmin(memberData?.admin_flag === true || memberData?.admin_flag === "true");
        }
      }
    }
    getCurrentTeamMember();
  }, []);

  // Fetch all team members for admin dropdown
  useEffect(() => {
    async function getAllTeamMembers() {
      if (!isAdmin) return;
      
      const { data, error } = await supabase
        .from("team_members")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true });
      
      if (error) {
        // Error fetching team members
      } else {
        setTeamMembers(data || []);
      }
    }
    getAllTeamMembers();
  }, [isAdmin]);

  // Fetch notes for this church
  useEffect(() => {
    async function getNotes() {
      if (!church) return;
      
      const { data: notesData, error } = await supabase
        .from("notes")
        .select(`
          *,
          team_members!added_by_team_member_id(first_name, last_name)
        `)
        .eq("church_id", church.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        // Error fetching notes
      } else {
        setNotes(notesData || []);
      }
      setNotesLoading(false);
    }
    getNotes();
  }, [church]);

  useEffect(() => {
    async function getIndividuals() {
      // Convert spaces to underscores to match database format
      const dbChurchName = churchName.replace(/ /g, "_");
      const { data, error } = await supabase
        .from("individuals")
        .select("*")
        .eq("church_name", dbChurchName);
      if (error) {
        setIndividuals([]);
      } else {
        setIndividuals(data || []);
      }
      setIndividualsLoading(false);
    }
    getIndividuals();
  }, [churchName]);

  const shoeboxYears = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

  const handleEditShoebox = () => {
    if (!church || !isAdmin) return;
    const values = {};
    shoeboxYears.forEach(year => {
      const fieldName = `shoebox_${year}`;
      values[year] = church[fieldName] !== undefined && church[fieldName] !== null ? church[fieldName].toString() : "";
    });
    setShoeboxEditValues(values);
    setIsEditingShoebox(true);
  };

  const handleCancelEditShoebox = () => {
    setIsEditingShoebox(false);
    setShoeboxEditValues({});
  };

  const handleShoeboxValueChange = (year, value) => {
    setShoeboxEditValues({ ...shoeboxEditValues, [year]: value });
  };

  const handleSaveShoebox = async () => {
    if (!church || !isAdmin) return;
    
    setSavingShoebox(true);
    
    // Validate all values
    const updateData = {};
    for (const year of shoeboxYears) {
      const value = shoeboxEditValues[year];
      if (value === "" || value === null || value === undefined) {
        updateData[`shoebox_${year}`] = null;
      } else {
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) {
          alert(`Please enter a valid number for year ${year} or leave blank.`);
          setSavingShoebox(false);
          return;
        }
        updateData[`shoebox_${year}`] = numericValue;
      }
    }

    // Convert spaces to underscores to match database format
    const dbChurchName = church.church_name.replace(/ /g, "_");
    const { error } = await supabase
      .from("church2")
      .update(updateData)
      .eq("church_name", dbChurchName);

    if (error) {
      alert("Failed to update shoebox counts. Please try again.");
    } else {
      // Update local state
      setChurch({ ...church, ...updateData });
      setIsEditingShoebox(false);
      setShoeboxEditValues({});
    }
    setSavingShoebox(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !church || !currentTeamMember) return;

    const { error } = await supabase
      .from("notes")
      .insert({
        church_id: church.id,
        team_member_id: currentTeamMember.id,
        content: newNote.trim(),
        added_by_team_member_id: currentTeamMember.id,
      });

    if (error) {
      alert("Failed to add note. Please try again.");
    } else {
      setNewNote("");
      // Refresh notes
      const { data: notesData, error: fetchError } = await supabase
        .from("notes")
        .select(`
          *,
          team_members!added_by_team_member_id(first_name, last_name)
        `)
        .eq("church_id", church.id)
        .order("created_at", { ascending: false });
      
      if (!fetchError && notesData) {
        setNotes(notesData);
      }
    }
  };

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

    if (!currentTeamMember?.id) {
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
        // Refresh notes
        const { data: notesData, error: fetchError } = await supabase
          .from("notes")
          .select(`
            *,
            team_members!added_by_team_member_id(first_name, last_name)
          `)
          .eq("church_id", church.id)
          .order("created_at", { ascending: false });
        
        if (!fetchError && notesData) {
          setNotes(notesData);
        }
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

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      alert(`Failed to delete note: ${error.message}`);
    } else {
      // Refresh notes
      const { data: notesData, error: fetchError } = await supabase
        .from("notes")
        .select(`
          *,
          team_members!added_by_team_member_id(first_name, last_name)
        `)
        .eq("church_id", church.id)
        .order("created_at", { ascending: false });
      
      if (!fetchError && notesData) {
        setNotes(notesData);
      }
    }
  };

  const handleEditProjectLeader = () => {
    if (!isAdmin) return;
    setIsEditingProjectLeader(true);
    // Set current project leader value (boolean)
    setSelectedProjectLeader(church.project_leader || false);
  };

  const handleCancelEditProjectLeader = () => {
    setIsEditingProjectLeader(false);
    setSelectedProjectLeader(false);
  };

  const handleSaveProjectLeader = async () => {
    if (!church || !isAdmin) return;
    
    setSavingProjectLeader(true);
    
    // Convert spaces to underscores to match database format
    const dbChurchName = church.church_name.replace(/ /g, "_");
    const { error } = await supabase
      .from("church2")
      .update({ project_leader: selectedProjectLeader })
      .eq("church_name", dbChurchName);

    if (error) {
      alert("Failed to update project leader. Please try again.");
    } else {
      // Update local state
      setChurch({ ...church, project_leader: selectedProjectLeader });
      setIsEditingProjectLeader(false);
      setSelectedProjectLeader(false);
    }
    setSavingProjectLeader(false);
  };

  const handleEditRelationsMember = () => {
    if (!isAdmin) return;
    setIsEditingRelationsMember(true);
    // Set current relations member as selected
    if (church[relationsFieldName]) {
      setSelectedRelationsMember(church[relationsFieldName]);
    } else {
      setSelectedRelationsMember("");
    }
  };

  const handleCancelEditRelationsMember = () => {
    setIsEditingRelationsMember(false);
    setSelectedRelationsMember("");
  };

  const handleSaveRelationsMember = async () => {
    if (!church || !isAdmin) return;
    
    setSavingRelationsMember(true);
    
    // Convert spaces to underscores to match database format
    const dbChurchName = church.church_name.replace(/ /g, "_");
    const updateData = { [relationsFieldName]: selectedRelationsMember || null };
    
    const { error } = await supabase
      .from("church2")
      .update(updateData)
      .eq("church_name", dbChurchName);

    if (error) {
      alert("Failed to update church relations team member. Please try again.");
    } else {
      // Update local state
      setChurch({ ...church, [relationsFieldName]: selectedRelationsMember || null });
      setIsEditingRelationsMember(false);
      setSelectedRelationsMember("");
    }
    setSavingRelationsMember(false);
  };

  if (loading) return <p>Loading church...</p>;
  if (!church) return <p>Church not found.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 md:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left side - Church Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-4">{church.church_name.replace(/_/g, " ")}</h1>
            
            {/* Basic Contact Information */}
            <div className="space-y-2 text-gray-700 mb-4">
              {church["church_phone_number"] && (
                <p><strong>Phone:</strong> {church["church_phone_number"]}</p>
              )}
              {church["church_POC_first_name"] && church["church_POC_last_name"] && (
                <p><strong>Point of Contact:</strong> {church["church_POC_first_name"]} {church["church_POC_last_name"]}</p>
              )}
              <p><strong>Project Leader:</strong> {
                church.project_leader === true
                  ? `${church["church_POC_first_name"] || ""} ${church["church_POC_last_name"] || ""}`.trim() || "POC"
                  : "Different from POC"
              }</p>
            </div>

            {/* Shoebox Counts Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">Shoebox Counts</h2>
                {!isEditingShoebox && isAdmin && (
                  <button
                    onClick={handleEditShoebox}
                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                  >
                    Edit Shoebox Counts
                  </button>
                )}
              </div>
              {isEditingShoebox ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {shoeboxYears.map((year) => (
                      <div key={year} className="flex flex-col">
                        <label className="text-sm text-gray-600 mb-1">{year}</label>
                        <input
                          type="number"
                          min="0"
                          value={shoeboxEditValues[year] || ""}
                          onChange={(e) => handleShoeboxValueChange(year, e.target.value)}
                          placeholder="0"
                          className="w-full border rounded-md p-2 text-center"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleSaveShoebox}
                      disabled={savingShoebox}
                      className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600 disabled:bg-green-300"
                    >
                      {savingShoebox ? "Saving..." : "Save All"}
                    </button>
                    <button
                      onClick={handleCancelEditShoebox}
                      disabled={savingShoebox}
                      className="bg-gray-300 text-black px-4 py-2 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {shoeboxYears.map((year) => {
                    const fieldName = `shoebox_${year}`;
                    const value = church[fieldName];
                    return (
                      <div key={year} className="bg-gray-50 p-2 rounded border">
                        <div className="text-xs text-gray-500 mb-1">{year}</div>
                        <div className="text-lg font-semibold text-gray-800">
                          {value !== undefined && value !== null ? value : "N/A"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Physical Address */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Physical Address</h2>
              <div className="space-y-1 text-gray-700">
                {church["church_physical_address"] && (
                  <p>{church["church_physical_address"]}</p>
                )}
                <p>
                  {[
                    church["church_physical_city"],
                    church["church_physical_state"],
                    church["church_physical_zip"]
                  ].filter(Boolean).join(", ")}
                </p>
                {church["church_physical_county"] && (
                  <p>{church["church_physical_county"]} County</p>
                )}
              </div>
            </div>

            {/* Mailing Address (if different) */}
            {church["church_mailing_address"] && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Mailing Address</h2>
                <div className="space-y-1 text-gray-700">
                  {church["church_mailing_address"] && <p>{church["church_mailing_address"]}</p>}
                </div>
              </div>
            )}

            {/* Church Contact Information */}
            {(church.church_contact || church["church_POC_phone"] || church["church_POC_email"]) && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Church Contact</h2>
                <div className="space-y-1 text-gray-700">
                  {church.church_contact && (
                    <p><strong>Contact Name:</strong> {church.church_contact}</p>
                  )}
                  {church["church_POC_phone"] && (
                    <p><strong>POC Phone:</strong> {church["church_POC_phone"]}</p>
                  )}
                  {church["church_POC_email"] && (
                    <p><strong>POC Email:</strong> {church["church_POC_email"]}</p>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {church.notes && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Notes</h2>
                <div className="bg-gray-50 p-3 rounded border text-gray-700 whitespace-pre-wrap">
                  {church.notes}
                </div>
              </div>
            )}

            {/* Created Date */}
            {church.created_at && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  <strong>Created:</strong> {new Date(church.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          <div className="text-gray-700 mb-2 flex items-center gap-2">
            <span><strong>Is POC the Project Leader?</strong></span>
            {isEditingProjectLeader && isAdmin ? (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProjectLeader}
                    onChange={(e) => setSelectedProjectLeader(e.target.checked)}
                    disabled={savingProjectLeader}
                    className="w-4 h-4"
                  />
                  <span>Yes, the POC is the Project Leader</span>
                </label>
                <button
                  onClick={handleSaveProjectLeader}
                  disabled={savingProjectLeader}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-green-300"
                >
                  {savingProjectLeader ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEditProjectLeader}
                  disabled={savingProjectLeader}
                  className="bg-gray-300 text-black px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>{church.project_leader === true ? "Yes" : "No"}</span>
                {isAdmin && (
                  <button
                    onClick={handleEditProjectLeader}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="text-gray-700 mb-2 flex items-center gap-2">
            <span><strong>Church Relations Team Member:</strong></span>
            {isEditingRelationsMember && isAdmin ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedRelationsMember}
                  onChange={(e) => setSelectedRelationsMember(e.target.value)}
                  className="border rounded-md p-1"
                  disabled={savingRelationsMember}
                >
                  <option value="">None</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveRelationsMember}
                  disabled={savingRelationsMember}
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-green-300"
                >
                  {savingRelationsMember ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEditRelationsMember}
                  disabled={savingRelationsMember}
                  className="bg-gray-300 text-black px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span>
                  {(() => {
                    const relationsMemberId = church[relationsFieldName];
                    if (relationsMemberId) {
                      const member = teamMembers.find(m => m.id === relationsMemberId);
                      return member ? `${member.first_name} ${member.last_name}` : "N/A";
                    }
                    return "N/A";
                  })()}
                </span>
                {isAdmin && (
                  <button
                    onClick={handleEditRelationsMember}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Notes Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Notes</h2>
          
          {/* Add Note Form */}
          {currentTeamMember && (
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full border rounded-md p-2 mb-2 min-h-[80px]"
              />
              <button
                onClick={handleAddNote}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Add Note
              </button>
            </div>
          )}

          {/* Notes List */}
          {notesLoading ? (
            <p className="text-gray-500">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-gray-500">No notes yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notes.map((note) => {
                const addedBy = note.team_members;
                const addedByName = addedBy 
                  ? `${addedBy.first_name} ${addedBy.last_name}`
                  : "Unknown";
                const noteDate = new Date(note.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                
                const isEditing = editingNoteId === note.id;
                const isNoteOwner = currentTeamMember && note.added_by_team_member_id === currentTeamMember.id;
                
                return (
                  <div key={note.id} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm text-gray-600">
                        <strong>{addedByName}</strong> - {noteDate}
                      </p>
                      <div className="flex gap-2">
                        {!isEditing && isNoteOwner && (
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
                        )}
                        {isAdmin && (
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
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={() => navigate("/home")}
        >
          Back
        </button>

        {isAdmin && (
          <button
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            onClick={() => navigate(`/edit-church/${encodeURIComponent(church.church_name)}`)}
          >
            Edit Church
          </button>
        )}
      </div>


      <h2 className="text-2xl font-semibold mt-8 mb-4">Individuals</h2>
      {individualsLoading ? (
        <p>Loading individuals...</p>
      ) : individuals.length === 0 ? (
        <p>No individuals found for this church.</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">First Name</th>
              <th className="border px-4 py-2">Last Name</th>
              <th className="border px-4 py-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {individuals.map((ind) => (
              <tr key={ind.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{ind.first_name}</td>
                <td className="border px-4 py-2">{ind.last_name}</td>
                <td className="border px-4 py-2">{ind.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}