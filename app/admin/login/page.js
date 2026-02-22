"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCog, KeyRound } from "lucide-react";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // UI එකේ Professional පෙනුම වැඩි කිරීමට කුඩා ප්‍රමාදයක් (Delay) එක් කර ඇත
    setTimeout(() => {
      // Use secure credentials here
      if (user === "admin" && pass === "Dil@2006") {
        localStorage.setItem("admin_auth", "true");
        router.push("/admin");
      } else {
        alert("Unauthorized Access! Please check your credentials.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 font-sans p-4">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]"></div>
      </div>

      {/* Login Card */}
      <div className="z-10 w-full max-w-md p-8 md:p-10 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-[2.5rem]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4 transform rotate-3">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">System Authority</h1>
          <p className="text-indigo-200 mt-2 text-sm font-medium">Restricted access portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
            <UserCog className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-300" size={20}/>
            <input 
              required
              type="text" placeholder="Admin ID" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
              onChange={(e) => setUser(e.target.value)}
            />
          </div>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-300" size={20}/>
            <input 
              required
              type="password" placeholder="Master Key" 
              className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder-indigo-200/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          <button disabled={loading} className="w-full py-4 mt-4 text-white bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-lg tracking-wide shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50">
            {loading ? "Verifying..." : "Access Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}