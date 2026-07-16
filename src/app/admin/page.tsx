"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [assistidos, setAssistidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch("/api/assistidos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAssistidos(data.assistidos);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const exportToCSV = () => {
    if (assistidos.length === 0) return;
    
    const headers = Array.from(new Set(assistidos.flatMap(Object.keys)));
    
    const csvContent = [
      headers.join(","),
      ...assistidos.map((row) => 
        headers.map((fieldName) => {
          let field = row[fieldName] || "";
          if (typeof field === "string") {
            field = field.replace(/"/g, '""');
            if (field.includes(",") || field.includes("\\n") || field.includes('"')) {
              field = `"${field}"`;
            }
          }
          return field;
        }).join(",")
      )
    ].join("\\n");

    const blob = new Blob(["\\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `assistidos_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssistidos = assistidos.filter(a => 
    a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.numeroCpf?.includes(searchTerm) ||
    a.nucleoRegional?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-3 rounded-xl shadow-lg shadow-blue-500/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Painel de Administração</h1>
              <p className="text-sm font-medium text-slate-500">Defensoria Pública - Coleta de Dados</p>
            </div>
          </div>
          <button 
            onClick={exportToCSV}
            disabled={assistidos.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar CSV
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Stats & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="bg-white/80 backdrop-blur-xl px-8 py-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white flex items-center gap-5 w-full md:w-auto transform transition-all hover:scale-105">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total de Registros</p>
              <h2 className="text-4xl font-extrabold text-slate-800">{loading ? "..." : assistidos.length}</h2>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou núcleo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-2 border-transparent rounded-2xl leading-5 bg-white/80 backdrop-blur-xl placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-blue-500 focus:bg-white text-slate-700 sm:text-sm shadow-xl shadow-slate-200/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Data / Hora</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Assistido</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Núcleo</th>
                  <th scope="col" className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Demanda Principal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-500 font-medium">Carregando registros de forma segura...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAssistidos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-xl font-bold text-slate-800">Nenhum registro encontrado</p>
                        <p className="text-md text-slate-400 mt-2">Os assistidos cadastrados aparecerão magicamente aqui.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssistidos.map((a) => (
                    <tr key={a.id} className="hover:bg-blue-50/50 transition-colors duration-200 group">
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600">
                        <div className="font-semibold">{new Date(a.createdAt).toLocaleDateString('pt-BR')}</div>
                        <div className="text-xs text-slate-400 mt-1">{new Date(a.createdAt).toLocaleTimeString('pt-BR')}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-300">
                            {(a.nome || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-800">{a.nome}</div>
                            <div className="text-sm text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                              {a.numeroCpf ? (
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200">
                                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                  {a.numeroCpf}
                                </span>
                              ) : <span className="text-slate-300 text-xs uppercase tracking-wider">Sem CPF</span>}
                              
                              {a.telefone ? (
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium text-slate-600 border border-slate-200">
                                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                  {a.telefone}
                                </span>
                              ) : <span className="text-slate-300 text-xs uppercase tracking-wider">Sem telefone</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                          {a.nucleoRegional || "Não informado"}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 max-w-sm">
                        {a.demandaDefensora ? (
                          <div className="line-clamp-2 leading-relaxed">
                            {a.demandaDefensora}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Sem demanda registrada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="bg-slate-50/80 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Mostrando <span className="font-bold text-slate-700">{filteredAssistidos.length}</span> registros no total
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
