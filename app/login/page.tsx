"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"; // adjust path if needed

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      console.error("login error:", error);
      setMsg("Error: " + error.message);
      return;
    }

    console.log("login data:", data);
    // Redirect to home after successful login
    router.push("/home");
  };

  const goToSignup = () => {
    router.push("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020617]">
      <div className="w-full max-w-md bg-[#020617] border border-[#1F2937] rounded-2xl p-6 shadow-xl shadow-black/40">
        <h1 className="text-2xl font-bold mb-4 text-[#F9FAFB] text-center">
          Log in
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {msg && (
          <p className="mt-3 text-sm text-red-400 text-center">{msg}</p>
        )}

        <div className="mt-6 text-center text-sm text-[#9CA3AF]">
          <span>Don&apos;t have an account? </span>
          <button
            onClick={goToSignup}
            className="text-[#6366F1] hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
