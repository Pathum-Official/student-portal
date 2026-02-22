"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LogOut, TrendingUp, Award, BookOpen, User, BarChart3 } from "lucide-react";

export default function StudentDashboard() {
  const [marks, setMarks] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [rankings, setRankings] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examName, setExamName] = useState("Overall Average");
  const router = useRouter();

  useEffect(() => {
    const studentId = localStorage.getItem("student_id");
    if (!studentId) { router.push("/"); return; }
    fetchData(studentId);
  }, []);

  const fetchData = async (studentId) => {
    // 1. Fetch Student Name
    const { data: st } = await supabase.from("students").select("name").eq("student_id", studentId).single();
    if (st) setStudentName(st.name);

    // 2. Fetch Published Exams & Marks
    const { data: ex } = await supabase.from("exams").select("id, exam_name").eq("is_published", true);
    const publishedIds = ex.map(e => e.id);

    const { data: mk } = await supabase.from("marks")
      .select("*, exams(exam_name)")
      .eq("student_id", studentId)
      .in("exam_id", publishedIds)
      .order("exam_id", { ascending: true });

    const formattedMarks = mk.map(m => ({
      ...m,
      total: m.mcq_score + m.structured_score + m.essay_score,
      display_name: m.exams.exam_name
    }));
    setMarks(formattedMarks);
    calculateRankings(null, publishedIds.length); // Initial Global Rank
  };

  const calculateRankings = async (examId, totalExamsCount) => {
    const { data: pubEx } = await supabase.from("exams").select("id").eq("is_published", true);
    const pubIds = pubEx.map(e => e.id);

    let query = supabase.from("marks").select("student_id, mcq_score, structured_score, essay_score, students(name)").in("exam_id", pubIds);
    if (examId) query = query.eq("exam_id", examId);

    const { data: allMarks } = await query;

    const studentStats = {};
    allMarks.forEach(m => {
      const total = m.mcq_score + m.structured_score + m.essay_score;
      if (!studentStats[m.student_id]) {
        studentStats[m.student_id] = { name: m.students.name, score: 0 };
      }
      studentStats[m.student_id].score += total;
    });

    const rankArray = Object.keys(studentStats).map(id => ({
      name: studentStats[id].name,
      avg: studentStats[id].score / (examId ? 1 : totalExamsCount)
    })).sort((a, b) => b.avg - a.avg);

    setRankings(rankArray);
  };

  const handleChartClick = (data) => {
    if (data && data.activePayload) {
      const exam = data.activePayload[0].payload;
      setSelectedExamId(exam.exam_id);
      setExamName(exam.display_name);
      calculateRankings(exam.exam_id, null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-xl text-blue-600 tracking-tighter">
            <BookOpen size={28} strokeWidth={3}/> ACADEMY PORTAL
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-xl transition-all font-bold text-sm text-slate-600">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 mb-10 flex flex-col md:flex-row justify-between items-center border border-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <User size={40} />
            </div>
            <div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Student Profile</p>
              <h2 className="text-3xl font-black text-slate-800">{studentName}</h2>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center min-w-[120px]">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Status</p>
                <p className="text-xl font-black text-emerald-700">Active</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-xl flex items-center gap-2"><TrendingUp className="text-blue-600"/> Performance Analytics</h3>
              <p className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Click dots to see Rank</p>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marks} onClick={handleChartClick}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="display_name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 8, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <h3 className="font-black text-xl mb-6 flex items-center gap-2 relative z-10"><Award className="text-yellow-400"/> Ranking: <span className="text-blue-400">{examName}</span></h3>
            <div className="space-y-4 relative z-10 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {rankings.map((r, i) => (
                <div key={i} className={`flex justify-between items-center p-4 rounded-2xl border ${i === 0 ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800'}`}>{i + 1}</span>
                    <span className="font-bold text-sm">{r.name}</span>
                  </div>
                  <span className="font-black text-blue-400">{r.avg.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedExamId(null); setExamName("Overall Average"); calculateRankings(null, marks.length); }} className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all uppercase tracking-widest">Reset to Overall</button>
          </div>
        </div>
      </div>
    </div>
  );
}