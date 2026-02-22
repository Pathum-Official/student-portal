"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Use secure credentials here
    if (user === "admin" && pass === "admin123") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      alert("Unauthorized Access! Please check your credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <div className="bg-[#1e293b] p-10 rounded-3xl border border-slate-700 shadow-2xl w-[400px]">
        <div className="flex justify-center mb-6 text-blue-500 bg-blue-500/10 w-20 h-20 items-center rounded-full mx-auto">
            <ShieldCheck size={40} />
        </div>
        <h2 className="text-white text-2xl font-bold text-center mb-8 tracking-tight">System Authority</h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <input type="text" placeholder="Admin ID" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition" onChange={(e)=>setUser(e.target.value)} />
          <input type="password" placeholder="Master Key" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition" onChange={(e)=>setPass(e.target.value)} />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-4 rounded-2xl transition-all transform hover:scale-[1.02]">Access Dashboard</button>
        </form>
      </div>
    </div>
  );
}