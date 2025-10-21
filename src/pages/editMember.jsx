// src/pages/editMember.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

export default function EditMember() {
    const { memberId } = useParams();
    const [formData, setFormData] = useState({});
    const [positions, setPositions] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            // Fetch member
            const { data: member } = await supabase
                .from("team_members")
                .select("*")
                .eq("id", memberId)
                .single();

            if (member) setFormData(member);

            // Fetch member position
            const { data: memberPos } = await supabase
                .from("member_positions")
                .select("position")
                .eq("member_id", memberId)
                .single();

            if (memberPos) setSelectedPosition(memberPos.position);

            // Fetch all positions
            const { data: allPositions } = await supabase
                .from("positions")
                .select("code");

            setPositions(allPositions ? allPositions.map(p => p.code) : []);
        };

        fetchData();
    }, [memberId]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Update member
        await supabase.from("team_members")
            .update({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email,
                phone_number: formData.phone_number,
                shirt_size: formData.shirt_size,
                church_affiliation_name: formData.church_affiliation_name,
            })
            .eq("id", memberId);

        // Update or insert position
        const { data: existing } = await supabase
            .from("member_positions")
            .select("id")
            .eq("member_id", memberId)
            .single();

        if (!existing && selectedPosition) {
            await supabase.from("member_positions").insert({
                member_id: memberId,
                position: selectedPosition
            });
        } else if (existing) {
            await supabase.from("member_positions")
                .update({ position: selectedPosition })
                .eq("member_id", memberId);
        }

        navigate("/teamMembers");
    };

    if (!formData) return <p>Loading...</p>;

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h1 className="text-2xl font-bold mb-4">Edit Team Member</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleChange}
                    placeholder="First Name"
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleChange}
                    placeholder="Last Name"
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number || ""}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="w-full border px-3 py-2 rounded"
                />
                <input
                    type="text"
                    name="church_affiliation_name"
                    value={formData.church_affiliation_name || ""}
                    onChange={handleChange}
                    placeholder="Church Affiliation"
                    className="w-full border px-3 py-2 rounded"
                />
                <select
                    name="shirt_size"
                    value={formData.shirt_size || ""}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                >
                    <option value="">Select Shirt Size</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="2XL">2XL</option>
                    <option value="3XL">3XL</option>
                </select>
                <select
                    value={selectedPosition || ""}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                >
                    <option value="">Select Position</option>
                    {positions.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}
