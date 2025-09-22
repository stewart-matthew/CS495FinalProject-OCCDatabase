import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ChurchPage() {
  const { churchName } = useParams();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    async function getMembers() {
      const { data, error } = await supabase
        .from("individuals")
        .select("*")
        .eq("church_affiliation", churchName);

      if (error) {
        console.error(error);
      } else {
        setMembers(data);
      }
    }

    getMembers();
  }, [churchName]);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">{churchName}</h1>
      <p className="text-gray-600 text-center mb-6">
        Members of {churchName}
      </p>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td className="border border-gray-300 p-2">{member.full_name}</td>
              <td className="border border-gray-300 p-2">{member.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
