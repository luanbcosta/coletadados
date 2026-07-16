"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [assistidos, setAssistidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAssistido, setSelectedAssistido] = useState<any | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleRowClick = (assistido: any) => {
    setSelectedAssistido(assistido);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setTimeout(() => setSelectedAssistido(null), 300);
  };

  // Helper function to render a field in the sidebar
  const renderField = (label: string, value: any) => {
    if (value === undefined || value === null || value === "" || value === false) return null;
    let displayValue = value;
    if (value === true) displayValue = "Sim";
    return (
      <div className="mb-4">
        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-slate-900">{displayValue}</dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* OVERLAY & SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity print:hidden" 
          onClick={closeSidebar}
        ></div>
      )}
      
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto print:static print:w-full print:max-w-none print:transform-none print:shadow-none print:z-auto`}>
        {selectedAssistido && (
          <div className="flex flex-col h-full bg-slate-50 print:bg-white">
            
            {/* Sidebar Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Ficha do Assistido
              </h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Imprimir ficha">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                </button>
                <button onClick={closeSidebar} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="p-6 flex-1 print:p-0">
              
              <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-bold uppercase">Defensoria Pública - Coleta de Dados</h1>
                <h2 className="text-xl mt-2">Ficha de Atendimento - {selectedAssistido.nome}</h2>
                <hr className="my-4 border-slate-400" />
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 print:shadow-none print:border-none print:p-0 print:mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg print:hidden">
                    {(selectedAssistido.nome || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedAssistido.nome}</h3>
                    <p className="text-slate-500 font-medium">{selectedAssistido.nucleoRegional}</p>
                    <p className="text-xs text-slate-400 mt-1">Registrado em {new Date(selectedAssistido.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8 print:mt-4">1. Identificação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Nome Social", selectedAssistido.nomeSocial)}
                  {renderField("Filiação", selectedAssistido.filiacao)}
                  {renderField("Data de Nascimento", selectedAssistido.dataNascimento)}
                  {renderField("Idade", selectedAssistido.idade)}
                  {renderField("Naturalidade", selectedAssistido.naturalidade)}
                  {renderField("Gênero", selectedAssistido.genero)}
                  {renderField("Raça/Etnia", selectedAssistido.racaEtnia)}
                  {renderField("Estado Civil", selectedAssistido.estadoCivil)}
                  {renderField("Possui Deficiência?", selectedAssistido.possuiDeficiencia)}
                  {renderField("Qual Deficiência?", selectedAssistido.qualDeficiencia)}
                  {renderField("Ilha/Povoado", selectedAssistido.ilhaPovoado)}
                  {renderField("Endereço Completo", selectedAssistido.endereco)}
                  {renderField("Telefone", selectedAssistido.telefone)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">Documentação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Documentos que Possui", selectedAssistido.documentosQuePossui)}
                  {renderField("Outros Documentos", selectedAssistido.outroDocumento)}
                  {renderField("Número do RG", selectedAssistido.numeroRg)}
                  {renderField("Número do CPF", selectedAssistido.numeroCpf)}
                  {renderField("NIS", selectedAssistido.nis)}
                  {renderField("Matrícula Certidão", selectedAssistido.matriculaCertidao)}
                  {renderField("Data Registro Certidão", selectedAssistido.dataRegistroCertidao)}
                  {renderField("Livro Certidão", selectedAssistido.livroCertidao)}
                  {renderField("Folha Certidão", selectedAssistido.folhaCertidao)}
                  {renderField("Termo Certidão", selectedAssistido.termoCertidao)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">2. Situação Habitacional</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Tempo Residência (Povoado)", selectedAssistido.tempoResidePovoado)}
                  {renderField("Casa", selectedAssistido.casa)}
                  {renderField("Cedida por Quem?", selectedAssistido.casaCedidaPorQuem)}
                  {renderField("Tipo Habitação", selectedAssistido.tipoHabitacao)}
                  {renderField("Cômodos / Descrição", selectedAssistido.quantosComodosEDescricao)}
                  {renderField("Energia Elétrica", selectedAssistido.energiaEletrica)}
                  {renderField("Abastecimento Água", selectedAssistido.abastecimentoAgua)}
                  {renderField("Saneamento Básico", selectedAssistido.saneamentoBasico)}
                  {renderField("Possui Conexão Internet?", selectedAssistido.possuiConexaoInternet)}
                  {renderField("Tipo de Conexão", selectedAssistido.tipoConexaoInternet)}
                  {renderField("Transporte Principal", selectedAssistido.transporte)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">3. Trabalho, Renda e Benefícios</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Trabalha Atualmente?", selectedAssistido.trabalhaAtualmente)}
                  {renderField("Função", selectedAssistido.funcao)}
                  {renderField("Local de Trabalho", selectedAssistido.localTrabalho)}
                  {renderField("Modalidade", selectedAssistido.modalidadeTrabalho)}
                  {renderField("Se Autônomo", selectedAssistido.seAutonomoFormalInformal)}
                  {renderField("Remuneração Média", selectedAssistido.remuneracao ? `R$ ${selectedAssistido.remuneracao}` : null)}
                  {renderField("Trabalho Doméstico no próprio domicílio?", selectedAssistido.exerceTrabalhoDomesticoDomicilio)}
                  {renderField("Recebe Benefício?", selectedAssistido.recebeBeneficio)}
                  {renderField("Quais Benefícios", selectedAssistido.quaisBeneficios)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">4. Educação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Nível de Escolaridade", selectedAssistido.escolaridadePossui)}
                  {renderField("Status/Série Atual", selectedAssistido.escolaridade)}
                  {renderField("Escolas Locais (Ilha/Povoado)", selectedAssistido.quaisEscolasServemIlhaPovoados)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">5. Despesas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Paga Conta de Energia?", selectedAssistido.despesasEnergiaEletrica)}
                  {renderField("Paga Conta de Água?", selectedAssistido.despesasAgua)}
                  {renderField("Gasto com Alimentação", selectedAssistido.despesasAlimentacao)}
                  {renderField("Outras Despesas", selectedAssistido.despesasOutros)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">6. Composição Familiar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Possui Filhos?", selectedAssistido.possuiFilhos)}
                  {renderField("Quantos Filhos?", selectedAssistido.quantosFilhos)}
                  {renderField("Idade dos Filhos", selectedAssistido.idadeFilhos)}
                </div>

                <h4 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4 mt-8">7. Saúde</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                  {renderField("Problema de Saúde?", selectedAssistido.possuiProblemaSaude)}
                  {renderField("Qual Problema?", selectedAssistido.qualProblemaSaude)}
                  {renderField("Faz Tratamento Médico?", selectedAssistido.fazTratamento)}
                  {renderField("Usa Medicação?", selectedAssistido.fazUsoMedicacao)}
                  {renderField("Quais Medicações", selectedAssistido.quaisMedicacoes)}
                  {renderField("Medicação Uso Contínuo?", selectedAssistido.medicacaoUsoContinuo)}
                  {renderField("Quais Medicações Contínuas", selectedAssistido.quaisMedicacoesUsoContinuo)}
                  {renderField("Qual Posto de Saúde Frequenta?", selectedAssistido.qualPostoSaudeFrequenta)}
                </div>

                <h4 className="text-lg font-bold text-blue-600 border-b border-blue-200 pb-2 mb-4 mt-8">8. Demanda para a Defensoria</h4>
                <div className="bg-blue-50 p-4 rounded-xl print:bg-transparent print:border print:border-slate-300">
                  <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap">{selectedAssistido.demandaDefensora || "Nenhuma demanda registrada."}</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
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
                      <tr 
                        key={a.id} 
                        onClick={() => handleRowClick(a)}
                        className="hover:bg-blue-50/50 transition-colors duration-200 group cursor-pointer"
                        title="Clique para ver os detalhes da ficha"
                      >
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
                              <div className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{a.nome}</div>
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
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Clique em uma linha para ver a ficha completa
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
