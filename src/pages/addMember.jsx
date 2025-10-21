// src/pages/addMember.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function AddMember() {
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        shirt_size: "",
        church_affiliation_name: "",
    });
    const [positions, setPositions] = useState([]);
    const [selectedPosition, setSelectedPosition] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPositions = async () => {
            const { data } = await supabase.from("positions").select("code");
            setPositions(data ? data.map(p => p.code) : []);
        };
        fetchPositions();
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Insert into team_members
        const { data: member, error } = await supabase
            .from("team_members")
            .insert([formData])
            .select()
            .single();

        if (error) {
            console.error("Error adding member:", error);
            return;
        }

        // Insert position if selected
        if (selectedPosition) {
            await supabase.from("member_positions").insert({
                member_id: member.id,
                position: selectedPosition
            });
        }

        navigate("/teamMembers");
    };

    return (
        <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h1 className="text-2xl font-bold mb-4">Add Team Member</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                />
                <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                />
                <input
                    type="text"
                    name="phone_number"
                    placeholder="Phone Number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full border px-3 py-2 rounded"
                />
                <select
                    name="shirt_size"
                    value={formData.shirt_size}
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
                    value={selectedPosition}
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
                    Add Member
                </button>
            </form>
        </div>
    );
}
