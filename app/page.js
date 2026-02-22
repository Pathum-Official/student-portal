"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BookOpen, UserCircle, KeyRound } from "lucide-react";

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .single();

    if (data && data.password === password) {
      localStorage.setItem("student_id", studentId);
      router.push("/dashboard");
    } else {
      alert("Invalid Student ID or Password!");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 font-sans p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="z-10 w-full max-w-md p-8 md:p-10 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
            <BookOpen size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Portal</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <UserCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" size={20}/>
            <input 
              required
              type="text" placeholder="Student ID (e.g. ST001)" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300" size={20}/>
            <input 
              required
              type="password" placeholder="Password" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full py-4 mt-4 text-white bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-lg tracking-wide shadow-lg shadow-blue-600/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}