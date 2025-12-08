"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { supabase } from "@/lib/supabase";

interface UserData {
  email: string | null;
  id: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // ۱) گرفتن session / user فعلی از Auth
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("getUser error:", error);
          setError("خطا در گرفتن اطلاعات کاربر.");
          return;
        }

        if (!data.user) {
          // کاربر لاگین نیست
          setError("شما وارد نشده‌اید.");
          return;
        }

        // فعلاً فقط از خود Auth ایمیل و id را می‌گیریم
        setUser({
          email: data.user.email,
          id: data.user.id,
        });
      } catch (err: any) {
        console.error(err);
        setError("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const email = user?.email || "unknown@example.com";

  return (
    <div className="min-h-screen pb-20 bg-[#020617]">
      <div className="bg-[#020617] px-4 py-4 border-b border-[#1F2937]">
        <h1 className="text-xl font-bold text-[#F9FAFB] text-center">
          Profile
        </h1>
      </div>

      <div className="px-4 py-8 max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
        {loading && (
          <div className="text-sm text-[#9CA3AF]">Loading profile...</div>
        )}

        {error && !loading && (
          <div className="w-full space-y-4">
            <div className="text-sm text-red-400 text-center bg-red-500/10 px-4 py-3 rounded-xl">
              {error}
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-[#6366F1] text-[#F9FAFB] h-12 rounded-xl font-semibold hover:bg-[#5558E3] active:scale-[0.98]"
            >
              رفتن به صفحه ورود
            </button>
          </div>
        )}

        {!loading && !error && user && (
          <div className="w-full space-y-4">
            <div className="bg-[#0B1120] p-4 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.7)]">
              <div className="text-sm font-semibold text-[#9CA3AF] mb-2">
                Email
              </div>
              <div className="text-[#F9FAFB] text-base">{email}</div>
            </div>

            <div className="bg-[#0B1120] p-4 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.7)]">
              <div className="text-sm font-semibold text-[#9CA3AF] mb-2">
                User ID
              </div>
              <div className="text-[#F9FAFB] text-xs break-all">{user.id}</div>
            </div>

            <button
              onClick={() => router.push("/home")}
              className="w-full bg-transparent border border-[#374151] text-[#E5E7EB] h-12 rounded-xl font-semibold transition-all hover:bg-[#374151]/20 active:scale-[0.98]"
            >
              Back to Home
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 hover:bg-red-600 text-[#F9FAFB] h-12 rounded-xl font-semibold transition-all active:scale-[0.98]"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}
