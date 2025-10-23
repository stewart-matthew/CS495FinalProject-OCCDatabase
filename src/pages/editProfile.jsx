// src/pages/editProfile.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function EditProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          navigate("/login");
          return;
        }
        setUser(authUser);

        const { data: member, error: memberError } = await supabase
          .from("team_members")
          .select("*")
          .eq("email", authUser.email)
          .single();

        if (memberError || !member) {
          alert("Could not load your profile data.");
          setLoading(false);
          return;
        }

        setFormData(member);
      } catch (err) {
        console.error(err);
        alert("An error occurred loading your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("team_members")
        .update({
          first_name: formData.first_name ?? null,
          last_name: formData.last_name ?? null,
          phone_number: formData.phone_number ?? null,
          alt_phone_number: formData.alt_phone_number ?? null,
          home_address: formData.home_address ?? null,
          home_city: formData.home_city ?? null,
          home_state: formData.home_state ?? null,
          home_zip: formData.home_zip ?? null,
          home_county: formData.home_county ?? null,
          date_of_birth: formData.date_of_birth ?? null,
          shirt_size: formData.shirt_size ?? null,
          church_affiliation_name: formData.church_affiliation_name ?? null,
          church_affiliation_city: formData.church_affiliation_city ?? null,
          church_affiliation_state: formData.church_affiliation_state ?? null,
          church_affiliation_county: formData.church_affiliation_county ?? null,
          active: formData.active ?? true,
          member_notes: formData.member_notes ?? null,
          admin_flag: formData.admin_flag ?? false,
        })
        .eq("id", formData.id);

      if (error) {
        alert("Error updating profile: " + error.message);
      } else {
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="first_name"
          placeholder="First Name"
          value={formData.first_name || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="last_name"
          placeholder="Last Name"
          value={formData.last_name || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="alt_phone_number"
          placeholder="Alternate Phone"
          value={formData.alt_phone_number || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="home_address"
          placeholder="Home Address"
          value={formData.home_address || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="home_city"
          placeholder="Home City"
          value={formData.home_city || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="home_state"
          placeholder="Home State"
          value={formData.home_state || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="home_zip"
          placeholder="Home ZIP"
          value={formData.home_zip || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="home_county"
          placeholder="Home County"
          value={formData.home_county || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="shirt_size"
          placeholder="Shirt Size"
          value={formData.shirt_size || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="member_notes"
          placeholder="Member Notes"
          value={formData.member_notes || ""}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
