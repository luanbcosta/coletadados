"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [certidoes, setCertidoes] = useState([
    { tipo: '', cartorio: '', matricula: '', dataEvento: '', dataRegistro: '', livro: '', folha: '', termo: '' }
  ]);

  // Initialize offline status, register SW, and check for pending syncs
  useEffect(() => {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
    }

    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync when connection is restored
      const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
      if (pending.length > 0) {
        syncData();
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOffline(!navigator.onLine);

    const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
    setPendingSyncCount(pending.length);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRadioChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCertidaoChange = (index: number, field: string, value: string) => {
    setCertidoes(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const addCertidao = () => {
    setCertidoes(prev => [...prev, { tipo: '', cartorio: '', matricula: '', dataEvento: '', dataRegistro: '', livro: '', folha: '', termo: '' }]);
  };

  const removeCertidao = (index: number) => {
    if (certidoes.length === 1) return; // manter ao menos uma
    setCertidoes(prev => prev.filter((_, i) => i !== index));
  };

  const syncData = async () => {
    const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
    if (pending.length === 0) return;

    let successCount = 0;
    for (const item of pending) {
      try {
        const res = await fetch("/api/assistidos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error("Sync error", err);
      }
    }

    if (successCount === pending.length) {
      localStorage.removeItem("assistidos_pendentes");
      setPendingSyncCount(0);
      alert("Todos os dados foram sincronizados com sucesso!");
    } else {
      const remaining = pending.slice(successCount);
      localStorage.setItem("assistidos_pendentes", JSON.stringify(remaining));
      setPendingSyncCount(remaining.length);
      alert(`Sincronizados ${successCount} de ${pending.length} cadastros.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { ...formData, certidoes };
    const resetCertidoes = () => setCertidoes([{ tipo: '', cartorio: '', matricula: '', dataEvento: '', dataRegistro: '', livro: '', folha: '', termo: '' }]);

    if (isOffline) {
      const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
      pending.push(payload);
      localStorage.setItem("assistidos_pendentes", JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      alert("Você está offline. Os dados foram salvos no tablet e serão enviados quando a internet voltar.");
      setFormData({});
      resetCertidoes();
      window.scrollTo(0, 0);
      return;
    }

    try {
      const res = await fetch("/api/assistidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Dados salvos com sucesso!");
        setFormData({});
        resetCertidoes();
        window.scrollTo(0, 0);
      } else {
        throw new Error("Erro ao salvar no servidor");
      }
    } catch (err) {
      // Se der erro mesmo online (queda de rede momentânea), salva local
      const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
      pending.push(payload);
      localStorage.setItem("assistidos_pendentes", JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      alert("Ocorreu um erro ao enviar. Os dados foram salvos no tablet por segurança.");
      setFormData({});
      resetCertidoes();
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      {isOffline && (
        <div className="offline-banner">
          Sem conexão de internet. Os formulários preenchidos serão salvos localmente.
        </div>
      )}
      {!isOffline && pendingSyncCount > 0 && (
        <div className="sync-banner">
          Você tem {pendingSyncCount} formulário(s) aguardando envio.
          <button onClick={syncData} className="sync-btn">Sincronizar Agora</button>
        </div>
      )}

      <div className="container" style={{ marginTop: (isOffline || pendingSyncCount > 0) ? "40px" : "0" }}>
        <form onSubmit={handleSubmit}>
          <div className="header">
            <div style={{marginBottom: '10px'}}>
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT1lyw865kVhLBNUy0hif11BuVHHQP8chFhC_udwtfnibrGPzsd_ASSNMi_&s=10" alt="Logo Defensoria Pública do Maranhão" />
            </div>
            <h1 style={{fontSize: '1.1rem', whiteSpace: 'nowrap'}}>DEFENSORIA PÚBLICA DO ESTADO DO MARANHÃO</h1>
            <h2 style={{fontSize: '0.95rem', fontWeight: 600, marginTop: '4px', color: '#555'}}>Ficha de Coleta de Dados - Atendimento ao Assistido</h2>

            {/* Núcleo Regional e Povoado/Comunidade - alinhados à esquerda */}
            <div style={{marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'flex-start', alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <h2 style={{fontSize: '0.95rem', whiteSpace: 'nowrap'}}>NÚCLEO REGIONAL:</h2>
                <input 
                  type="text" 
                  name="nucleoRegional" 
                  value={formData.nucleoRegional || ''} 
                  onChange={handleChange} 
                  required 
                  style={{
                    border: 'none', 
                    borderBottom: '2px solid var(--primary-color)', 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    outline: 'none', 
                    width: '200px', 
                    backgroundColor: 'transparent',
                    color: 'var(--text-color)'
                  }} 
                />
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <h2 style={{fontSize: '0.95rem', whiteSpace: 'nowrap'}}>POVOADO/COMUNIDADE:</h2>
                <input 
                  type="text" 
                  name="povoado" 
                  value={formData.povoado || ''} 
                  onChange={handleChange} 
                  style={{
                    border: 'none', 
                    borderBottom: '2px solid var(--primary-color)', 
                    fontSize: '1rem', 
                    fontWeight: 'bold', 
                    outline: 'none', 
                    width: '200px', 
                    backgroundColor: 'transparent',
                    color: 'var(--text-color)'
                  }} 
                />
              </div>
            </div>
          </div>
          
          <div className="section-title">1. IDENTIFICAÇÃO</div>
          
          <div className="form-group full-width">
            <label>NOME:</label>
            <input type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required />
          </div>
          
          <div className="form-group full-width">
            <label>NOME SOCIAL:</label>
            <input type="text" name="nomeSocial" value={formData.nomeSocial || ''} onChange={handleChange} />
          </div>
          
          <div className="form-group full-width">
            <label>FILIAÇÃO:</label>
            <input type="text" name="filiacao" value={formData.filiacao || ''} onChange={handleChange} />
          </div>
          
          <div className="form-group">
            <label>DATA NASC.:</label>
            <input type="date" name="dataNascimento" value={formData.dataNascimento || ''} onChange={handleChange} />
            
            <label style={{marginLeft: '15px'}}>NATURALIDADE:</label>
            <input type="text" name="naturalidade" value={formData.naturalidade || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>QUAL É A SUA FAIXA ETÁRIA?</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              {[
                'Até 17 anos',
                '18 a 24 anos',
                '25 a 34 anos',
                '35 a 44 anos',
                '45 a 54 anos',
                '55 a 64 anos',
                '65 anos ou mais'
              ].map((faixa) => (
                <label key={faixa} className="radio-label">
                  <input 
                    type="radio" 
                    name="idade" 
                    value={faixa} 
                    onChange={(e) => handleRadioChange("idade", e.target.value)} 
                    checked={formData.idade === faixa} 
                  /> {faixa}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>GÊNERO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="genero" value="Masc" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Masc"} /> Masc</label>
              <label className="radio-label"><input type="radio" name="genero" value="Fem" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Fem"} /> Fem</label>
              <label className="radio-label"><input type="radio" name="genero" value="Outros" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Outros"} /> Outros</label>
            </div>
            {formData.genero === "Outros" && (
              <input type="text" name="generoOutros" value={formData.generoOutros || ''} onChange={handleChange} style={{marginLeft: '15px', width: '150px'}} placeholder="Especifique" />
            )}
          </div>

          <div className="form-group">
            <label>RAÇA/ETNIA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="racaEtnia" value="Branca" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "Branca"} /> Branca</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="Preta" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "Preta"} /> Preta</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="Parda" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "Parda"} /> Parda</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="Amarela" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "Amarela"} /> Amarela</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="Indígena" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "Indígena"} /> Indígena</label>
            </div>
          </div>

          <div className="form-group">
            <label>ESTADO CIVIL:</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              <label className="radio-label"><input type="radio" name="estadoCivil" value="Solteiro" onChange={(e) => handleRadioChange("estadoCivil", e.target.value)} checked={formData.estadoCivil === "Solteiro"} /> Solteiro</label>
              <label className="radio-label"><input type="radio" name="estadoCivil" value="Casado" onChange={(e) => handleRadioChange("estadoCivil", e.target.value)} checked={formData.estadoCivil === "Casado"} /> Casado</label>
              <label className="radio-label"><input type="radio" name="estadoCivil" value="Divorciado" onChange={(e) => handleRadioChange("estadoCivil", e.target.value)} checked={formData.estadoCivil === "Divorciado"} /> Divorciado</label>
              <label className="radio-label"><input type="radio" name="estadoCivil" value="Viúvo" onChange={(e) => handleRadioChange("estadoCivil", e.target.value)} checked={formData.estadoCivil === "Viúvo"} /> Viúvo</label>
              <label className="radio-label"><input type="radio" name="estadoCivil" value="União Estável" onChange={(e) => handleRadioChange("estadoCivil", e.target.value)} checked={formData.estadoCivil === "União Estável"} /> União Estável</label>
            </div>
          </div>

          <div className="form-group">
            <label>POSSUI DEFICIÊNCIA?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiDeficiencia" value="true" onChange={() => handleRadioChange("possuiDeficiencia", true)} checked={formData.possuiDeficiencia === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiDeficiencia" value="false" onChange={() => handleRadioChange("possuiDeficiencia", false)} checked={formData.possuiDeficiencia === false} /> Não</label>
            </div>
          </div>

          {formData.possuiDeficiencia === true && (
            <div className="form-group full-width" style={{display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start'}}>
              <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px'}}>
                <label>TIPO DE DEFICIÊNCIA:</label>
                <div className="radio-group" style={{flexWrap: 'wrap', marginLeft: 0}}>
                  <label className="radio-label"><input type="checkbox" name="defMental" onChange={handleChange} checked={!!formData.defMental} /> Mental</label>
                  <label className="radio-label"><input type="checkbox" name="defIntelectual" onChange={handleChange} checked={!!formData.defIntelectual} /> Intelectual</label>
                  <label className="radio-label"><input type="checkbox" name="defMotora" onChange={handleChange} checked={!!formData.defMotora} /> Motora</label>
                  <label className="radio-label"><input type="checkbox" name="defFisica" onChange={handleChange} checked={!!formData.defFisica} /> Física</label>
                  <label className="radio-label"><input type="checkbox" name="defOutros" onChange={handleChange} checked={!!formData.defOutros} /> Outros</label>
                </div>
              </div>
              {formData.defOutros && (
                <div style={{display: 'flex', alignItems: 'center', width: '100%', gap: '10px'}}>
                  <label style={{whiteSpace: 'nowrap'}}>ESPECIFIQUE:</label>
                  <input type="text" name="qualDeficiencia" value={formData.qualDeficiencia || ''} onChange={handleChange} style={{flexGrow: 1}} placeholder="Qual deficiência?" />
                </div>
              )}
            </div>
          )}

          <div className="form-group full-width">
            <label>ENDEREÇO:</label>
            <input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>ILHA/POVOADO:</label>
            <input type="text" name="ilhaPovoado" value={formData.ilhaPovoado || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>TELEFONE:</label>
            <input type="text" name="telefone" value={formData.telefone || ''} onChange={handleChange} />
          </div>

          <div className="section-title">2. DOCUMENTAÇÃO</div>

          <div className="form-group">
            <label>POSSUI DOCUMENTAÇÃO BÁSICA?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiDocumentacao" value="true" onChange={() => handleRadioChange("possuiDocumentacao", true)} checked={formData.possuiDocumentacao === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiDocumentacao" value="false" onChange={() => handleRadioChange("possuiDocumentacao", false)} checked={formData.possuiDocumentacao === false} /> Não</label>
            </div>
          </div>

          {formData.possuiDocumentacao === true && (
            <div className="form-group full-width" style={{display: 'block'}}>
              <label style={{display: 'block', marginBottom: '10px'}}>SE SIM, ASSINALE:</label>
              <div className="radio-group" style={{flexWrap: 'wrap', marginBottom: '10px', marginLeft: 0}}>
                <label className="radio-label"><input type="checkbox" name="docRG" onChange={handleChange} checked={!!formData.docRG} /> RG</label>
                <label className="radio-label"><input type="checkbox" name="docCPF" onChange={handleChange} checked={!!formData.docCPF} /> CPF</label>
                <label className="radio-label"><input type="checkbox" name="docNIS" onChange={handleChange} checked={!!formData.docNIS} /> NIS</label>
                <label className="radio-label"><input type="checkbox" name="docTitulo" onChange={handleChange} checked={!!formData.docTitulo} /> Título de Eleitor</label>
                <label className="radio-label"><input type="checkbox" name="docCTPS" onChange={handleChange} checked={!!formData.docCTPS} /> CTPS</label>
                <label className="radio-label"><input type="checkbox" name="docSUS" onChange={handleChange} checked={!!formData.docSUS} /> SUS</label>
                <label className="radio-label"><input type="checkbox" name="docCartaoCidadao" onChange={handleChange} checked={!!formData.docCartaoCidadao} /> Cartão Cidadão</label>
                <label className="radio-label"><input type="checkbox" name="docCarteiraIdoso" onChange={handleChange} checked={!!formData.docCarteiraIdoso} /> Carteira do Idoso</label>
                <label className="radio-label"><input type="checkbox" name="docCertNasc" onChange={handleChange} checked={!!formData.docCertNasc} /> Certidão de Nascimento</label>
                <label className="radio-label"><input type="checkbox" name="docCertCasam" onChange={handleChange} checked={!!formData.docCertCasam} /> Certidão de Casamento</label>
                <label className="radio-label"><input type="checkbox" name="docCertObito" onChange={handleChange} checked={!!formData.docCertObito} /> Certidão de Óbito</label>
              </div>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <label>OUTROS:</label>
                <input type="text" name="outroDocumento" value={formData.outroDocumento || ''} onChange={handleChange} style={{flexGrow: 1, marginLeft: '10px'}} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Nº RG:</label>
            <input type="text" name="numeroRg" value={formData.numeroRg || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>Nº CPF:</label>
            <input type="text" name="numeroCpf" value={formData.numeroCpf || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>NIS:</label>
            <input type="text" name="nis" value={formData.nis || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>MATRÍCULA DA CERTIDÃO:</label>
            <input type="text" name="matriculaCertidao" value={formData.matriculaCertidao || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>LIVRO:</label>
            <input type="text" name="livroCertidao" value={formData.livroCertidao || ''} onChange={handleChange} style={{width: '70px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>FOLHA:</label>
            <input type="text" name="folhaCertidao" value={formData.folhaCertidao || ''} onChange={handleChange} style={{width: '70px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>TERMO:</label>
            <input type="text" name="termoCertidao" value={formData.termoCertidao || ''} onChange={handleChange} style={{width: '70px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>DATA REG.:</label>
            <input type="date" name="dataRegistroCertidao" value={formData.dataRegistroCertidao || ''} onChange={handleChange} />
          </div>


          <div className="section-title">3. SITUAÇÃO HABITACIONAL</div>

          <div className="form-group full-width">
            <label>HÁ QUANTO TEMPO RESIDE NO POVOADO?</label>
            <input type="text" name="tempoResidePovoado" value={formData.tempoResidePovoado || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>CASA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="casa" value="Própria" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Própria"} /> Própria</label>
              <label className="radio-label"><input type="radio" name="casa" value="Alugada" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Alugada"} /> Alugada</label>
              <label className="radio-label"><input type="radio" name="casa" value="Cedida" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Cedida"} /> Cedida</label>
            </div>
            {formData.casa === "Alugada" && (
              <>
                <label style={{marginLeft: '15px'}}>Valor R$:</label>
                <input type="text" name="valorAluguel" value={formData.valorAluguel || ''} onChange={handleChange} style={{width: '90px', flexGrow: 0}} />
              </>
            )}
            {formData.casa === "Cedida" && (
              <>
                <label style={{marginLeft: '15px'}}>Por quem?</label>
                <input type="text" name="casaCedidaPorQuem" value={formData.casaCedidaPorQuem || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>TIPO DE HABITAÇÃO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Alvenaria" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Alvenaria"} /> Alvenaria</label>
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Taipa" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Taipa"} /> Taipa</label>
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Misto" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Misto"} /> Misto</label>
            </div>
            {formData.tipoHabitacao === "Misto" && (
              <input type="text" name="tipoHabitacaoOutro" value={formData.tipoHabitacaoOutro || ''} onChange={handleChange} style={{marginLeft: '15px'}} placeholder="Outro (especifique)" />
            )}
          </div>

          <div className="form-group">
            <label>QUANTOS CÔMODOS?</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              {['1', '2', '3', '4', '5', 'Mais de 5'].map((qtd) => (
                <label key={qtd} className="radio-label">
                  <input 
                    type="radio" 
                    name="quantosComodosEDescricao" 
                    value={qtd} 
                    onChange={(e) => handleRadioChange("quantosComodosEDescricao", e.target.value)} 
                    checked={formData.quantosComodosEDescricao === qtd} 
                  /> {qtd}
                </label>
              ))}
            </div>
            {formData.quantosComodosEDescricao === 'Mais de 5' && (
              <input 
                type="number" 
                name="quantosComodosMais" 
                value={formData.quantosComodosMais || ''} 
                onChange={handleChange} 
                placeholder="Quantos?" 
                style={{width: '90px', marginLeft: '10px'}} 
              />
            )}
          </div>

          <div className="form-group">
            <label>ENERGIA ELÉTRICA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Regular" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Regular"} /> Regular</label>
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Irregular" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Irregular"} /> Irregular</label>
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Sem Energia" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Sem Energia"} /> Sem Energia</label>
            </div>
          </div>

          <div className="form-group">
            <label>ÁGUA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Encanada" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Encanada"} /> Encanada</label>
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Poço" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Poço"} /> Poço</label>
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Sem Água" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Sem Água"} /> Sem Água</label>
            </div>
          </div>

          <div className="form-group">
            <label>SANEAMENTO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Rede Pública" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Rede Pública"} /> Rede Pública</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Fossa" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Fossa"} /> Fossa</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Nenhum" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Nenhum"} /> Nenhum</label>
            </div>
          </div>

          <div className="form-group">
            <label>TRANSPORTE:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="transporte" value="Público" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Público"} /> Público</label>
              <label className="radio-label"><input type="radio" name="transporte" value="Particular" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Particular"} /> Particular</label>
              <label className="radio-label"><input type="radio" name="transporte" value="Nenhum" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Nenhum"} /> Nenhum</label>
            </div>
          </div>

          <div className="form-group">
            <label>POSSUI INTERNET?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiConexaoInternet" value="true" onChange={() => handleRadioChange("possuiConexaoInternet", true)} checked={formData.possuiConexaoInternet === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiConexaoInternet" value="false" onChange={() => handleRadioChange("possuiConexaoInternet", false)} checked={formData.possuiConexaoInternet === false} /> Não</label>
            </div>
          </div>
          
          {formData.possuiConexaoInternet === true && (
            <div className="form-group">
              <label>TIPO:</label>
              <div className="radio-group">
                <label className="radio-label"><input type="radio" name="tipoConexaoInternet" value="Dados" onChange={(e) => handleRadioChange("tipoConexaoInternet", e.target.value)} checked={formData.tipoConexaoInternet === "Dados"} /> Dados</label>
                <label className="radio-label"><input type="radio" name="tipoConexaoInternet" value="Fixa" onChange={(e) => handleRadioChange("tipoConexaoInternet", e.target.value)} checked={formData.tipoConexaoInternet === "Fixa"} /> Fixa</label>
              </div>
              <label style={{marginLeft: '15px'}}>É:</label>
              <div className="radio-group">
                <label className="radio-label"><input type="radio" name="propriedadeInternet" value="Própria" onChange={(e) => handleRadioChange("propriedadeInternet", e.target.value)} checked={formData.propriedadeInternet === "Própria"} /> Própria</label>
                <label className="radio-label"><input type="radio" name="propriedadeInternet" value="Cedida" onChange={(e) => handleRadioChange("propriedadeInternet", e.target.value)} checked={formData.propriedadeInternet === "Cedida"} /> Cedida</label>
              </div>
            </div>
          )}


          <div className="section-title">4. SITUAÇÃO DE TRABALHO E RENDA</div>

          <div className="form-group">
            <label>TRABALHA ATUALMENTE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="trabalhaAtualmente" value="true" onChange={() => handleRadioChange("trabalhaAtualmente", true)} checked={formData.trabalhaAtualmente === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="trabalhaAtualmente" value="false" onChange={() => handleRadioChange("trabalhaAtualmente", false)} checked={formData.trabalhaAtualmente === false} /> Não</label>
            </div>
          </div>

          {formData.trabalhaAtualmente === true && (
            <>
              <div className="form-group full-width">
                <label>FUNÇÃO:</label>
                <input type="text" name="funcao" value={formData.funcao || ''} onChange={handleChange} />
              </div>

              <div className="form-group full-width">
                <label>LOCAL DE TRABALHO:</label>
                <input type="text" name="localTrabalho" value={formData.localTrabalho || ''} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>MODALIDADE:</label>
                <div className="radio-group">
                  <label className="radio-label"><input type="radio" name="modalidadeTrabalho" value="Presencial" onChange={(e) => handleRadioChange("modalidadeTrabalho", e.target.value)} checked={formData.modalidadeTrabalho === "Presencial"} /> Presencial</label>
                  <label className="radio-label"><input type="radio" name="modalidadeTrabalho" value="Remoto" onChange={(e) => handleRadioChange("modalidadeTrabalho", e.target.value)} checked={formData.modalidadeTrabalho === "Remoto"} /> Remoto</label>
                  <label className="radio-label"><input type="radio" name="modalidadeTrabalho" value="Autônomo" onChange={(e) => handleRadioChange("modalidadeTrabalho", e.target.value)} checked={formData.modalidadeTrabalho === "Autônomo"} /> Autônomo</label>
                </div>
              </div>

              {formData.modalidadeTrabalho === "Autônomo" && (
                <div className="form-group">
                  <label>Se Autônomo:</label>
                  <div className="radio-group">
                    <label className="radio-label"><input type="radio" name="seAutonomoFormalInformal" value="Formal" onChange={(e) => handleRadioChange("seAutonomoFormalInformal", e.target.value)} checked={formData.seAutonomoFormalInformal === "Formal"} /> Formal</label>
                    <label className="radio-label"><input type="radio" name="seAutonomoFormalInformal" value="Informal" onChange={(e) => handleRadioChange("seAutonomoFormalInformal", e.target.value)} checked={formData.seAutonomoFormalInformal === "Informal"} /> Informal</label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>REMUNERAÇÃO MENSAL (R$):</label>
                <input type="text" name="remuneracao" value={formData.remuneracao || ''} onChange={handleChange} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>RECEBE BENEFÍCIO DO GOVERNO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="recebeBeneficio" value="true" onChange={() => handleRadioChange("recebeBeneficio", true)} checked={formData.recebeBeneficio === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="recebeBeneficio" value="false" onChange={() => handleRadioChange("recebeBeneficio", false)} checked={formData.recebeBeneficio === false} /> Não</label>
            </div>
          </div>

          {formData.recebeBeneficio === true && (
            <div className="form-group full-width">
              <label>QUAIS?</label>
              <div className="radio-group" style={{flexWrap: 'wrap'}}>
                <label className="radio-label"><input type="checkbox" name="benBPC" onChange={handleChange} checked={!!formData.benBPC} /> BPC</label>
                <label className="radio-label"><input type="checkbox" name="benTarifaZero" onChange={handleChange} checked={!!formData.benTarifaZero} /> Tarifa Zero</label>
                <label className="radio-label"><input type="checkbox" name="benBolsaFamilia" onChange={handleChange} checked={!!formData.benBolsaFamilia} /> Bolsa Família</label>
                <label className="radio-label"><input type="checkbox" name="benPeDeMeia" onChange={handleChange} checked={!!formData.benPeDeMeia} /> Pé de Meia</label>
                <label className="radio-label"><input type="checkbox" name="benOutros" onChange={handleChange} checked={!!formData.benOutros} /> Outros</label>
                {formData.benOutros && (
                  <input type="text" name="quaisBeneficios" value={formData.quaisBeneficios || ''} onChange={handleChange} style={{marginLeft: '15px'}} placeholder="Especifique" />
                )}
              </div>
            </div>
          )}


          <div className="section-title">5. EDUCAÇÃO & COMPOSIÇÃO FAMILIAR</div>

          <div className="form-group">
            <label>ESCOLARIDADE:</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Completo" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Completo"} /> Completo</label>
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Incompleto" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Incompleto"} /> Incompleto</label>
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Cursando" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Cursando"} /> Cursando</label>
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Nunca Estudou" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Nunca Estudou"} /> Nunca Estudou</label>
            </div>
          </div>

          <div className="form-group">
            <label>POSSUI FILHOS?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiFilhos" value="true" onChange={() => handleRadioChange("possuiFilhos", true)} checked={formData.possuiFilhos === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiFilhos" value="false" onChange={() => handleRadioChange("possuiFilhos", false)} checked={formData.possuiFilhos === false} /> Não</label>
            </div>
          </div>

          {formData.possuiFilhos === true && (
            <div className="form-group full-width" style={{display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start'}}>
              <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px'}}>
                <label>QUANTIDADE DE FILHOS:</label>
                <div className="radio-group" style={{flexWrap: 'wrap', marginLeft: 0}}>
                  {['1', '2', '3', '4', '5', 'Mais de 5'].map((qtd) => (
                    <label key={qtd} className="radio-label">
                      <input 
                        type="radio" 
                        name="quantosFilhos" 
                        value={qtd} 
                        onChange={(e) => handleRadioChange("quantosFilhos", e.target.value)} 
                        checked={formData.quantosFilhos === qtd} 
                      /> {qtd}
                    </label>
                  ))}
                </div>
                {formData.quantosFilhos === 'Mais de 5' && (
                  <input 
                    type="number" 
                    name="quantosFilhosMais" 
                    value={formData.quantosFilhosMais || ''} 
                    onChange={handleChange} 
                    placeholder="Quantos?" 
                    style={{width: '90px', marginLeft: '5px'}} 
                  />
                )}
              </div>

              <div style={{display: 'flex', alignItems: 'center', width: '100%', gap: '10px'}}>
                <label style={{whiteSpace: 'nowrap'}}>IDADE(S):</label>
                <input 
                  type="text" 
                  name="idadeFilhos" 
                  value={formData.idadeFilhos || ''} 
                  onChange={handleChange} 
                  placeholder="Ex: 10, 13 e 25 anos" 
                  style={{flexGrow: 1}}
                />
              </div>
            </div>
          )}


          <div className="section-title">6. DESPESAS MENSAIS (ASSINALE SE HOUVER E INFORME O VALOR APROXIMADO)</div>

          <div className="form-group" style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label className="radio-label"><input type="checkbox" name="despEnergia" onChange={handleChange} checked={!!formData.despEnergia} /> Energia R$</label>
              <input type="text" name="despesasEnergiaEletrica" value={formData.despesasEnergiaEletrica || ''} onChange={handleChange} style={{width: '90px'}} placeholder="0,00" />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label className="radio-label"><input type="checkbox" name="despAgua" onChange={handleChange} checked={!!formData.despAgua} /> Água R$</label>
              <input type="text" name="despesasAgua" value={formData.despesasAgua || ''} onChange={handleChange} style={{width: '90px'}} placeholder="0,00" />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label className="radio-label"><input type="checkbox" name="despAlim" onChange={handleChange} checked={!!formData.despAlim} /> Alim. R$</label>
              <input type="text" name="despesasAlimentacao" value={formData.despesasAlimentacao || ''} onChange={handleChange} style={{width: '90px'}} placeholder="0,00" />
            </div>

            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <label className="radio-label"><input type="checkbox" name="despOutros" onChange={handleChange} checked={!!formData.despOutros} /> Outros R$</label>
              <input type="text" name="despesasOutros" value={formData.despesasOutros || ''} onChange={handleChange} style={{width: '90px'}} placeholder="0,00" />
            </div>
          </div>


          <div className="section-title">7. SAÚDE</div>

          <div className="form-group">
            <label>POSSUI ALGUM PROBLEMA DE SAÚDE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiProblemaSaude" value="true" onChange={() => handleRadioChange("possuiProblemaSaude", true)} checked={formData.possuiProblemaSaude === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiProblemaSaude" value="false" onChange={() => handleRadioChange("possuiProblemaSaude", false)} checked={formData.possuiProblemaSaude === false} /> Não</label>
            </div>
            {formData.possuiProblemaSaude === true && (
              <>
                <label style={{marginLeft: '15px'}}>QUAL?</label>
                <input type="text" name="qualProblemaSaude" value={formData.qualProblemaSaude || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>FAZ TRATAMENTO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="fazTratamento" value="true" onChange={() => handleRadioChange("fazTratamento", true)} checked={formData.fazTratamento === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="fazTratamento" value="false" onChange={() => handleRadioChange("fazTratamento", false)} checked={formData.fazTratamento === false} /> Não</label>
            </div>

            <label style={{marginLeft: '20px'}}>USO DE MEDICAÇÃO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="fazUsoMedicacao" value="true" onChange={() => handleRadioChange("fazUsoMedicacao", true)} checked={formData.fazUsoMedicacao === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="fazUsoMedicacao" value="false" onChange={() => handleRadioChange("fazUsoMedicacao", false)} checked={formData.fazUsoMedicacao === false} /> Não</label>
            </div>
            {formData.fazUsoMedicacao === true && (
              <>
                <label style={{marginLeft: '15px'}}>QUAIS?</label>
                <input type="text" name="quaisMedicacoes" value={formData.quaisMedicacoes || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>MEDICAÇÃO DE USO CONTÍNUO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="medicacaoUsoContinuo" value="true" onChange={() => handleRadioChange("medicacaoUsoContinuo", true)} checked={formData.medicacaoUsoContinuo === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="medicacaoUsoContinuo" value="false" onChange={() => handleRadioChange("medicacaoUsoContinuo", false)} checked={formData.medicacaoUsoContinuo === false} /> Não</label>
            </div>
            {formData.medicacaoUsoContinuo === true && (
              <>
                <label style={{marginLeft: '15px'}}>QUAIS?</label>
                <input type="text" name="quaisMedicacoesUsoContinuo" value={formData.quaisMedicacoesUsoContinuo || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>POSSUI POSTO DE SAÚDE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiPostoSaude" value="true" onChange={() => handleRadioChange("possuiPostoSaude", true)} checked={formData.possuiPostoSaude === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiPostoSaude" value="false" onChange={() => handleRadioChange("possuiPostoSaude", false)} checked={formData.possuiPostoSaude === false} /> Não</label>
            </div>
            {formData.possuiPostoSaude === true && (
              <>
                <label style={{marginLeft: '15px'}}>QUAL POSTO FREQUENTA?</label>
                <input type="text" name="qualPostoSaudeFrequenta" value={formData.qualPostoSaudeFrequenta || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>POSSUI AGENTE DE SAÚDE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiAgenteSaude" value="true" onChange={() => handleRadioChange("possuiAgenteSaude", true)} checked={formData.possuiAgenteSaude === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiAgenteSaude" value="false" onChange={() => handleRadioChange("possuiAgenteSaude", false)} checked={formData.possuiAgenteSaude === false} /> Não</label>
            </div>
            {formData.possuiAgenteSaude === true && (
              <>
                <label style={{marginLeft: '15px'}}>NOME DO AGENTE:</label>
                <input type="text" name="nomeAgenteSaude" value={formData.nomeAgenteSaude || ''} onChange={handleChange} />
              </>
            )}
          </div>

          <div className="form-group">
            <label>TEM CARTÃO SUS?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="temCartaoSus" value="true" onChange={() => handleRadioChange("temCartaoSus", true)} checked={formData.temCartaoSus === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="temCartaoSus" value="false" onChange={() => handleRadioChange("temCartaoSus", false)} checked={formData.temCartaoSus === false} /> Não</label>
            </div>

            <label style={{marginLeft: '20px'}}>TEM LAUDO MÉDICO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="temLaudoMedico" value="true" onChange={() => handleRadioChange("temLaudoMedico", true)} checked={formData.temLaudoMedico === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="temLaudoMedico" value="false" onChange={() => handleRadioChange("temLaudoMedico", false)} checked={formData.temLaudoMedico === false} /> Não</label>
            </div>

            <label style={{marginLeft: '20px'}}>PRECISA DE TRANSPORTE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="precisaDeTransporte" value="true" onChange={() => handleRadioChange("precisaDeTransporte", true)} checked={formData.precisaDeTransporte === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="precisaDeTransporte" value="false" onChange={() => handleRadioChange("precisaDeTransporte", false)} checked={formData.precisaDeTransporte === false} /> Não</label>
            </div>
          </div>


          <button type="submit" className="submit-btn">Finalizar e Salvar Dados</button>

        </form>
        

      </div>
    </>
  );
}
