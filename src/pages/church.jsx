import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const [church, setChurch] = useState(null);
  const [individuals, setIndividuals] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentTeamMember, setCurrentTeamMember] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const navigate = useNavigate();
  
  const SHOEBOX_YEAR = 2025; 

  useEffect(() => {
    async function getChurch() {
      const { data, error } = await supabase
        .from("church")
        .select("*")
        .eq("church_name", churchName)
        .single();
      if (error) console.error(error);
      else setChurch(data);
      setLoading(false);
    }
    getChurch();
  }, [churchName]);

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
          console.error("Error fetching current team member:", error);
        } else {
          setCurrentTeamMember(memberData);
        }
      }
    }
    getCurrentTeamMember();
  }, []);

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
        console.error("Error fetching notes:", error);
      } else {
        setNotes(notesData || []);
      }
      setNotesLoading(false);
    }
    getNotes();
  }, [church]);

  const refreshIndividuals = async () => {
    setIndividualsLoading(true);
    const { data, error } = await supabase
      .from("individuals")
      .select("*")
      .eq("church_name", churchName);
    if (error) console.error(error);
    else setIndividuals(data);
    setIndividualsLoading(false);
  };

  useEffect(() => {
    refreshIndividuals();
  }, [churchName]);

  // Refresh individuals when page becomes visible (e.g., after adding an individual)
  useEffect(() => {
    const handleFocus = () => {
      refreshIndividuals();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [churchName]);

  const shoeboxFieldName = `shoebox_${SHOEBOX_YEAR}`;

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
      console.error("Error adding note:", error);
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

  if (loading) return <p>Loading church...</p>;
  if (!church) return <p>Church not found.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left side - Church Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{church.church_name.replace(/_/g, " ")}</h1>
          <p className="text-gray-700 mb-2">{church.physical_city}, {church.physical_state}</p>
          <p className="text-gray-700 mb-2">{church.physical_county} County</p>
          <p className="text-gray-700 mb-2">Zip: {church.physical_zip}</p>
          {church[shoeboxFieldName] !== undefined && <p className="text-gray-700 mb-2">Shoebox {SHOEBOX_YEAR}: {church[shoeboxFieldName]}</p>}
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
                
                return (
                  <div key={note.id} className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>{addedByName}</strong> - {noteDate}
                    </p>
                    <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
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

        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          onClick={() => navigate(`/edit-church/${encodeURIComponent(church.church_name)}`)}
        >
          Edit Church
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          onClick={() => navigate(`/edit-shoebox-count/${encodeURIComponent(church.church_name)}`)}
        >
          Edit Shoebox Count
        </button>
      </div>

      <div className="flex justify-between items-center mt-8 mb-4">
        <h2 className="text-2xl font-semibold">Individuals</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={() => navigate(`/add-individual/${encodeURIComponent(churchName)}`)}
        >
          Add Individual
        </button>
      </div>
      {individualsLoading ? (
        <p>Loading individuals...</p>
      ) : individuals.length === 0 ? (
        <div>
          <p className="mb-4">No individuals found for this church.</p>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => navigate(`/add-individual/${encodeURIComponent(churchName)}`)}
          >
            Add Individual
          </button>
        </div>
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