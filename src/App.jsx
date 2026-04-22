import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  CheckCircle2, HelpCircle, ChevronUp, Info, Lightbulb,
  LayoutList, Save, AlertCircle, PlayCircle, Cloud, Loader2, ArrowLeft,
  Baby, BookOpen, Monitor, Rocket, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { supabase } from './supabaseClient';
import { LEERPLAN_DATA } from './data';

const GROUPS = {
  kleuters: { name: 'Kleuters', ages: ['Leeftijd 3-4', 'Leeftijd 4-5', 'Leeftijd 5-6'], icon: Baby, color: 'bg-pink-500' },
  graad1: { name: '1ste Graad', ages: ['Leeftijd 6-7', 'Leeftijd 7-8'], icon: BookOpen, color: 'bg-emerald-500' },
  graad2: { name: '2e Graad', ages: ['Leeftijd 8-9', 'Leeftijd 9-10'], icon: Monitor, color: 'bg-blue-500' },
  graad3: { name: '3e Graad', ages: ['Leeftijd 10-11', 'Leeftijd 11-12'], icon: Rocket, color: 'bg-purple-500' }
};

const THEME_COLORS = {
  "Digitale informatievaardigheid": { bg: "bg-sky-50", border: "border-sky-300", header: "bg-sky-600", text: "text-sky-800" },
  "Mediawijsheid": { bg: "bg-rose-50", border: "border-rose-300", header: "bg-rose-600", text: "text-rose-800" },
  "Computationeel denken": { bg: "bg-purple-50", border: "border-purple-300", header: "bg-purple-600", text: "text-purple-800" },
  "Digitale creatie": { bg: "bg-amber-50", border: "border-amber-300", header: "bg-amber-600", text: "text-amber-800" }
};

const FormattedText = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let currentList = [];

  const pushList = () => {
    if (currentList.length > 0) {
      elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 mb-3 space-y-1.5 text-slate-700">{[...currentList]}</ul>);
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      currentList.push(<li key={index} className="pl-1">{trimmed.substring(1).trim()}</li>);
    } else {
      pushList();
      if (trimmed) elements.push(<p key={index} className="mb-1.5 font-semibold text-slate-800">{trimmed}</p>);
    }
  });
  pushList();
  return <div className="mt-1 text-sm">{elements}</div>;
};

const GoalRow = ({ goal, currentStatus, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const hasExtraInfo = goal.mia || goal.begrippen || goal.voorbeelden;

  return (
    <div className="flex flex-col border-b border-slate-200 hover:bg-white transition-colors bg-white/50">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between p-4 gap-4">
        <div className="flex-grow flex items-start gap-3">
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded mt-0.5 shrink-0 border border-slate-300">
            {goal.id}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800 leading-snug">{goal.leerdoel}</span>
            {hasExtraInfo && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center mt-1 w-max">
                {expanded ? <ChevronUp size={14} className="mr-1"/> : <Info size={14} className="mr-1"/>}
                {expanded ? "Verberg info" : "Toon details"}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0 self-end xl:self-auto">
          <button onClick={() => onStatusChange(goal.id, 'goed')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center border transition-all ${currentStatus === 'goed' ? 'bg-green-100 border-green-500 text-green-700 shadow-inner' : 'bg-white border-slate-300 text-slate-500 hover:bg-green-50'}`}>
            <CheckCircle2 size={14} className={`mr-1.5 ${currentStatus === 'goed' ? 'text-green-600' : 'text-slate-400'}`}/> Doen we al
          </button>
          <button onClick={() => onStatusChange(goal.id, 'iets')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center border transition-all ${currentStatus === 'iets' ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-inner' : 'bg-white border-slate-300 text-slate-500 hover:bg-blue-50'}`}>
            <PlayCircle size={14} className={`mr-1.5 ${currentStatus === 'iets' ? 'text-blue-600' : 'text-slate-400'}`}/> Deels
          </button>
          <button onClick={() => onStatusChange(goal.id, 'blinde_vlek')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center border transition-all ${currentStatus === 'blinde_vlek' ? 'bg-rose-100 border-rose-500 text-rose-700 shadow-inner' : 'bg-white border-slate-300 text-slate-500 hover:bg-rose-50'}`}>
            <AlertCircle size={14} className={`mr-1.5 ${currentStatus === 'blinde_vlek' ? 'text-rose-600' : 'text-slate-400'}`}/> Werkpunt
          </button>
        </div>
      </div>
      {expanded && hasExtraInfo && (
        <div className="px-14 pb-5 pt-3 bg-slate-50/80 text-slate-700 space-y-4 border-t border-slate-200">
          {goal.mia && <div><strong className="text-slate-900 block border-b pb-1 mb-2 uppercase text-xs">Achtergrondinfo</strong><FormattedText text={goal.mia} /></div>}
          {goal.begrippen && <div><strong className="text-slate-900 block border-b pb-1 mb-2 uppercase text-xs">Begrippen</strong><p className="text-sm">{goal.begrippen}</p></div>}
          {goal.voorbeelden && <div><strong className="text-slate-900 block border-b pb-1 mb-2 uppercase text-xs">Voorbeelden</strong><FormattedText text={goal.voorbeelden} /></div>}
        </div>
      )}
    </div>
  );
};

const SubthemeGroup = ({ onderwerp, subthema, goals, statuses, note, onStatusChange, onNoteChange, onNoteBlur }) => {
  const theme = THEME_COLORS[onderwerp] || THEME_COLORS["Digitale informatievaardigheid"];
  return (
    <div className={`mb-8 rounded-xl overflow-hidden shadow-md border ${theme.border}`}>
      <div className={`${theme.header} px-5 py-3 text-white flex justify-between items-center`}>
        <h3 className="font-bold text-lg">{subthema}</h3>
      </div>
      <div className={theme.bg}>
        {goals.map(g => <GoalRow key={g.id} goal={g} currentStatus={statuses[g.id]} onStatusChange={onStatusChange} />)}
      </div>
      <div className="p-5 bg-white border-t border-slate-200">
        <label className={`block text-sm font-bold uppercase mb-2 flex items-center ${theme.text}`}>
          <Lightbulb size={16} className="mr-2" /> Onze gezamenlijke aanpak voor "{subthema}"
        </label>
        <textarea value={note || ''} onChange={(e) => onNoteChange(subthema, e.target.value)} onBlur={onNoteBlur} placeholder="Typ hier jullie afspraken of lesintegratie..." className="w-full min-h-[100px] p-3 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" />
        <div className="flex justify-end mt-1 text-slate-400 text-[10px] font-bold uppercase"><Cloud size={12} className="mr-1"/> Slaat automatisch op</div>
      </div>
    </div>
  );
};

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (!selectedGroup) return;
    setLoadingDb(true);
    
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('ict_plan')
        .select('*')
        .eq('groep', selectedGroup)
        .single();

      if (data) {
        setStatuses(data.statuses || {});
        setNotes(data.notes || {});
      } else {
        setStatuses({});
        setNotes({});
      }
      setLoadingDb(false);
    };
    fetchData();
  }, [selectedGroup]);

  const filteredData = useMemo(() => {
    if (!selectedGroup) return [];
    const ages = GROUPS[selectedGroup].ages;
    return LEERPLAN_DATA.filter(d => d.leeftijdsgroepen.some(age => ages.includes(age)));
  }, [selectedGroup]);

  const onderwerpen = useMemo(() => [...new Set(filteredData.map(d => d.onderwerp))], [filteredData]);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (onderwerpen.length > 0 && !activeTab) setActiveTab(onderwerpen[0]);
  }, [onderwerpen, activeTab]);

  const handleStatusChange = async (goalId, newStatus) => {
    const statusToSet = statuses[goalId] === newStatus ? null : newStatus;
    const newStatuses = { ...statuses, [goalId]: statusToSet };
    setStatuses(newStatuses);
    
    await supabase.from('ict_plan').upsert({
      groep: selectedGroup,
      statuses: newStatuses,
      notes: notes
    }, { onConflict: 'groep' });
  };

  const handleNoteChange = (subthema, newNote) => setNotes(prev => ({ ...prev, [subthema]: newNote }));
  
  const handleNoteBlur = async () => {
    await supabase.from('ict_plan').upsert({
      groep: selectedGroup,
      statuses: statuses,
      notes: notes
    }, { onConflict: 'groep' });
  };

  const samenvattingRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPDF = async () => {
    if (isExporting) return;
    
    const element = samenvattingRef.current;
    if (!element) return;

    setIsExporting(true);

    try {
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `ICT_Actieplan_${GROUPS[selectedGroup].name}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // We use the worker pattern to ensure it completes or fails cleanly
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('PDF Generation Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const groupedGoals = useMemo(() => {
    if (!selectedGroup || activeTab === 'Samenvatting') return {};
    const goalsForTab = filteredData.filter(d => d.onderwerp === activeTab);
    const groups = {};
    goalsForTab.forEach(goal => {
      if (!groups[goal.subthema]) groups[goal.subthema] = [];
      groups[goal.subthema].push(goal);
    });
    return groups;
  }, [filteredData, activeTab, selectedGroup]);

  if (!selectedGroup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4">De Digitale Sprong</h1>
            <p className="text-xl text-slate-600">Selecteer jullie graad om te brainstormen rond het ICT-leerplan.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(GROUPS).map(([key, group]) => {
              const Icon = group.icon;
              return (
                <button key={key} onClick={() => { setSelectedGroup(key); setActiveTab(''); }} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-slate-200 group text-left flex items-center">
                  <div className={`${group.color} text-white p-5 rounded-2xl mr-6 group-hover:scale-110 transition-transform`}><Icon size={40} /></div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">{group.name}</h2>
                    <p className="text-slate-500 mt-1">Leeftijd: {group.ages.map(a => a.replace('Leeftijd ', '')).join(', ')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sticky Sidebar */}
      <div className="w-full md:w-72 bg-white shadow-md flex-shrink-0 flex flex-col z-10 md:sticky md:top-0 md:h-screen">
        <div className="p-6 border-b border-slate-100 bg-slate-800 text-white relative">
          <button onClick={() => setSelectedGroup(null)} className="flex items-center text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider mb-4 transition-colors">
            <ArrowLeft size={14} className="mr-1" /> Terug naar start
          </button>
          <h1 className="text-xl font-extrabold mb-1">{GROUPS[selectedGroup].name}</h1>
          <p className="text-slate-400 text-sm font-medium">ICT Leerplandoelen</p>
        </div>
        
        <div className="p-4 flex-grow overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Domeinen</h2>
          <nav className="space-y-2">
            {onderwerpen.map(onderwerp => {
              const theme = THEME_COLORS[onderwerp] || THEME_COLORS["Digitale informatievaardigheid"];
              return (
                <button key={onderwerp} onClick={() => { setActiveTab(onderwerp); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-full text-left px-3 py-3 rounded-lg text-sm font-bold transition-all border-l-4 ${ activeTab === onderwerp ? `${theme.bg} ${theme.text} ${theme.border} shadow-sm` : 'bg-white border-transparent text-slate-600 hover:bg-slate-50'}`}>
                  {onderwerp}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button onClick={() => { setActiveTab('Samenvatting'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center shadow-md ${ activeTab === 'Samenvatting' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-800 hover:bg-slate-50'}`}>
              <LayoutList size={18} className="mr-2" /> Bekijk Actieplan
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Natural Scroll */}
      <div className="flex-grow bg-slate-100 min-h-screen">
        {loadingDb ? (
          <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
        ) : (
          <div className="max-w-5xl mx-auto p-6 md:p-10 pb-20">
            {activeTab !== 'Samenvatting' ? (
              <div className="animate-in fade-in duration-300">
                <div className="mb-8">
                  <h2 className={`text-3xl font-extrabold mb-2 ${THEME_COLORS[activeTab]?.text || 'text-slate-800'}`}>{activeTab}</h2>
                </div>
                <div className="space-y-8">
                  {Object.entries(groupedGoals).map(([subthema, goals]) => (
                    <SubthemeGroup key={subthema} onderwerp={activeTab} subthema={subthema} goals={goals} statuses={statuses} note={notes[subthema]} onStatusChange={handleStatusChange} onNoteChange={handleNoteChange} onNoteBlur={handleNoteBlur} />
                  ))}
                </div>
              </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-8 flex justify-between items-center no-print">
                    <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Actieplan ({GROUPS[selectedGroup].name})</h2>
                    <button 
                      onClick={handleDownloadPDF} 
                      disabled={isExporting}
                      className={`${isExporting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center shadow-md transition-all disabled:cursor-not-allowed`}
                    >
                      {isExporting ? (
                        <><Loader2 size={18} className="mr-2 animate-spin" /> Bezig met PDF...</>
                      ) : (
                        <><Download size={18} className="mr-2" /> Opslaan als PDF</>
                      )}
                    </button>
                  </div>
                  <div ref={samenvattingRef} className="pdf-container">
                    <div className="hidden pdf-only mb-6">
                      <h1 className="text-2xl font-bold text-slate-800">ICT Actieplan - {GROUPS[selectedGroup].name}</h1>
                      <p className="text-slate-500">Gegenereerd op {new Date().toLocaleDateString('nl-BE')}</p>
                    </div>
                    {onderwerpen.map(onderwerp => {
                  const goalsInOnderwerp = filteredData.filter(d => d.onderwerp === onderwerp);
                  const subthemas = [...new Set(goalsInOnderwerp.map(d => d.subthema))];
                  const hasAction = subthemas.some(st => notes[st] || goalsInOnderwerp.some(g => g.subthema === st && statuses[g.id]));
                  if (!hasAction) return null;
                  
                  return (
                    <div key={onderwerp} className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
                      <div className={`${THEME_COLORS[onderwerp].header} px-6 py-4 text-white`}><h3 className="font-bold text-xl">{onderwerp}</h3></div>
                      <div className="p-6 space-y-6">
                        {subthemas.map(subthema => {
                          if (!notes[subthema] && !goalsInOnderwerp.some(g => g.subthema === subthema && statuses[g.id])) return null;
                          return (
                            <div key={subthema} className="p-5 bg-slate-50 border rounded-lg">
                              <h4 className="font-bold text-lg mb-3">{subthema}</h4>
                              <p className="text-sm whitespace-pre-line bg-white p-3 rounded shadow-sm border font-medium text-slate-700">{notes[subthema] || "Geen notities"}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
