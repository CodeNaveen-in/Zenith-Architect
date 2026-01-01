
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MONTHS, UI_ICONS, CATEGORY_COLORS, ACCENT_GOLD } from './constants';
import { Goal, GoalCategory, YearlyPlan } from './types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [currentYear, setCurrentYear] = useState(() => {
    const savedYear = localStorage.getItem('zenith-active-year');
    return savedYear ? parseInt(savedYear) : new Date().getFullYear();
  });

  const [yearlyPlan, setYearlyPlan] = useState<YearlyPlan>(() => {
    const saved = localStorage.getItem(`zenith-plan-${currentYear}`);
    if (saved) return JSON.parse(saved);
    return {
      year: currentYear,
      months: MONTHS.map(m => ({ month: m, goals: [], focus: '' }))
    };
  });

  const [activeMonthIndex, setActiveMonthIndex] = useState(new Date().getMonth());
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync state with local storage
  useEffect(() => {
    localStorage.setItem(`zenith-plan-${currentYear}`, JSON.stringify(yearlyPlan));
    localStorage.setItem('zenith-active-year', currentYear.toString());
  }, [yearlyPlan, currentYear]);

  const handleYearChange = (newYear: number) => {
    setCurrentYear(newYear);
    const savedPlan = localStorage.getItem(`zenith-plan-${newYear}`);
    
    if (savedPlan) {
      setYearlyPlan(JSON.parse(savedPlan));
    } else {
      setYearlyPlan({
        year: newYear,
        months: MONTHS.map(m => ({ month: m, goals: [], focus: '' }))
      });
    }
  };

  const activeMonth = yearlyPlan.months[activeMonthIndex];

  const handleAddGoal = (goal: Partial<Goal>) => {
    const newGoal: Goal = {
      id: crypto.randomUUID(),
      title: goal.title || 'Untitled Aspiration',
      description: goal.description || '',
      category: goal.category || GoalCategory.PERSONAL,
      completed: false,
      ...goal
    };

    setYearlyPlan(prev => ({
      ...prev,
      months: prev.months.map((m, idx) => 
        idx === activeMonthIndex 
          ? { ...m, goals: [...m.goals, newGoal] }
          : m
      )
    }));
  };

  const toggleGoal = (id: string) => {
    setYearlyPlan(prev => ({
      ...prev,
      months: prev.months.map((m, idx) => 
        idx === activeMonthIndex 
          ? { ...m, goals: m.goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g) }
          : m
      )
    }));
  };

  const deleteGoal = (id: string) => {
    setYearlyPlan(prev => ({
      ...prev,
      months: prev.months.map((m, idx) => 
        idx === activeMonthIndex 
          ? { ...m, goals: m.goals.filter(g => g.id !== id) }
          : m
      )
    }));
  };

  const exportAsPNG = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#fdfcfb',
        logging: false,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Zenith_${yearlyPlan.year}_Architect.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#fdfcfb',
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; 
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Zenith_${yearlyPlan.year}_Architect.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const chartData = useMemo(() => {
    return yearlyPlan.months.map(m => ({
      name: m.month.substring(0, 3),
      percent: m.goals.length > 0 ? (m.goals.filter(g => g.completed).length / m.goals.length) * 100 : 0
    }));
  }, [yearlyPlan]);

  const completionStats = useMemo(() => {
    const allGoals = yearlyPlan.months.flatMap(m => m.goals);
    const total = allGoals.length;
    const completed = allGoals.filter(g => g.completed).length;
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [yearlyPlan]);

  return (
    <div className="min-h-screen pb-32 no-print selection:bg-stone-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fdfcfb]/80 backdrop-blur-xl border-b lux-border py-6 px-8 md:px-16">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-[#c5a059] shadow-xl">
              <UI_ICONS.Target className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-light serif-heading tracking-[0.1em] text-stone-800 uppercase leading-none">Zenith</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Architect</p>
                <div className="flex items-center gap-1.5 border-l lux-border pl-3">
                  <button onClick={() => handleYearChange(currentYear - 1)} className="text-stone-300 hover:text-stone-800 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="text-xs font-medium text-stone-600 tracking-tighter w-8 text-center">{currentYear}</span>
                  <button onClick={() => handleYearChange(currentYear + 1)} className="text-stone-300 hover:text-stone-800 transition-colors">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2.5 px-6 py-2.5 bg-stone-900 text-[#fdfcfb] rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
                >
                  <UI_ICONS.Download className={`w-3 h-3 ${isExporting ? 'animate-bounce' : ''}`} />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-2xl border lux-border py-2 z-50 overflow-hidden">
                    <button onClick={exportAsPNG} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-3">
                      <UI_ICONS.Image className="w-3.5 h-3.5" style={{ color: ACCENT_GOLD }} /> PNG Archive
                    </button>
                    <button onClick={exportAsPDF} className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors flex items-center gap-3">
                      <UI_ICONS.FileText className="w-3.5 h-3.5" style={{ color: ACCENT_GOLD }} /> PDF Portfolio
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 md:px-16 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <aside className="lg:col-span-3 space-y-10">
          <div className="space-y-6">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-4 h-px bg-stone-200"></span> Timeline
            </h2>
            <nav className="space-y-1">
              {yearlyPlan.months.map((m, idx) => (
                <button
                  key={m.month}
                  onClick={() => setActiveMonthIndex(idx)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                    activeMonthIndex === idx 
                      ? 'bg-stone-100/50 text-stone-900 shadow-sm border lux-border' 
                      : 'text-stone-400 hover:text-stone-700 hover:translate-x-1'
                  }`}
                >
                  <span className={`text-sm tracking-wide ${activeMonthIndex === idx ? 'font-semibold' : 'font-light'}`}>{m.month}</span>
                  {m.goals.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-8 border-t lux-border">
            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <span className="w-4 h-px bg-stone-200"></span> Completion
            </h2>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <Tooltip cursor={{fill: 'transparent'}} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 border lux-border shadow-xl rounded-lg text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          {payload[0].value}% complete
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Bar dataKey="percent" radius={[2, 2, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === activeMonthIndex ? ACCENT_GOLD : '#e5e5e5'} 
                        fillOpacity={index === activeMonthIndex ? 1 : 0.4}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center px-1">
               <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Overall Year</span>
               <span className="text-lg serif-heading italic text-stone-800">{completionStats.percent}%</span>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.3em]">Chapter {activeMonthIndex + 1}</p>
              <h2 className="text-6xl font-light serif-heading text-stone-800 tracking-tight leading-none">{activeMonth.month}</h2>
              <p className="text-stone-400 text-sm font-light italic max-w-sm">Craft your milestones for a refined {yearlyPlan.year}.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => handleAddGoal({})}
                className="flex items-center gap-4 px-8 py-3.5 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl"
              >
                <UI_ICONS.Plus className="w-4 h-4 text-[#c5a059]" />
                Add Milestone
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {activeMonth.goals.length === 0 ? (
              <div className="py-24 text-center border lux-border rounded-[2rem] bg-white/30">
                <UI_ICONS.Target className="w-12 h-12 text-stone-100 mx-auto mb-6" />
                <h3 className="serif-heading text-2xl font-light text-stone-400 italic">Tabula Rasa</h3>
                <p className="text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">A blank canvas for your ambitions</p>
              </div>
            ) : (
              activeMonth.goals.map((goal) => (
                <div 
                  key={goal.id}
                  className={`group relative overflow-hidden flex items-start gap-8 p-8 rounded-[1.5rem] transition-all border ${
                    goal.completed 
                      ? 'bg-stone-50/50 border-stone-100 opacity-60' 
                      : 'bg-white border-transparent lux-shadow hover:lux-border'
                  }`}
                >
                  <button 
                    onClick={() => toggleGoal(goal.id)}
                    className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      goal.completed 
                        ? 'bg-[#c5a059] border-[#c5a059] text-white' 
                        : 'border-stone-200 text-transparent hover:border-[#c5a059]'
                    }`}
                  >
                    <UI_ICONS.CheckCircle className="w-3 h-3" />
                  </button>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-4">
                      <select 
                        value={goal.category}
                        onChange={(e) => {
                          setYearlyPlan(prev => ({
                            ...prev,
                            months: prev.months.map((m, idx) => 
                              idx === activeMonthIndex 
                                ? { ...m, goals: m.goals.map(g => g.id === goal.id ? { ...g, category: e.target.value as GoalCategory } : g) }
                                : m
                            )
                          }));
                        }}
                        className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded border appearance-none focus:outline-none focus:ring-0 cursor-pointer transition-all ${CATEGORY_COLORS[goal.category]}`}
                      >
                        {Object.values(GoalCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <input 
                      type="text"
                      value={goal.title}
                      onChange={(e) => {
                         setYearlyPlan(prev => ({
                          ...prev,
                          months: prev.months.map((m, idx) => 
                            idx === activeMonthIndex 
                              ? { ...m, goals: m.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g) }
                              : m
                          )
                        }));
                      }}
                      className={`w-full text-xl serif-heading font-medium bg-transparent border-none focus:ring-0 p-0 ${goal.completed ? 'line-through text-stone-400' : 'text-stone-800'}`}
                    />
                    <textarea
                      value={goal.description}
                      placeholder="Articulate the vision..."
                      onChange={(e) => {
                         setYearlyPlan(prev => ({
                            ...prev,
                            months: prev.months.map((m, idx) => 
                              idx === activeMonthIndex 
                                ? { ...m, goals: m.goals.map(g => g.id === goal.id ? { ...g, description: e.target.value } : g) }
                                : m
                            )
                          }));
                      }}
                      className="w-full text-xs font-light text-stone-500 bg-transparent border-none focus:ring-0 p-0 resize-none h-auto min-h-[1.5rem]"
                    />
                  </div>

                  <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-stone-200 hover:text-stone-800 transition-all absolute top-4 right-4"
                  >
                    <UI_ICONS.Trash className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 glass-morphism px-8 py-4 rounded-full lux-shadow border lux-border flex items-center gap-12 z-50">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none">Global Progression</span>
          <div className="flex items-center gap-4">
            <span className="text-xl serif-heading italic text-stone-800 leading-none">{completionStats.percent}%</span>
            <div className="w-32 h-1 bg-stone-100 rounded-full overflow-hidden">
               <div className="h-full bg-[#c5a059] transition-all duration-1000 ease-out" style={{ width: `${completionStats.percent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="h-10 w-px bg-stone-100"></div>
        <div className="flex flex-col gap-1">
           <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest leading-none">Current Phase</span>
           <span className="text-sm font-medium text-stone-700 leading-none">{activeMonth.month}</span>
        </div>
      </div>

      <div className="fixed top-[-9999px] left-[-9999px]">
        <div ref={reportRef} className="w-[1000px] p-24 bg-[#fdfcfb] text-stone-900 flex flex-col gap-16 font-['Inter']">
           <div className="flex justify-between items-end border-b lux-border pb-16">
              <div className="space-y-4">
                <h1 className="text-7xl font-light serif-heading tracking-tight leading-none text-stone-800">Zenith Architect</h1>
                <p className="text-[10px] font-bold text-[#c5a059] uppercase tracking-[0.5em]">The Year of {yearlyPlan.year}</p>
              </div>
              <div className="text-right space-y-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Yearly Completion</p>
                <p className="text-8xl serif-heading text-stone-800 leading-none">{completionStats.percent}<span className="text-4xl ml-1 font-light">%</span></p>
              </div>
           </div>

           <div className="grid grid-cols-3 gap-x-12 gap-y-16">
              {yearlyPlan.months.filter(m => m.goals.length > 0).map(m => (
                <div key={m.month} className="space-y-6">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-[0.3em] border-b lux-border pb-2 flex justify-between items-center">
                    {m.month}
                    <span className="text-[#c5a059] font-serif italic lowercase tracking-normal text-lg">{m.goals.filter(g => g.completed).length}/{m.goals.length}</span>
                  </h3>
                  <ul className="space-y-5">
                    {m.goals.map(g => (
                      <li key={g.id} className="flex gap-4">
                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${g.completed ? 'bg-[#c5a059]' : 'border border-stone-200'}`}></div>
                        <div className="space-y-1">
                          <p className={`text-sm font-medium tracking-tight ${g.completed ? 'text-stone-400' : 'text-stone-800'}`}>
                            {g.title}
                          </p>
                          <p className="text-[10px] font-light text-stone-400 italic leading-snug">{g.description}</p>
                          <span className={`inline-block mt-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${CATEGORY_COLORS[g.category]}`}>
                            {g.category}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
           </div>

           <div className="mt-auto pt-24 flex justify-between items-center text-stone-300 text-[9px] font-bold uppercase tracking-[0.3em]">
              <p>Designed for the ambitious via Zenith Architect</p>
              <p>{new Date().getFullYear()} &copy; CURATED ASPIRATIONS</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
