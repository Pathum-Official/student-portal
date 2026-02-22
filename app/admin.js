"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, Eye, EyeOff, Save, UserPlus, Trash2, LogOut } from "lucide-react";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksList, setMarksList] = useState([]);
  
  // Student Form States
  const [stId, setStId] = useState("");
  const [stName, setStName] = useState("");
  const [stPass, setStPass] = useState("");

  const router = useRouter();

  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (!auth) { router.push("/admin/login"); return; }
    fetchStudents();
    fetchExams();
  }, []);

  // --- STUDENT FUNCTIONS ---
  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("student_id", { ascending: true });
    setStudents(data || []);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("students").insert([{ student_id: stId, name: stName, password: stPass }]);
    if (error) alert("Student ID already exists!");
    else {
      alert("Student Registered!");
      setStId(""); setStName(""); setStPass("");
      fetchStudents();
    }
  };

  const deleteStudent = async (id) => {
    if (confirm("Delete student and all their marks?")) {
      await supabase.from("students").delete().eq("student_id", id);
      fetchStudents();
    }
  };

  // --- EXAM & MARKS FUNCTIONS ---
  const fetchExams = async () => {
    const { data } = await supabase.from("exams").select("*").order("id", { ascending: false });
    setExams(data || []);
  };

  const createExam = async () => {
    const name = prompt("Enter Exam Name:");
    if (!name) return;
    const { data: exam } = await supabase.from("exams").insert([{ exam_name: name, is_published: false }]).select().single();
    if (exam) {
      const initialMarks = students.map(s => ({ student_id: s.student_id, exam_id: exam.id, is_absent: true }));
      await supabase.from("marks").insert(initialMarks);
      fetchExams();
    }
  };

  const loadExamMarks = async (exam) => {
    setSelectedExam(exam);
    const { data } = await supabase.from("marks").select("*, students(name)").eq("exam_id", exam.id);
    setMarksList(data || []);
  };

  const updateMark = (index, field, value) => {
    const newList = [...marksList];
    newList[index][field] = value;
    if (field !== 'is_absent') newList[index].is_absent = false;
    setMarksList(newList);
  };

  const saveAllMarks = async () => {
    const updates = marksList.map(({ students, ...rest }) => rest);
    const { error } = await supabase.from("marks").upsert(updates);
    if (!error) alert("Marks Saved Successfully!");
  };

  const togglePublish = async (id, status) => {
    await supabase.from("exams").update({ is_published: !status }).eq("id", id);
    fetchExams();
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-white p-8 shadow-2xl flex flex-col">
        <div className="flex items-center gap-3 font-black text-2xl tracking-tighter mb-12 text-blue-500">
            <LayoutDashboard size={32}/> ADMIN HUB
        </div>
        <nav className="space-y-3 flex-1">
            <button onClick={() => setActiveTab("students")} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-900'}`}><Users size={20}/> Students</button>
            <button onClick={() => setActiveTab("exams")} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'exams' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-900'}`}><FileText size={20}/> Exams & Marks</button>
        </nav>
        <button onClick={() => { localStorage.clear(); router.push("/admin/login"); }} className="p-4 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={18}/> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        {activeTab === "students" && (
          <div className="max-w-6xl mx-auto flex gap-10">
            {/* Form */}
            <div className="w-1/3 bg-white p-8 rounded-[2rem] shadow-xl border border-white">
                <h3 className="font-black text-xl mb-6 flex items-center gap-2"><UserPlus className="text-blue-600"/> New Registration</h3>
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <input required type="text" placeholder="Student ID (ST001)" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={stId} onChange={(e)=>setStId(e.target.value)} />
                    <input required type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={stName} onChange={(e)=>setStName(e.target.value)} />
                    <input required type="text" placeholder="Assign Password" className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={stPass} onChange={(e)=>setStPass(e.target.value)} />
                    <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">Register Now</button>
                </form>
            </div>
            {/* List */}
            <div className="flex-1 bg-white p-8 rounded-[2rem] shadow-xl border border-white">
                <h3 className="font-black text-xl mb-6">Enrolled Students</h3>
                <div className="space-y-3">
                    {students.map(s => (
                        <div key={s.student_id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                            <div>
                                <p className="font-black text-slate-700">{s.name}</p>
                                <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">{s.student_id} • Pass: {s.password}</p>
                            </div>
                            <button onClick={() => deleteStudent(s.student_id)} className="p-2 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeTab === "exams" && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black tracking-tight text-slate-800">Exam Center</h2>
                <button onClick={createExam} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 transition-transform hover:scale-105">+ Create Exam</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Exam List */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                    <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] mb-6">History</h3>
                    <div className="space-y-4">
                        {exams.map(e => (
                            <div key={e.id} onClick={() => loadExamMarks(e)} className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all ${selectedExam?.id === e.id ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-100' : 'border-slate-50 hover:border-blue-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className="font-black text-slate-700">{e.exam_name}</span>
                                    <button onClick={(ev) => { ev.stopPropagation(); togglePublish(e.id, e.is_published); }} className={`p-2 rounded-xl ${e.is_published ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 bg-slate-50'}`}>
                                        {e.is_published ? <Eye size={20}/> : <EyeOff size={20}/>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mark Entry Table */}
                {selectedExam && (
                    <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="font-black text-2xl tracking-tight">Grading: {selectedExam.exam_name}</h3>
                            <button onClick={saveAllMarks} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-300"><Save size={20}/> Save Changes</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="text-left pb-6">Student</th>
                                        <th className="pb-6">MCQ</th>
                                        <th className="pb-6">Struct.</th>
                                        <th className="pb-6">Essay</th>
                                        <th className="pb-6">Presence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {marksList.map((m, i) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                                            <td className="py-5 font-bold text-slate-700">{m.students?.name}</td>
                                            <td className="text-center"><input type="number" className="w-16 p-3 bg-slate-50 border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-500" value={m.mcq_score} onChange={(e) => updateMark(i, 'mcq_score', parseInt(e.target.value) || 0)} /></td>
                                            <td className="text-center"><input type="number" className="w-16 p-3 bg-slate-50 border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-500" value={m.structured_score} onChange={(e) => updateMark(i, 'structured_score', parseInt(e.target.value) || 0)} /></td>
                                            <td className="text-center"><input type="number" className="w-16 p-3 bg-slate-50 border-none rounded-xl font-bold text-center focus:ring-2 focus:ring-blue-500" value={m.essay_score} onChange={(e) => updateMark(i, 'essay_score', parseInt(e.target.value) || 0)} /></td>
                                            <td className="text-center">
                                                <button onClick={() => updateMark(i, 'is_absent', !m.is_absent)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${m.is_absent ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
                                                    {m.is_absent ? 'ABSENT' : 'PRESENT'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}