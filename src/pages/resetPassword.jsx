import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Immediately sign out the recovery session
      await supabase.auth.signOut();

      // Optionally show a brief message before redirect
      setStatus("Your password has been updated. Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-semibold mb-4">Set New Password</h1>

        {error && (
          <p className="mb-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && (
          <>
            <label className="block mb-2 text-sm font-medium">
              New Password
              <input
                type="password"
                className="mt-1 w-full border rounded px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="mt-4 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Update Password
            </button>
          </>
        )}

        {status && <p className="mt-3 text-sm text-green-600">{status}</p>}
      </form>
    </div>
  );
}
