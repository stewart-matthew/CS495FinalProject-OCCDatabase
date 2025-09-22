import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Database() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function getIndividuals() {
      const { data, error } = await supabase.from("individuals").select("*");
      if (error) {
        console.error(error);
      } else {
        setRows(data);
      }
    }

    getIndividuals();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-4">Database</h1>
      <p className="text-gray-700 mb-4">
        All individuals in the system
      </p>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Church</th>
            <th className="border border-gray-300 p-2">Phone</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="border border-gray-300 p-2">{row.full_name}</td>
              <td className="border border-gray-300 p-2">{row.church_affiliation}</td>
              <td className="border border-gray-300 p-2">{row.phone_number}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
