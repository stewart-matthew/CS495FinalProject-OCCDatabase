import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function TeamMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [churches, setChurches] = useState({});
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
          console.log("Logged-in user:", memberData.first_name, "Admin flag:", memberData.admin_flag);
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
        console.log("Fetched members:", formattedMembers);
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

  const toggleInfo = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: prev[id] === "info" ? null : "info",
    }));
  };

  const toggleChurch = async (member) => {
    if (!churches[member.id]) {
      if (!member.church_affiliation_name) {
        setChurches((prev) => ({ ...prev, [member.id]: { church_name: "N/A" } }));
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

  const isAdmin =
    currentUser &&
    (currentUser.admin_flag === true || currentUser.admin_flag === "true");

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

        {/* Show Add button only for admins */}
        {isAdmin && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={() => navigate("/add-member")}
          >
            Add Team Member
          </button>
        )}
      </div>

      {/* Member Cards */}
      {members.map((member) => {
        const basicInfo = (
          <>
            <h2 className="text-xl font-bold">
              {member.first_name} {member.last_name}
            </h2>
            <p><strong>Email:</strong> {member.email}</p>
            <p><strong>Phone:</strong> {member.phone_number || "N/A"}</p>
            <p><strong>Position:</strong> {member.position}</p>
            {member.photo_url && (
              <img
                src={member.photo_url}
                alt="Profile"
                className="max-w-full h-auto rounded mt-2"
              />
            )}
          </>
        );

        const moreInfo = (
          <div className="mt-4 text-gray-700 space-y-1">
            <p><strong>Alt Phone:</strong> {member.alt_phone_number || "N/A"}</p>
            <p><strong>Home Address:</strong> {member.home_address || "N/A"}</p>
            <p><strong>City:</strong> {member.home_city || "N/A"}</p>
            <p><strong>State:</strong> {member.home_state || "N/A"}</p>
            <p><strong>Zip:</strong> {member.home_zip || "N/A"}</p>
            <p><strong>County:</strong> {member.home_county || "N/A"}</p>
            <p><strong>Birth Date:</strong> {member.date_of_birth || "N/A"}</p>
            <p><strong>Shirt Size:</strong> {member.shirt_size || "N/A"}</p>
            <p><strong>Church Affiliation:</strong> {member.church_affiliation_name || "N/A"}</p>
            <p><strong>Active:</strong> {member.active ? "Yes" : "No"}</p>
            <p><strong>Member Notes:</strong> {member.member_notes || "N/A"}</p>
          </div>
        );

        return (
          <div key={member.id} className="bg-white shadow-md rounded-lg p-6 flex flex-col">
            {basicInfo}

            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => toggleInfo(member.id)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {expanded[member.id] === "info" ? "Less Info" : "More Info"}
              </button>

              <button
                onClick={() => toggleChurch(member)}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                {expanded[member.id] === "church" ? "Hide Church" : "My Church"}
              </button>
            </div>

            {expanded[member.id] === "info" && moreInfo}

            {expanded[member.id] === "church" && churches[member.id] && (
              <div className="mt-3 bg-gray-100 p-3 rounded">
                <h3 className="font-semibold mb-2">Affiliated Church:</h3>
                <p>
                  <strong>Name:</strong>{" "}
                  {churches[member.id].church_name?.replace(/_/g, " ") || "N/A"}
                </p>
                <p><strong>City:</strong> {churches[member.id].physical_city || "N/A"}</p>
                <p><strong>State:</strong> {churches[member.id].physical_state || "N/A"}</p>
                <p><strong>Zip:</strong> {churches[member.id].physical_zip || "N/A"}</p>
                <p><strong>Phone:</strong> {churches[member.id].phone_number || "N/A"}</p>
              </div>
            )}

            {/* Only admins can edit members */}
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
    </div>
  );
}
