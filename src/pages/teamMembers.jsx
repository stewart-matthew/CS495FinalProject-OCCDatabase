import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

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

            // signed URL
            const { data } = await supabase.storage
                .from('Team Images')
                .createSignedUrl(filePath, 3600); // images lasts for 1 hour

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

export default function TeamMembers() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copyStatus, setCopyStatus] = useState(null);
    const [downloadStatus, setDownloadStatus] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
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
                    console.error("Error fetching current user:", error);
                } else {
                    setCurrentUser(memberData);
                }
            }
        };
        fetchUser();
    }, []);

    // Fetch team members
    useEffect(() => {
        const fetchMembers = async () => {
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

        fetchMembers();
    }, []);

    // Clear status messages after a short delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setCopyStatus(null);
            setDownloadStatus(null);
        }, 3000);
        return () => clearTimeout(timer);
    }, [copyStatus, downloadStatus]);

    const copyAllEmailsToClipboard = async () => {
        const emails = members
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
            console.error("Clipboard copy failed:", err);
            setCopyStatus("error");
        }
    };

    const downloadAllAddresses = () => {
        const addresses = members.filter(
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

    // Split members into active and former
    const activeMembers = members.filter((m) => m.active === true || m.active === "true");
    const formerMembers = members.filter((m) => m.active === false || m.active === "false");

    return (
        <div className="max-w-6xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {/* Toolbar */}
            <div className="col-span-full flex flex-wrap justify-end items-center space-x-4 mb-4">
                {copyStatus === "success" && (
                    <span className="text-sm font-semibold text-green-600">Emails copied! 📋</span>
                )}
                {copyStatus === "error" && (
                    <span className="text-sm font-semibold text-red-600">No emails found to copy.</span>
                )}

                <button
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                    onClick={copyAllEmailsToClipboard}
                >
                    Copy All Emails
                </button>

                {downloadStatus === "success" && (
                    <span className="text-sm font-semibold text-green-600">Addresses downloaded! 👇</span>
                )}
                {downloadStatus === "error" && (
                    <span className="text-sm font-semibold text-red-600">No complete addresses found.</span>
                )}

                <button
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                    onClick={downloadAllAddresses}
                >
                    Download Addresses (CSV)
                </button>

                {isAdmin && (
                    <button
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        onClick={() => navigate("/add-member")}
                    >
                        Add Team Member
                    </button>
                )}
            </div>

            {/* Active Members */}
            {activeMembers.map((member) => {
                return (
                    <div key={member.id} className="bg-white shadow-md rounded-lg p-6 flex flex-col">
                        <h2 className="text-xl font-bold">
                            {member.first_name} {member.last_name}
                        </h2>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Phone:</strong> {member.phone_number || "N/A"}</p>
                        <p><strong>Position:</strong> {member.position}</p>
                        {member.photo_url && (
                            <PrivateBucketImage
                                filePath={member.photo_url}
                                className="w-1/2 mx-auto rounded mt-2"
                            />
                        )}

                        <button
                            onClick={() => navigate(`/team-member/${member.id}`)}
                            className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                        >
                            View Profile
                        </button>

                        {isAdmin && (
                            <button
                                onClick={() => navigate(`/edit-member/${member.id}`)}
                                className="mt-2 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
                            >
                                Edit Team Member
                            </button>
                        )}
                    </div>
                );
            })}

            {/* Former Members Section (admins only) */}
            {isAdmin && formerMembers.length > 0 && (
                <>
                    <div className="col-span-full mt-8 mb-4">
                        <h2 className="text-2xl font-bold">Former Members</h2>
                    </div>
                    {formerMembers.map((member) => {
                        return (
                            <div key={member.id} className="bg-white shadow-md rounded-lg p-6 flex flex-col">
                                <h2 className="text-xl font-bold">
                                    {member.first_name} {member.last_name}
                                </h2>
                                <p><strong>Email:</strong> {member.email}</p>
                                <p><strong>Phone:</strong> {member.phone_number || "N/A"}</p>
                                <p><strong>Position:</strong> {member.position}</p>
                                {member.photo_url && (
                                    <PrivateBucketImage
                                        filePath={member.photo_url}
                                        className="w-1/2 mx-auto rounded mt-2"
                                    />
                                )}

                                <button
                                    onClick={() => navigate(`/team-member/${member.id}`)}
                                    className="mt-4 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
                                >
                                    View Profile
                                </button>

                                <button
                                    onClick={() => navigate(`/edit-member/${member.id}`)}
                                    className="mt-2 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
                                >
                                    Edit Team Member
                                </button>
                            </div>
                        );
                    })}
                </>
            )}
        </div>
    );
}