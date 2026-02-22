"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { LogOut, TrendingUp, Award, BookOpen } from "lucide-react";

export default function StudentDashboard() {
  const [chartData, setChartData] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [rankings, setRankings] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [examName, setExamName] = useState("Overall Average");
  
  const [viewMode, setViewMode] = useState("total"); // 'total', 'mcq', 'structured', 'essay'
  const [allMarksRaw, setAllMarksRaw] = useState([]);
  const [totalPublishedExams, setTotalPublishedExams] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const studentId = localStorage.getItem("student_id");
    if (!studentId) { router.push("/"); return; }
    fetchData(studentId);
  }, []);

  useEffect(() => {
    if (allMarksRaw.length > 0) {
      processChartAndRankings(localStorage.getItem("student_id"), selectedExamId);
    }
  }, [viewMode, selectedExamId, allMarksRaw]);

  const fetchData = async (studentId) => {
    const { data: st } = await supabase.from("students").select("name").eq("student_id", studentId).single();
    if (st) setStudentName(st.name);

    const { data: pubEx } = await supabase.from("exams").select("id, exam_name").eq("is_published", true).order("id", { ascending: true });
    const publishedIds = pubEx.map(e => e.id);
    setTotalPublishedExams(publishedIds.length);

    const { data: allMarks } = await supabase.from("marks")
      .select("*, exams(exam_name), students(name)")
      .in("exam_id", publishedIds);
      
    setAllMarksRaw(allMarks || []);
  };

  const getScoreByMode = (markObj, mode) => {
    if (!markObj || markObj.is_absent) return 0;
    if (mode === 'mcq') return markObj.mcq_score || 0;
    if (mode === 'structured') return markObj.structured_score || 0;
    if (mode === 'essay') return markObj.essay_score || 0;
    return (markObj.mcq_score || 0) + (markObj.structured_score || 0) + (markObj.essay_score || 0); 
  };

  const processChartAndRankings = (studentId, specificExamId) => {
    const studentMarks = allMarksRaw.filter(m => String(m.student_id) === String(studentId)).sort((a, b) => a.exam_id - b.exam_id);
    
    let totalPersonalScore = 0;
    studentMarks.forEach(m => totalPersonalScore += getScoreByMode(m, viewMode));
    const personalAverage = totalPublishedExams > 0 ? (totalPersonalScore / totalPublishedExams) : 0;

    const processedData = studentMarks.map(m => {
      const examMarksAllStudents = allMarksRaw.filter(x => x.exam_id === m.exam_id && !x.is_absent);
      let classTotal = 0;
      examMarksAllStudents.forEach(ex => classTotal += getScoreByMode(ex, viewMode));
      const classAverage = examMarksAllStudents.length > 0 ? (classTotal / examMarksAllStudents.length) : 0;

      const myScore = getScoreByMode(m, viewMode);

      return {
        exam_id: m.exam_id,
        display_name: m.exams?.exam_name || "Unknown Paper",
        score: myScore,
        classAvg: parseFloat(classAverage.toFixed(1)),
        personalAvg: parseFloat(personalAverage.toFixed(1)),
        isAbsent: m.is_absent
      };
    });
    setChartData(processedData);

    const studentStats = {};
    const marksToConsider = specificExamId ? allMarksRaw.filter(m => m.exam_id === specificExamId) : allMarksRaw;

    marksToConsider.forEach(m => {
      const score = getScoreByMode(m, viewMode);
      if (!studentStats[m.student_id]) {
        studentStats[m.student_id] = { name: m.students?.name || "Unknown", totalScore: 0 };
      }
      studentStats[m.student_id].totalScore += score;
    });

    const divisor = specificExamId ? 1 : totalPublishedExams;

    const rankArray = Object.keys(studentStats).map(id => ({
      name: studentStats[id].name,
      avg: divisor > 0 ? (studentStats[id].totalScore / divisor) : 0
    })).sort((a, b) => b.avg - a.avg);

    setRankings(rankArray);
  };

  // NEW: Directly handle Bar click instead of Chart wrapper click
  const handleBarClick = (data) => {
    if (data && data.exam_id) {
      if (selectedExamId === data.exam_id) {
        setSelectedExamId(null);
        setExamName("Overall Average");
      } else {
        setSelectedExamId(data.exam_id);
        setExamName(data.display_name);
      }
    }
  };

  const getBarColor = (score, classAvg) => {
    const diff = score - classAvg;
    if (diff >= 10) return "#10b981"; // Excellent
    if (diff >= 0) return "#84cc16";  // Good
    if (diff >= -10) return "#eab308"; // Average
    if (diff >= -20) return "#f97316"; // Weak
    return "#ef4444";                 // Critical
  };

  const resetSelection = () => {
    setSelectedExamId(null);
    setExamName("Overall Average");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 p-3 md:p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-lg md:text-xl text-blue-600 tracking-tighter">
            <BookOpen size={24} strokeWidth={3} className="md:w-7 md:h-7"/> 
            <span className="hidden sm:inline">ACADEMY PORTAL</span>
            <span className="sm:hidden">PORTAL</span>
          </div>
          <button onClick={() => { localStorage.clear(); router.push("/"); }} className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all font-bold text-xs md:text-sm text-slate-600">
            <LogOut size={16} /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-6 md:mt-10">
        
        {/* Filter Buttons */}
        <div className="flex justify-center mb-6 md:mb-8">
            <div className="bg-white p-1.5 md:p-2 rounded-2xl shadow-md flex flex-wrap justify-center gap-1 md:gap-2 border border-slate-100 w-full sm:w-auto">
                {[
                    { id: 'total', label: 'Total' },
                    { id: 'mcq', label: 'MCQ' },
                    { id: 'structured', label: 'Structured' },
                    { id: 'essay', label: 'Essay' }
                ].map(mode => (
                    <button 
                        key={mode.id}
                        onClick={() => { setViewMode(mode.id); resetSelection(); }}
                        className={`flex-1 sm:flex-none px-3 py-2 md:px-6 md:py-2 rounded-xl font-bold text-xs md:text-sm transition-all text-center whitespace-nowrap ${viewMode === mode.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-blue-900/5 border border-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <h3 className="font-black text-lg md:text-xl flex items-center gap-2"><TrendingUp className="text-blue-600" size={20}/> Performance ({viewMode.toUpperCase()})</h3>
              <p className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full animate-pulse self-start sm:self-auto">
                👆 Tap a bar to see paper rank
              </p>
            </div>
            
            <div className="w-full mt-4" style={{ minHeight: "320px", height: "350px" }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {/* Removed onClick from ComposedChart */}
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="display_name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600}} dy={10} />
                    <YAxis domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 10}} width={30}/>
                    
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} 
                      cursor={{fill: '#f8fafc'}}
                    />
                    <Legend wrapperStyle={{paddingTop: '15px', fontWeight: 'bold', fontSize: '10px'}}/>
                    
                    {/* ADDED onClick Directly to the Bar */}
                    <Bar 
                      dataKey="score" 
                      name="My Score" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={40}
                      onClick={handleBarClick}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getBarColor(entry.score, entry.classAvg)} 
                          fillOpacity={selectedExamId ? (selectedExamId === entry.exam_id ? 1 : 0.3) : 1}
                          cursor="pointer"
                        />
                      ))}
                    </Bar>
                    
                    <Line type="monotone" dataKey="classAvg" name="Class Average" stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
                    <Line type="monotone" dataKey="personalAvg" name="My Overall Avg" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                  Loading chart data... 
                </div>
              )}
            </div>
            
            {/* Legend for Colors */}
            <div className="mt-8 flex flex-wrap gap-2 md:gap-4 justify-center text-[10px] md:text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> Excellent</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#84cc16]"></div> Good</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#eab308]"></div> Average</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></div> Weak</span>
                <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div> Critical</span>
            </div>
          </div>

          {/* Ranking Section */}
          <div className="bg-slate-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl text-white relative overflow-hidden flex flex-col h-[450px] md:h-auto md:max-h-[600px] border border-slate-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="relative z-10 mb-5 md:mb-6">
                <h3 className="font-black text-xl md:text-2xl mb-2 flex items-center gap-2 text-white">
                    <Award className="text-yellow-400" size={24}/> 
                    <span className="truncate">{selectedExamId ? examName : "Overall Rank"}</span>
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-600/30 text-blue-300 px-2 py-1 md:px-3 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
                        {viewMode === 'total' ? 'Total Marks' : viewMode}
                    </span>
                    <span className="text-slate-400 text-[10px] md:text-xs font-bold">
                        {selectedExamId ? "Specific Paper" : "Average over all papers"}
                    </span>
                </div>
            </div>
            
            <div className="space-y-2 md:space-y-3 relative z-10 flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
              {rankings.map((r, i) => (
                <div key={i} className={`flex justify-between items-center p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all ${i === 0 ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-900/50' : r.name === studentName ? 'bg-white/15 border-white/30' : 'bg-white/5 border-transparent'}`}>
                  <div className="flex items-center gap-3 md:gap-4 truncate mr-2">
                    <span className={`w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg ${i === 0 ? 'bg-yellow-400 text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'}`}>{i + 1}</span>
                    <span className={`font-bold text-xs md:text-sm truncate ${r.name === studentName ? 'text-yellow-400' : 'text-slate-200'}`}>
                        {r.name} {r.name === studentName && <span className="text-[10px] text-yellow-500/80 ml-1">(You)</span>}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-blue-300 block leading-none text-sm md:text-base">{r.avg.toFixed(1)}</span>
                    <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">{selectedExamId ? 'Marks' : 'Avg'}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Conditional Reset Button */}
            {selectedExamId && (
                <button onClick={resetSelection} className="w-full mt-4 md:mt-6 py-3 md:py-4 bg-blue-600 hover:bg-blue-500 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 flex justify-center items-center gap-2">
                   View Overall Rank
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}