// src/pages/profile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

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
        console.error(memberError);
      }

      setMemberData(member || null);

      if (member?.id) {
        const { data: posRows, error: posError } = await supabase
          .from("member_positions")
          .select("position")
          .eq("member_id", member.id);

        if (!posError && posRows) {
          setPositions(posRows.map(r => r.position));
        }
      } else {
        setPositions([]); // no member found → clear positions array
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
        return;
      }

      if (scopes.includes("ALL")) {
        const { data, error } = await supabase
          .from("team_members")
          .select("id, first_name, last_name, email")
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
        .select("id, first_name, last_name, email")
        .in("id", ids);

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
                    <div className="font-medium">{m.first_name} {m.last_name}
                      {m.positions && m.positions.length > 0 && (
                        <span className="ml-2 text-gray-500 text-sm italic">
                          ({m.positions.join(", ")})
                        </span>
                      )}
                    </div>
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
