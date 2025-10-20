import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function TeamMembers() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState({}); // { memberId: "info" | "church" | null }
    const [currentUser, setCurrentUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [churches, setChurches] = useState({});

    // Fetch current user and team members
    useEffect(() => {
        const fetchUserAndMembers = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setCurrentUser(user);

            const { data: posData } = await supabase
                .from("member_positions")
                .select("position")
                .eq("email", user.email)
                .single();

            setIsAdmin(posData?.position === "Admin");

            const { data: membersData, error } = await supabase
                .from("team_members")
                .select(`*, member_positions(position)`);

            if (error) {
                console.error("Error fetching team members:", error);
                setMembers([]);
            } else {
                const formattedMembers = membersData.map((m) => ({
                    ...m,
                    position: m.member_positions?.position || "N/A",
                }));
                setMembers(formattedMembers);
            }

            setLoading(false);
        };

        fetchUserAndMembers();
    }, []);

    // Toggle info expansion for a specific member
    const toggleInfo = (id) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: prev[id] === "info" ? null : "info",
        }));
    };

    // Toggle church expansion for a specific member
    const toggleChurch = async (member) => {
        // Fetch church info if not yet fetched
        if (!churches[member.id]) {
            if (!member.church_affiliation_name) {
                setChurches((prev) => ({
                    ...prev,
                    [member.id]: { church_name: "N/A" },
                }));
            } else {
                const { data, error } = await supabase
                    .from("church")
                    .select("church_name, physical_city, physical_state, phone_number, physical_zip")
                    .eq("church_name", member.church_affiliation_name)
                    .single();

                setChurches((prev) => ({
                    ...prev,
                    [member.id]: error ? { church_name: "N/A" } : data,
                }));
            }
        }

        setExpanded((prev) => ({
            ...prev,
            [member.id]: prev[member.id] === "church" ? null : "church",
        }));
    };

    if (loading) return <p className="text-center mt-10">Loading team members...</p>;
    if (members.length === 0) return <p className="text-center mt-10">No team members found.</p>;

    return (
        <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {members.map((member) => {
                const basicInfo = (
                    <>
                        <h2 className="text-xl font-bold">{member.first_name} {member.last_name}</h2>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Phone:</strong> {member.phone_number || "N/A"}</p>
                        <p><strong>Position:</strong> {member.position}</p>
                    </>
                );

                const moreInfo = isAdmin ? (
                    <div className="mt-4 text-gray-700 space-y-1">
                        <p><strong>Alt Phone:</strong> {member.alt_phone_number || "N/A"}</p>
                        <p><strong>Home Address:</strong> {member.home_address || "N/A"}</p>
                        <p><strong>City:</strong> {member.home_city || "N/A"}</p>
                        <p><strong>State:</strong> {member.home_state || "N/A"}</p>
                        <p><strong>Zip:</strong> {member.home_zip || "N/A"}</p>
                        <p><strong>County:</strong> {member.home_county || "N/A"}</p>
                        <p><strong>Birth Date:</strong> {member.date_of_birth || "N/A"}</p>
                        <p><strong>Shirt Size:</strong> {member.shirt_size || "N/A"}</p>
                        <p><strong>Church Affiliation:</strong> {member.church_affiliation_name || "N/A"}, {member.church_affiliation_city || "N/A"}, {member.church_affiliation_state || "N/A"}, {member.church_affiliation_county || "N/A"}</p>
                        <p><strong>Position Start:</strong> {member.position_start || "N/A"}</p>
                        <p><strong>Active:</strong> {member.active ? "Yes" : "No"}</p>
                        {!member.active && <p><strong>Position End:</strong> {member.position_end || "N/A"}</p>}
                        <p><strong>Member Notes:</strong> {member.member_notes || "N/A"}</p>
                    </div>
                ) : (
                    <div className="mt-4 text-gray-700 space-y-1">
                        <p><strong>Church Affiliation County:</strong> {member.church_affiliation_county || "N/A"}</p>
                        <p><strong>Alt Phone:</strong> {member.alt_phone_number || "N/A"}</p>
                        <p><strong>Home City:</strong> {member.home_city || "N/A"}</p>
                    </div>
                );

                return (
                    <div key={member.id} className="bg-white shadow-md rounded-lg p-6 flex flex-col">
                        {basicInfo}

                        {/* Buttons row */}
                        <div className="flex space-x-2 mt-4">
                            <button
                                onClick={() => toggleInfo(member.id)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                            >
                                {expanded[member.id] === "info" ? "Less Information" : "More Information"}
                            </button>

                            <button
                                onClick={() => toggleChurch(member)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                            >
                                {expanded[member.id] === "church" ? "Hide Churches" : "My Churches"}
                            </button>
                        </div>

                        {/* Expanded blocks */}
                        {expanded[member.id] === "info" && moreInfo}

                        {expanded[member.id] === "church" && churches[member.id] && (
                            <div className="mt-3 bg-gray-100 p-3 rounded">
                                <h3 className="font-semibold mb-2">Affiliated Church:</h3>
                                <p><strong>Name:</strong> {churches[member.id].church_name || "N/A"}</p>
                                <p><strong>City:</strong> {churches[member.id].physical_city || "N/A"}</p>
                                <p><strong>State:</strong> {churches[member.id].physical_state || "N/A"}</p>
                                <p><strong>Zip:</strong> {churches[member.id].physical_zip || "N/A"}</p>
                                <p><strong>Phone:</strong> {churches[member.id].phone_number || "N/A"}</p>
                            </div>
                        )}

                        {/* Admin Edit button */}
                        {isAdmin && (
                            <button
                                onClick={() => window.location.href = `/edit/${member.id}`}
                                className="mt-2 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                            >
                                Edit Information
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
