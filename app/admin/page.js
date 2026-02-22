"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, Eye, EyeOff, Save, UserPlus, Trash2, LogOut, Search, PlusCircle } from "lucide-react";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marksList, setMarksList] = useState([]);
  
  // Search States
  const [searchTermMarks, setSearchTermMarks] = useState("");
  const [searchTermStudents, setSearchTermStudents] = useState("");
  
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
    if (error) alert("Student ID already exists or Error occurred!");
    else {
      alert("Student Registered Successfully!");
      setStId(""); setStName(""); setStPass("");
      fetchStudents();
    }
  };

  const deleteStudent = async (id) => {
    if (confirm("Are you sure? This will delete the student and all their marks permanently.")) {
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
    const name = prompt("Enter New Exam Name (e.g., Paper 05):");
    if (!name) return;
    
    const { data: exam } = await supabase.from("exams").insert([{ exam_name: name, is_published: false }]).select().single();
    
    if (exam) {
      // DEFAULT: All students are marked as PRESENT (is_absent: false) and scores 0
      const initialMarks = students.map(s => ({ 
          student_id: s.student_id, 
          exam_id: exam.id, 
          is_absent: false,
          mcq_score: 0,
          structured_score: 0,
          essay_score: 0
      }));
      await supabase.from("marks").insert(initialMarks);
      fetchExams();
    }
  };

  const deleteExam = async (id) => {
    if (confirm("Are you sure? This will delete the EXAM and ALL MARKS associated with it!")) {
      await supabase.from("exams").delete().eq("id", id);
      if (selectedExam?.id === id) setSelectedExam(null);
      fetchExams();
    }
  };

  const loadExamMarks = async (exam) => {
    setSelectedExam(exam);
    setSearchTermMarks(""); // Reset search when loading new exam
    const { data } = await supabase.from("marks").select("*, students(name)").eq("exam_id", exam.id);
    setMarksList(data || []);
  };

  const updateMark = (index, field, value) => {
    const newList = [...marksList];
    // Allow empty string for clearing input, otherwise parse int
    newList[index][field] = value === '' ? '' : (parseInt(value) || 0);
    
    // If Admin types a mark, auto-set student to PRESENT
    if (field !== 'is_absent' && newList[index].is_absent) {
        newList[index].is_absent = false;
    }
    setMarksList(newList);
  };

  const saveAllMarks = async () => {
    // Sanitize data before saving (convert empty strings back to 0)
    const updates = marksList.map(({ students, ...rest }) => ({
        ...rest,
        mcq_score: rest.mcq_score === '' ? 0 : rest.mcq_score,
        structured_score: rest.structured_score === '' ? 0 : rest.structured_score,
        essay_score: rest.essay_score === '' ? 0 : rest.essay_score,
    }));
    
    const { error } = await supabase.from("marks").upsert(updates);
    if (!error) alert("Marks Saved Successfully!");
    else alert("Error saving marks!");
  };

  const togglePublish = async (id, status) => {
    await supabase.from("exams").update({ is_published: !status }).eq("id", id);
    fetchExams();
  };

  const handleLogout = () => {
    localStorage.clear(); 
    router.push("/admin/login");
  };

  return (
    // BULLETPROOF LAYOUT: Fixed height, overflow hidden at root.
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex flex-col w-72 h-full bg-slate-950 text-white p-8 shadow-2xl z-20 shrink-0">
        <div className="flex items-center gap-3 font-black text-2xl tracking-tighter mb-12 text-blue-500">
            <LayoutDashboard size={32} strokeWidth={2.5}/> ADMIN HUB
        </div>
        <nav className="space-y-3 flex-1">
            <button onClick={() => setActiveTab("students")} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                <Users size={20}/> Students
            </button>
            <button onClick={() => setActiveTab("exams")} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'exams' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                <FileText size={20}/> Exams & Marks
            </button>
        </nav>
        <button onClick={handleLogout} className="p-4 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={18}/> Sign Out
        </button>
      </aside>

      {/* ================= RIGHT MAIN AREA ================= */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* MOBILE TOP HEADER */}
        <header className="md:hidden flex items-center justify-between bg-slate-950 text-white p-4 z-30 shrink-0 shadow-md">
            <div className="flex items-center gap-2 font-black text-xl tracking-tighter text-blue-500">
                <LayoutDashboard size={24}/> ADMIN HUB
            </div>
            <button onClick={handleLogout} className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={20}/>
            </button>
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 pb-24 md:pb-12 custom-scrollbar">
          
          {/* === STUDENTS TAB === */}
          {activeTab === "students" && (
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10">
              {/* Registration Form */}
              <div className="w-full lg:w-1/3 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 h-fit lg:sticky lg:top-0">
                  <h3 className="font-black text-lg md:text-xl mb-5 md:mb-6 flex items-center gap-2 text-slate-800"><UserPlus className="text-blue-600"/> New Registration</h3>
                  <form onSubmit={handleAddStudent} className="space-y-4">
                      <input required type="text" placeholder="Student ID (ST001)" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder-slate-400 transition-all text-sm md:text-base" value={stId} onChange={(e)=>setStId(e.target.value)} />
                      <input required type="text" placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder-slate-400 transition-all text-sm md:text-base" value={stName} onChange={(e)=>setStName(e.target.value)} />
                      <input required type="text" placeholder="Assign Password" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold placeholder-slate-400 transition-all text-sm md:text-base" value={stPass} onChange={(e)=>setStPass(e.target.value)} />
                      <button className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95 text-sm md:text-base mt-2">Register Student</button>
                  </form>
              </div>
              
              {/* Students List */}
              <div className="flex-1 bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                      <h3 className="font-black text-lg md:text-xl text-slate-800">Enrolled Students <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-lg text-sm ml-2">{students.length}</span></h3>
                      <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18}/>
                          <input type="text" placeholder="Search student..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all" value={searchTermStudents} onChange={(e) => setSearchTermStudents(e.target.value)} />
                      </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {students.filter(s => s.name.toLowerCase().includes(searchTermStudents.toLowerCase()) || s.student_id.toLowerCase().includes(searchTermStudents.toLowerCase())).map(s => (
                          <div key={s.student_id} className="flex justify-between items-center p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 md:hover:border-blue-200 transition-all">
                              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                  <div className="w-10 h-10 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                                      {s.name.charAt(0)}
                                  </div>
                                  <div className="truncate pr-2">
                                      <p className="font-black text-slate-700 text-sm md:text-base truncate">{s.name}</p>
                                      <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-widest uppercase truncate">{s.student_id} • Pass: <span className="text-slate-500">{s.password}</span></p>
                                  </div>
                              </div>
                              <button onClick={() => deleteStudent(s.student_id)} className="p-2 shrink-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Student">
                                  <Trash2 size={18}/>
                              </button>
                          </div>
                      ))}
                      {students.length > 0 && students.filter(s => s.name.toLowerCase().includes(searchTermStudents.toLowerCase()) || s.student_id.toLowerCase().includes(searchTermStudents.toLowerCase())).length === 0 && (
                          <p className="text-center text-slate-400 font-bold py-10 text-sm">No students found.</p>
                      )}
                  </div>
              </div>
            </div>
          )}

          {/* === EXAMS & MARKS TAB === */}
          {activeTab === "exams" && (
            <div className="max-w-7xl mx-auto h-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div>
                      <h2 className="text-2xl md:text-4xl font-black tracking-tight text-slate-800">Exam Center</h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">Manage papers and student marks</p>
                  </div>
                  <button onClick={createExam} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-600/30 transition-transform active:scale-95 text-sm md:text-base">
                      <PlusCircle size={20}/> Create Exam
                  </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 pb-10">
                  
                  {/* Left Sidebar: Exam List */}
                  <div className="lg:col-span-4 bg-white p-5 md:p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col max-h-[400px] lg:max-h-[700px]">
                      <h3 className="font-black text-xs text-slate-400 uppercase tracking-[0.2em] mb-4 shrink-0">Exam History</h3>
                      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-2">
                          {exams.map(e => (
                              <div key={e.id} onClick={() => loadExamMarks(e)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedExam?.id === e.id ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100/50' : 'border-slate-100 hover:border-blue-200'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-black text-slate-700 text-sm md:text-base truncate pr-2">{e.exam_name}</span>
                                      <div className="flex gap-1 shrink-0">
                                          <button onClick={(ev) => { ev.stopPropagation(); togglePublish(e.id, e.is_published); }} className={`p-1.5 md:p-2 rounded-xl transition-all ${e.is_published ? 'text-emerald-500 bg-emerald-100/50 hover:bg-emerald-200' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`} title={e.is_published ? "Unpublish" : "Publish"}>
                                              {e.is_published ? <Eye size={16}/> : <EyeOff size={16}/>}
                                          </button>
                                          <button onClick={(ev) => { ev.stopPropagation(); deleteExam(e.id); }} className="p-1.5 md:p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete Exam">
                                              <Trash2 size={16}/>
                                          </button>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${e.is_published ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                      <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.is_published ? 'Published to Students' : 'Draft / Hidden'}</span>
                                  </div>
                              </div>
                          ))}
                          {exams.length === 0 && <p className="text-center text-slate-400 text-xs md:text-sm font-bold py-5">No exams created yet.</p>}
                      </div>
                  </div>

                  {/* Right Area: Mark Entry Table */}
                  {selectedExam ? (
                      <div className="lg:col-span-8 bg-white p-5 md:p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                              <div className="w-full md:w-auto">
                                  <h3 className="font-black text-xl md:text-2xl tracking-tight text-slate-800 break-words flex items-center gap-2">
                                    Grading: <span className="text-blue-600">{selectedExam.exam_name}</span>
                                  </h3>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                                  <div className="relative w-full sm:w-56">
                                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18}/>
                                      <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-all" value={searchTermMarks} onChange={(e) => setSearchTermMarks(e.target.value)} />
                                  </div>
                                  <button onClick={saveAllMarks} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-300 whitespace-nowrap active:scale-95 text-sm md:text-base">
                                      <Save size={18}/> Save Marks
                                  </button>
                              </div>
                          </div>

                          <div className="overflow-x-auto pb-4 custom-scrollbar rounded-xl border border-slate-100 bg-slate-50/50">
                              <table className="w-full min-w-[700px]">
                                  <thead className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest border-b border-slate-200 bg-white sticky top-0 z-20">
                                      <tr>
                                          <th className="text-left py-4 px-4 sticky left-0 bg-white z-30 shadow-[1px_0_0_#f1f5f9]">Student</th>
                                          <th className="py-4 px-2 w-20 text-center">MCQ</th>
                                          <th className="py-4 px-2 w-20 text-center">Struct.</th>
                                          <th className="py-4 px-2 w-20 text-center">Essay</th>
                                          <th className="py-4 px-2 w-20 text-center text-blue-500">Total</th>
                                          <th className="py-4 px-4 w-32 text-center">Status</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {marksList
                                          .filter(m => m.students?.name.toLowerCase().includes(searchTermMarks.toLowerCase()) || m.student_id.toLowerCase().includes(searchTermMarks.toLowerCase()))
                                          .map((m) => {
                                          const originalIndex = marksList.findIndex(x => x.id === m.id);
                                          const total = (Number(m.mcq_score) || 0) + (Number(m.structured_score) || 0) + (Number(m.essay_score) || 0);
                                          
                                          return (
                                          <tr key={m.id} className={`transition-all hover:bg-white ${m.is_absent ? 'opacity-60 bg-slate-100' : ''}`}>
                                              
                                              {/* Student Name */}
                                              <td className="py-3 px-4 sticky left-0 bg-slate-50 shadow-[1px_0_0_#f1f5f9] z-10 group-hover:bg-white">
                                                  <p className="font-bold text-slate-700 text-sm truncate w-32 md:w-48">{m.students?.name}</p>
                                                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 tracking-wider uppercase">{m.student_id}</p>
                                              </td>
                                              
                                              {/* Inputs - Removed Disabled Attribute to fix UX! */}
                                              <td className="text-center p-2">
                                                  <input type="number" onFocus={(e) => e.target.select()} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-black text-slate-700 text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={m.mcq_score} onChange={(e) => updateMark(originalIndex, 'mcq_score', e.target.value)} />
                                              </td>
                                              <td className="text-center p-2">
                                                  <input type="number" onFocus={(e) => e.target.select()} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-black text-slate-700 text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={m.structured_score} onChange={(e) => updateMark(originalIndex, 'structured_score', e.target.value)} />
                                              </td>
                                              <td className="text-center p-2">
                                                  <input type="number" onFocus={(e) => e.target.select()} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg font-black text-slate-700 text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" value={m.essay_score} onChange={(e) => updateMark(originalIndex, 'essay_score', e.target.value)} />
                                              </td>
                                              
                                              {/* Live Total */}
                                              <td className="text-center p-2">
                                                  <div className="w-full p-2.5 bg-blue-50 border border-blue-100 rounded-lg font-black text-blue-600 text-center text-sm">
                                                      {m.is_absent ? '-' : total}
                                                  </div>
                                              </td>

                                              {/* Status Toggle */}
                                              <td className="text-center p-2 px-4">
                                                  <button onClick={() => updateMark(originalIndex, 'is_absent', !m.is_absent)} className={`w-full py-2.5 rounded-lg text-[9px] md:text-[10px] font-black tracking-widest transition-all shadow-sm ${m.is_absent ? 'bg-red-50 text-red-500 border border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'}`}>
                                                      {m.is_absent ? 'ABSENT' : 'PRESENT'}
                                                  </button>
                                              </td>
                                          </tr>
                                      )})}
                                  </tbody>
                              </table>
                              {marksList.filter(m => m.students?.name.toLowerCase().includes(searchTermMarks.toLowerCase()) || m.student_id.toLowerCase().includes(searchTermMarks.toLowerCase())).length === 0 && (
                                  <div className="text-center text-slate-400 font-bold py-10 text-sm">No matching students found.</div>
                              )}
                          </div>
                      </div>
                  ) : (
                      <div className="lg:col-span-8 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 h-64 md:h-[400px]">
                          <FileText size={48} className="mb-4 opacity-30"/>
                          <p className="font-black text-lg md:text-2xl text-slate-500">No Exam Selected</p>
                          <p className="text-xs md:text-sm font-medium mt-2 text-center">Select an exam from the left panel to manage marks.</p>
                      </div>
                  )}
              </div>
            </div>
          )}
        </main>

        {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white border-t border-slate-200 p-2 flex justify-around items-center z-40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button onClick={() => setActiveTab("students")} className={`flex flex-col items-center justify-center p-2 w-1/2 rounded-xl transition-all ${activeTab === 'students' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                <Users size={20} className={activeTab === 'students' ? 'fill-blue-100' : ''}/> 
                <span className="text-[10px] font-black mt-1">Students</span>
            </button>
            <button onClick={() => setActiveTab("exams")} className={`flex flex-col items-center justify-center p-2 w-1/2 rounded-xl transition-all ${activeTab === 'exams' ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                <FileText size={20} className={activeTab === 'exams' ? 'fill-blue-100' : ''}/> 
                <span className="text-[10px] font-black mt-1">Exams & Marks</span>
            </button>
        </nav>

      </div>
    </div>
  );
}