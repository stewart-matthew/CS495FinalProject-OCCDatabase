// src/pages/profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

const MANAGED_BY = {
  "Area Coordinator": "ALL", // sees all West Alabama members
  "Church Relations Coordinator": ["Church Relations Team Member"],
  "Logistics Coordinator": ["Central Drop-off Team Leader", "Drop-off Team Leader"],
  "Prayer Team Coordinator": ["Prayer Team Member"],
  "Student Relations Coordinator": ["Student Relations Team Member"],
  "Community Relations Coordinator": ["Community Relations Team Member"],
  // If there are others, add them here. Roles with no reports: leave out or map to [].
};

export default function Profile() {
  const [user, setUser] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [positions, setPositions] = useState([]); // array
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "myTeam"
  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState(null);

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
        .single();

      if (memberError || !member) return;
      setMemberData(member);
      
      const { data: posRows, error: posError } = await supabase
        .from("member_positions")
        .select("position")
        .eq("member_id", member.id);

      if (!posError && posRows) {
        setPositions(posRows.map((r) => r.position));
      }
    };

    getUserAndData();
  }, [navigate]);

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
        setTeamLoading(false);
        return;
      }

      if (scopes.includes("ALL")) {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, first_name, last_name, email, region")
          .eq("region", "West Alabama")
          .order("last_name", { ascending: true });

        if (error) throw error;
        setTeam(data || []);
        setTeamLoading(false);
        return;
      }

      const managedPositions = [...new Set(scopes.flat().filter(Boolean))];

      const { data, error } = await supabase
        .from("member_positions")
        .select("position, member:member_id (id, first_name, last_name, email, region)")
        .in("position", managedPositions);

      if (error) throw error;

      const onlyWest = (data || []).filter(
        (row) => (row.member?.region || "") === "West Alabama"
      );

      const seen = new Set();
      const uniqueMembers = [];
      for (const row of onlyWest) {
        const m = row.member;
        if (m && !seen.has(m.id)) {
          seen.add(m.id);
          uniqueMembers.push(m);
        }
      }

      uniqueMembers.sort((a, b) => (a.last_name || "").localeCompare(b.last_name || ""));
      setTeam(uniqueMembers);
    } catch (e) {
      console.error(e);
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
    <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6">
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
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {memberData.first_name} {memberData.last_name}</p>
          <div className="mt-2">
            <strong>Position{positions.length !== 1 ? "s" : ""}:</strong>{" "}
            {positions.length === 0 ? "Currently no positions assigned to user." : (
              <ul className="list-disc ml-6">
                {positions.map((p, i) => (<li key={i}>{p}</li>))}
              </ul>
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
                  <div>
                    <div className="font-medium">{m.first_name} {m.last_name}</div>
                    <div className="text-sm text-gray-600">{m.email}</div>
                  </div>
                  <Link
                    to={`/member/${m.id}`}
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

      {(!user || !memberData) && activeTab === "profile" && <p>Loading...</p>}
    </div>
  );
}
