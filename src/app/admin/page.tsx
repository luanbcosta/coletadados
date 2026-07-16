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

  const handleDelete = async (assistido: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o registro de ${assistido.nome}? Essa ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/assistidos?id=${assistido.id}`, {
        method: "DELETE",
      });
      
      const data = await res.json();
      if (data.success) {
        setAssistidos(prev => prev.filter(a => a.id !== assistido.id));
        if (selectedAssistido?.id === assistido.id) {
          closeSidebar();
        }
        alert("Registro excluído com sucesso.");
      } else {
        alert("Erro ao excluir: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Erro de comunicação ao tentar excluir.");
    }
  };

  // Helper function to render a field in the sidebar
  const renderField = (label: string, value: any) => {
    if (value === undefined || value === null || value === "" || value === false) return null;
    let displayValue = value;
    if (value === true) displayValue = "Sim";
    return (
      <div className="py-3 border-b border-gray-100 last:border-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider sm:w-1/3 pt-1">{label}</dt>
        <dd className="text-sm font-medium text-gray-900 sm:w-2/3">{displayValue}</dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* OVERLAY & SIDEBAR */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 transition-opacity z-40 print:hidden" 
          onClick={closeSidebar}
        ></div>
      )}
      
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto print:static print:w-full print:max-w-none print:transform-none print:shadow-none print:z-auto border-l border-gray-200`}>
        {selectedAssistido && (
          <div className="flex flex-col h-full bg-white">
            
            {/* Sidebar Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10 print:hidden">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                Ficha Cadastral do Assistido
              </h2>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors border border-transparent hover:border-green-200" title="Imprimir ficha">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                </button>
                <button onClick={closeSidebar} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="p-6 flex-1 print:p-0">
              
              <div className="hidden print:block text-center mb-8">
                <div className="flex justify-center mb-4">
                  <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1lyw865kVhLBNUy0hif11BuVHHQP8chFhC_udwtfnibrGPzsd_ASSNMi_&s=10" alt="Logo" className="h-16" />
                </div>
                <h1 className="text-2xl font-bold uppercase">Defensoria Pública</h1>
                <h2 className="text-lg mt-1 font-semibold text-gray-700">Relatório de Atendimento - Ficha Completa</h2>
                <hr className="my-4 border-gray-800 border-t-2" />
              </div>

              <div className="mb-8 print:mb-6">
                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedAssistido.nome}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {selectedAssistido.nucleoRegional || "Núcleo não informado"}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Cadastrado em {new Date(selectedAssistido.createdAt).toLocaleDateString('pt-BR')} às {new Date(selectedAssistido.createdAt).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Identificação</h4>
                  <div className="bg-white">
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
                </section>

                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Documentação</h4>
                  <div className="bg-white">
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
                </section>

                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Situação Habitacional</h4>
                  <div className="bg-white">
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
                </section>

                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Trabalho, Renda e Benefícios</h4>
                  <div className="bg-white">
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
                </section>

                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Educação e Despesas</h4>
                  <div className="bg-white">
                    {renderField("Nível de Escolaridade", selectedAssistido.escolaridadePossui)}
                    {renderField("Status/Série Atual", selectedAssistido.escolaridade)}
                    {renderField("Escolas Locais", selectedAssistido.quaisEscolasServemIlhaPovoados)}
                    {renderField("Paga Conta de Energia?", selectedAssistido.despesasEnergiaEletrica)}
                    {renderField("Paga Conta de Água?", selectedAssistido.despesasAgua)}
                    {renderField("Gasto com Alimentação", selectedAssistido.despesasAlimentacao)}
                    {renderField("Outras Despesas", selectedAssistido.despesasOutros)}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-2">Composição Familiar e Saúde</h4>
                  <div className="bg-white">
                    {renderField("Possui Filhos?", selectedAssistido.possuiFilhos)}
                    {renderField("Quantos Filhos?", selectedAssistido.quantosFilhos)}
                    {renderField("Idade dos Filhos", selectedAssistido.idadeFilhos)}
                    {renderField("Problema de Saúde?", selectedAssistido.possuiProblemaSaude)}
                    {renderField("Qual Problema?", selectedAssistido.qualProblemaSaude)}
                    {renderField("Faz Tratamento Médico?", selectedAssistido.fazTratamento)}
                    {renderField("Usa Medicação?", selectedAssistido.fazUsoMedicacao)}
                    {renderField("Quais Medicações", selectedAssistido.quaisMedicacoes)}
                    {renderField("Medicação Uso Contínuo?", selectedAssistido.medicacaoUsoContinuo)}
                    {renderField("Quais Medicações Contínuas", selectedAssistido.quaisMedicacoesUsoContinuo)}
                    {renderField("Qual Posto de Saúde Frequenta?", selectedAssistido.qualPostoSaudeFrequenta)}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-green-800 uppercase tracking-widest border-b-2 border-green-600 pb-2 mb-4">Demanda para a Defensoria</h4>
                  <div className="bg-green-50/50 border border-green-200 p-5 rounded-md print:bg-transparent print:border-gray-800">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{selectedAssistido.demandaDefensora || "Nenhuma demanda registrada."}</p>
                  </div>
                </section>
              </div>

            </div>
          </div>
        )}
      </div>

      <div className="print:hidden">
        {/* Professional Header - Dark Green */}
        <header className="bg-[#0f7632] border-b border-[#0a5c25] sticky top-0 z-20 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center bg-white p-2 rounded-lg shadow-sm h-12 w-auto">
                <img 
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1lyw865kVhLBNUy0hif11BuVHHQP8chFhC_udwtfnibrGPzsd_ASSNMi_&s=10" 
                  alt="Logo Defensoria" 
                  className="h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Sistema de Gestão</h1>
                <p className="text-xs font-bold text-green-100 uppercase tracking-widest">Defensoria Pública</p>
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              disabled={assistidos.length === 0}
              className="flex items-center gap-2 bg-white text-[#0f7632] hover:bg-green-50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 px-5 py-2 rounded-md text-sm font-bold transition-all shadow-md border border-green-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exportar CSV
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Stats & Search Toolbar */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center mb-6 gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Atendimentos Registrados</h2>
              <p className="text-sm text-gray-500 mt-1">
                Mostrando <span className="font-semibold text-[#0f7632]">{filteredAssistidos.length}</span> registros no total.
              </p>
            </div>
            
            <div className="w-full sm:w-80 md:w-96 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, CPF ou núcleo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                className="block w-full pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0f7632] focus:border-[#0f7632] sm:text-sm transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Institutional Table */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#e8f5e9]">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0f7632] uppercase tracking-wider">Data do Registro</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0f7632] uppercase tracking-wider">Dados do Assistido</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0f7632] uppercase tracking-wider">Núcleo Regional</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-[#0f7632] uppercase tracking-wider">Demanda Principal</th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-[#0f7632] uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="animate-spin h-8 w-8 text-green-700 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-gray-500 font-medium">Buscando dados no sistema...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredAssistidos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-base font-semibold text-gray-900">Nenhum registro encontrado</p>
                          <p className="text-sm text-gray-500 mt-1">Tente ajustar os termos da busca.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAssistidos.map((a) => (
                      <tr 
                        key={a.id} 
                        onClick={() => handleRowClick(a)}
                        className="hover:bg-green-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                          <div className="text-xs text-gray-500 mt-0.5">{new Date(a.createdAt).toLocaleTimeString('pt-BR')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-600 font-bold text-sm border border-gray-200 group-hover:border-green-600 group-hover:text-green-700 transition-colors">
                              {(a.nome || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{a.nome}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                {a.numeroCpf ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                    {a.numeroCpf}
                                  </span>
                                ) : <span className="text-gray-400">Sem CPF</span>}
                                <span className="text-gray-300">&bull;</span>
                                {a.telefone ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    {a.telefone}
                                  </span>
                                ) : <span className="text-gray-400">Sem telefone</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 inline-flex text-xs leading-4 font-bold rounded-md bg-green-50 text-green-800 border border-green-200">
                            {a.nucleoRegional || "Não informado"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                          {a.demandaDefensora ? (
                            <div className="truncate pr-4" title={a.demandaDefensora}>
                              {a.demandaDefensora}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sem demanda registrada</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={(e) => handleDelete(a, e)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors border border-transparent hover:border-red-200 inline-flex items-center justify-center group/btn"
                            title="Excluir Registro"
                          >
                            <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Confidencial - Uso restrito</span>
              <span>Clique na linha para expandir a ficha cadastral</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
