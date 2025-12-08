"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // adjust path if needed

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      console.error("signUp error:", error);
      setMsg("Error: " + error.message);
      return;
    }

    console.log("signUp data:", data);

    // Create a row in public.users
    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
      });

      if (insertError) {
        console.error("Error inserting into public.users:", insertError);
        setMsg(
          "Sign up succeeded, but creating a profile row failed. See console for details."
        );
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setMsg("Sign up completed. Redirecting to login...");

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1000);
  };

  const goToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020617]">
      <div className="w-full max-w-md bg-[#020617] border border-[#1F2937] rounded-2xl p-6 shadow-xl shadow-black/40">
        <h1 className="text-2xl font-bold mb-4 text-[#F9FAFB] text-center">
          Sign up
        </h1>
        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-[#374151] text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#020617] border border-[#374151] text-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-[#F9FAFB] h-11 rounded-xl font-semibold transition-all active:scale-[0.98]"
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        {msg && (
          <p className="mt-3 text-sm text-center text-[#E5E7EB]">{msg}</p>
        )}

        <div className="mt-6 text-center text-sm text-[#9CA3AF]">
          <span>Already have an account? </span>
          <button
            onClick={goToLogin}
            className="text-[#6366F1] hover:underline"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
