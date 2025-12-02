import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function PrivateBucketImage({ filePath, className }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        const getSignedUrl = async () => {
            if (!filePath) return;

            if (filePath.startsWith('http')) {
                setSignedUrl(filePath);
                return;
            }

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

export default function TeamMemberPage() {
    const { id } = useParams();
    const [member, setMember] = useState(null);
    const [church, setChurch] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function getMember() {
            const { data: memberData, error: memberError } = await supabase
                .from("team_members")
                .select(`*, member_positions(position)`)
                .eq("id", id)
                .single();

            if (memberError) {
                console.error("Error fetching team member:", memberError);
                setLoading(false);
                return;
            }

            const formattedMember = {
                ...memberData,
                position: memberData.member_positions?.position || "N/A",
            };
            setMember(formattedMember);

            // Fetch church if there's a church affiliation
            if (memberData.church_affiliation_name) {
                const { data: churchData, error: churchError } = await supabase
                    .from("church2")
                    .select("church_name, physical_city, physical_state, phone_number, physical_zip")
                    .eq("church_name", memberData.church_affiliation_name)
                    .single();

                if (!churchError && churchData) {
                    setChurch(churchData);
                }
            }

            setLoading(false);
        }

        getMember();
    }, [id]);

    if (loading) return <p className="text-center mt-10">Loading team member...</p>;
    if (!member) return <p className="text-center mt-10">Team member not found.</p>;

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 mb-4"
                onClick={() => navigate("/team-members")}
            >
                Back to Team Members
            </button>

            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {member.photo_url && (
                        <div className="flex-shrink-0">
                            <PrivateBucketImage
                                filePath={member.photo_url}
                                className="w-48 h-48 rounded-lg object-cover"
                            />
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-4">
                            {member.first_name} {member.last_name}
                        </h1>
                        
                        <div className="space-y-2 text-gray-700">
                            <p><strong>Email:</strong> {member.email}</p>
                            <p><strong>Phone:</strong> {member.phone_number || "N/A"}</p>
                            <p><strong>Alt Phone:</strong> {member.alt_phone_number || "N/A"}</p>
                            <p><strong>Position:</strong> {member.position}</p>
                            <p><strong>Active:</strong> {member.active ? "Yes" : "No"}</p>
                        </div>

                        <div className="mt-6 space-y-2 text-gray-700">
                            <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
                            <p><strong>Home Address:</strong> {member.home_address || "N/A"}</p>
                            <p><strong>City:</strong> {member.home_city || "N/A"}</p>
                            <p><strong>State:</strong> {member.home_state || "N/A"}</p>
                            <p><strong>Zip:</strong> {member.home_zip || "N/A"}</p>
                            <p><strong>County:</strong> {member.home_county || "N/A"}</p>
                        </div>

                        <div className="mt-6 space-y-2 text-gray-700">
                            <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
                            <p><strong>Birth Date:</strong> {member.date_of_birth || "N/A"}</p>
                            <p><strong>Shirt Size:</strong> {member.shirt_size || "N/A"}</p>
                            <p>
                                <strong>Church Affiliation:</strong>{" "}
                                {member.church_affiliation_name ? (
                                    <button
                                        onClick={() => navigate(`/church/${encodeURIComponent(member.church_affiliation_name)}`)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {member.church_affiliation_name.replace(/_/g, " ")}
                                    </button>
                                ) : (
                                    "N/A"
                                )}
                            </p>
                            {member.member_notes && (
                                <div className="mt-2">
                                    <p><strong>Member Notes:</strong></p>
                                    <p className="bg-gray-50 p-3 rounded mt-1">{member.member_notes}</p>
                                </div>
                            )}
                        </div>

                        {church && (
                            <div className="mt-6 bg-gray-100 p-4 rounded">
                                <h3 className="font-semibold mb-2">Affiliated Church:</h3>
                                <p>
                                    <strong>Name:</strong>{" "}
                                    <button
                                        onClick={() => navigate(`/church/${encodeURIComponent(church.church_name)}`)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {church.church_name?.replace(/_/g, " ") || "N/A"}
                                    </button>
                                </p>
                                <p><strong>City:</strong> {church.physical_city || "N/A"}</p>
                                <p><strong>State:</strong> {church.physical_state || "N/A"}</p>
                                <p><strong>Zip:</strong> {church.physical_zip || "N/A"}</p>
                                <p><strong>Phone:</strong> {church.phone_number || "N/A"}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

