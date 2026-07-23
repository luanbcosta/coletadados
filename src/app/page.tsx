"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

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
    
    if (isOffline) {
      const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
      pending.push(formData);
      localStorage.setItem("assistidos_pendentes", JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      alert("Você está offline. Os dados foram salvos no tablet e serão enviados quando a internet voltar.");
      setFormData({});
      window.scrollTo(0, 0);
      return;
    }

    try {
      const res = await fetch("/api/assistidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Dados salvos com sucesso!");
        setFormData({});
        window.scrollTo(0, 0);
      } else {
        throw new Error("Erro ao salvar no servidor");
      }
    } catch (err) {
      // Se der erro mesmo online (queda de rede momentânea), salva local
      const pending = JSON.parse(localStorage.getItem("assistidos_pendentes") || "[]");
      pending.push(formData);
      localStorage.setItem("assistidos_pendentes", JSON.stringify(pending));
      setPendingSyncCount(pending.length);
      alert("Ocorreu um erro ao enviar. Os dados foram salvos no tablet por segurança.");
      setFormData({});
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
            <h1>DEFENSORIA PÚBLICA</h1>
            <p style={{fontSize: '0.9rem', marginBottom: '10px'}}>do Estado do Maranhão</p>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
              <h2>NÚCLEO REGIONAL:</h2>
              <input 
                type="text" 
                name="nucleoRegional" 
                value={formData.nucleoRegional || ''} 
                onChange={handleChange} 
                required 
                style={{
                  border: 'none', 
                  borderBottom: '2px solid var(--primary-color)', 
                  fontSize: '1.2rem', 
                  fontWeight: 'bold', 
                  outline: 'none', 
                  textAlign: 'center', 
                  width: '200px', 
                  backgroundColor: 'transparent',
                  color: 'var(--text-color)'
                }} 
              />
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
            <label>DATA DE NASCIMENTO:</label>
            <input type="date" name="dataNascimento" value={formData.dataNascimento || ''} onChange={handleChange} />
            
            <label style={{marginLeft: '15px'}}>IDADE:</label>
            <input type="number" name="idade" value={formData.idade || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
            
            <label style={{marginLeft: '15px'}}>NATURALIDADE:</label>
            <input type="text" name="naturalidade" value={formData.naturalidade || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>GÊNERO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="genero" value="Feminino" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Feminino"} /> Feminino</label>
              <label className="radio-label"><input type="radio" name="genero" value="Masculino" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Masculino"} /> Masculino</label>
              <label className="radio-label"><input type="radio" name="genero" value="Outros" onChange={(e) => handleRadioChange("genero", e.target.value)} checked={formData.genero === "Outros"} /> Outros</label>
              <input type="text" name="generoOutros" value={formData.generoOutros || ''} onChange={handleChange} style={{width: '100px'}} />
            </div>
          </div>

          <div className="form-group">
            <label>RAÇA/ETNIA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="racaEtnia" value="BRANCO(A)" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "BRANCO(A)"} /> BRANCO(A)</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="NEGRO(A)" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "NEGRO(A)"} /> NEGRO(A)</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="INDÍGENA" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "INDÍGENA"} /> INDÍGENA</label>
              <label className="radio-label"><input type="radio" name="racaEtnia" value="OUTROS" onChange={(e) => handleRadioChange("racaEtnia", e.target.value)} checked={formData.racaEtnia === "OUTROS"} /> OUTROS</label>
            </div>
          </div>

          <div className="form-group">
            <label>ESTADO CIVIL:</label>
            <input type="text" name="estadoCivil" value={formData.estadoCivil || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>POSSUI ALGUMA DEFICIÊNCIA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiDeficiencia" value="false" onChange={() => handleRadioChange("possuiDeficiencia", false)} checked={formData.possuiDeficiencia === false} /> Não</label>
              <label className="radio-label"><input type="radio" name="possuiDeficiencia" value="true" onChange={() => handleRadioChange("possuiDeficiencia", true)} checked={formData.possuiDeficiencia === true} /> Sim</label>
            </div>
            <label style={{marginLeft: '15px'}}>QUAL:</label>
            <input type="text" name="qualDeficiencia" value={formData.qualDeficiencia || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>ILHA/POVOADO:</label>
            <input type="text" name="ilhaPovoado" value={formData.ilhaPovoado || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>ENDEREÇO:</label>
            <input type="text" name="endereco" value={formData.endereco || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>TELEFONE:</label>
            <input type="text" name="telefone" value={formData.telefone || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>POSSUI DOCUMENTAÇÃO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiDocumentacao" value="true" onChange={() => handleRadioChange("possuiDocumentacao", true)} checked={formData.possuiDocumentacao === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiDocumentacao" value="false" onChange={() => handleRadioChange("possuiDocumentacao", false)} checked={formData.possuiDocumentacao === false} /> Não</label>
            </div>
          </div>

          <div className="form-group full-width" style={{display: 'block'}}>
            <label style={{display: 'block', marginBottom: '10px'}}>DOCUMENTOS QUE POSSUI:</label>
            <div className="radio-group" style={{flexWrap: 'wrap', marginBottom: '10px', marginLeft: 0}}>
              <label className="radio-label"><input type="checkbox" name="docRG" onChange={handleChange} checked={!!formData.docRG} /> RG</label>
              <label className="radio-label"><input type="checkbox" name="docCPF" onChange={handleChange} checked={!!formData.docCPF} /> CPF</label>
              <label className="radio-label"><input type="checkbox" name="docCNH" onChange={handleChange} checked={!!formData.docCNH} /> CNH</label>
              <label className="radio-label"><input type="checkbox" name="docCartaoCidadao" onChange={handleChange} checked={!!formData.docCartaoCidadao} /> CartãoCidadão</label>
              <label className="radio-label"><input type="checkbox" name="docCTPS" onChange={handleChange} checked={!!formData.docCTPS} /> CTPS</label>
              <label className="radio-label"><input type="checkbox" name="docSUS" onChange={handleChange} checked={!!formData.docSUS} /> Cartão do SUS</label>
              <label className="radio-label"><input type="checkbox" name="docTitulo" onChange={handleChange} checked={!!formData.docTitulo} /> TITULO DE ELEITOR</label>
              <label className="radio-label"><input type="checkbox" name="docCertNasc" onChange={handleChange} checked={!!formData.docCertNasc} /> CERTIDÃO DE NASCIMENTO</label>
              <label className="radio-label"><input type="checkbox" name="docCertCasam" onChange={handleChange} checked={!!formData.docCertCasam} /> CERTIDÃO DE CASAMENTO</label>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <label>OUTROS:</label>
              <input type="text" name="outroDocumento" value={formData.outroDocumento || ''} onChange={handleChange} style={{flexGrow: 1, marginLeft: '10px'}} />
            </div>
          </div>

          <div className="form-group">
            <label>Nº RG:</label>
            <input type="text" name="numeroRg" value={formData.numeroRg || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>Nº CPF:</label>
            <input type="text" name="numeroCpf" value={formData.numeroCpf || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>NIS:</label>
            <input type="text" name="nis" value={formData.nis || ''} onChange={handleChange} />
          </div>

          <div style={{marginTop: '20px', fontWeight: 'bold'}}>INFORMAÇÕES DA CERTIDÃO:</div>
          <div className="form-group">
            <label>Matrícula</label>
            <input type="text" name="matriculaCertidao" value={formData.matriculaCertidao || ''} onChange={handleChange} />
            <label style={{marginLeft: '15px'}}>Data do Registro</label>
            <input type="date" name="dataRegistroCertidao" value={formData.dataRegistroCertidao || ''} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Livro</label>
            <input type="text" name="livroCertidao" value={formData.livroCertidao || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>Folha</label>
            <input type="text" name="folhaCertidao" value={formData.folhaCertidao || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>Termo</label>
            <input type="text" name="termoCertidao" value={formData.termoCertidao || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
          </div>


          <div className="section-title">2. SITUAÇÃO HABITACIONAL</div>

          <div className="form-group full-width">
            <label>QUANTO TEMPO RESIDE NO POVOADO:</label>
            <input type="text" name="tempoResidePovoado" value={formData.tempoResidePovoado || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>CASA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="casa" value="Própria" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Própria"} /> Própria</label>
              <label className="radio-label"><input type="radio" name="casa" value="Ocupação/Invasão" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Ocupação/Invasão"} /> Ocupação/Invasão</label>
              <label className="radio-label"><input type="radio" name="casa" value="Alugada" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Alugada"} /> Alugada, R$</label>
              <input type="number" name="valorAluguel" value={formData.valorAluguel || ''} onChange={handleChange} style={{width: '80px', flexGrow: 0}} />
              <label className="radio-label"><input type="radio" name="casa" value="Cedida" onChange={(e) => handleRadioChange("casa", e.target.value)} checked={formData.casa === "Cedida"} /> Cedida</label>
            </div>
            <label style={{marginLeft: '15px'}}>Por quem?</label>
            <input type="text" name="casaCedidaPorQuem" value={formData.casaCedidaPorQuem || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>TIPO DE HABITAÇÃO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Madeira" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Madeira"} /> Madeira</label>
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Alvenaria" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Alvenaria"} /> Alvenaria</label>
              <label className="radio-label"><input type="radio" name="tipoHabitacao" value="Misto" onChange={(e) => handleRadioChange("tipoHabitacao", e.target.value)} checked={formData.tipoHabitacao === "Misto"} /> Misto</label>
              <input type="text" name="tipoHabitacaoOutro" value={formData.tipoHabitacaoOutro || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group full-width">
            <label>Quantos cômodos e descrição?</label>
            <input type="text" name="quantosComodosEDescricao" value={formData.quantosComodosEDescricao || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>ENERGIA ELÉTRICA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Própria" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Própria"} /> Própria</label>
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Sem Energia" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Sem Energia"} /> Sem Energia</label>
              <label className="radio-label"><input type="radio" name="energiaEletrica" value="Outros" onChange={(e) => handleRadioChange("energiaEletrica", e.target.value)} checked={formData.energiaEletrica === "Outros"} /> Outros:</label>
              <input type="text" name="energiaEletricaOutro" value={formData.energiaEletricaOutro || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>ABASTECIMENTO DE ÁGUA:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Rede de distribuição" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Rede de distribuição"} /> Rede de distribuição</label>
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Poço ou Nascente" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Poço ou Nascente"} /> Poço ou Nascente</label>
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Cisterna" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Cisterna"} /> Cisterna</label>
              <label className="radio-label"><input type="radio" name="abastecimentoAgua" value="Outros" onChange={(e) => handleRadioChange("abastecimentoAgua", e.target.value)} checked={formData.abastecimentoAgua === "Outros"} /> Outros:</label>
              <input type="text" name="abastecimentoAguaOutro" value={formData.abastecimentoAguaOutro || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>SANEAMENTO BÁSICO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Rede coletora" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Rede coletora"} /> Rede coletora</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Fossa séptica" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Fossa séptica"} /> Fossa séptica</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Fossa rudimentar" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Fossa rudimentar"} /> Fossa rudimentar</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Direto para rio/mar ou rua" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Direto para rio/mar ou rua"} /> Direto para rio/mar ou rua</label>
              <label className="radio-label"><input type="radio" name="saneamentoBasico" value="Outros" onChange={(e) => handleRadioChange("saneamentoBasico", e.target.value)} checked={formData.saneamentoBasico === "Outros"} /> Outros:</label>
              <input type="text" name="saneamentoBasicoOutro" value={formData.saneamentoBasicoOutro || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>POSSUI CONEXÃO COM INTERNET?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiConexaoInternet" value="true" onChange={() => handleRadioChange("possuiConexaoInternet", true)} checked={formData.possuiConexaoInternet === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiConexaoInternet" value="false" onChange={() => handleRadioChange("possuiConexaoInternet", false)} checked={formData.possuiConexaoInternet === false} /> Não</label>
            </div>
          </div>
          
          <div className="form-group">
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="propriedadeInternet" value="Cedida" onChange={(e) => handleRadioChange("propriedadeInternet", e.target.value)} checked={formData.propriedadeInternet === "Cedida"} /> Cedida</label>
              <label className="radio-label"><input type="radio" name="propriedadeInternet" value="Própria" onChange={(e) => handleRadioChange("propriedadeInternet", e.target.value)} checked={formData.propriedadeInternet === "Própria"} /> Própria</label>
            </div>
            <label style={{marginLeft: '15px'}}>Tipo:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="tipoConexaoInternet" value="dados móveis" onChange={(e) => handleRadioChange("tipoConexaoInternet", e.target.value)} checked={formData.tipoConexaoInternet === "dados móveis"} /> dados móveis</label>
              <label className="radio-label"><input type="radio" name="tipoConexaoInternet" value="fixa" onChange={(e) => handleRadioChange("tipoConexaoInternet", e.target.value)} checked={formData.tipoConexaoInternet === "fixa"} /> fixa</label>
            </div>
          </div>

          <div className="form-group">
            <label>TRANSPORTE:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="transporte" value="Próprio" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Próprio"} /> Próprio</label>
              <label className="radio-label"><input type="radio" name="transporte" value="Sistema de Transporte Público" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Sistema de Transporte Público"} /> Sistema de Transporte Público</label>
              <label className="radio-label"><input type="radio" name="transporte" value="Outros" onChange={(e) => handleRadioChange("transporte", e.target.value)} checked={formData.transporte === "Outros"} /> Outros:</label>
              <input type="text" name="transporteOutros" value={formData.transporteOutros || ''} onChange={handleChange} />
            </div>
          </div>


          <div className="section-title">3. SITUAÇÃO DE TRABALHO E RENDA</div>

          <div className="form-group">
            <label>TRABALHA ATUALMENTE:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="trabalhaAtualmente" value="true" onChange={() => handleRadioChange("trabalhaAtualmente", true)} checked={formData.trabalhaAtualmente === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="trabalhaAtualmente" value="false" onChange={() => handleRadioChange("trabalhaAtualmente", false)} checked={formData.trabalhaAtualmente === false} /> Não</label>
            </div>
          </div>

          <div className="form-group full-width">
            <label>FUNÇÃO:</label>
            <input type="text" name="funcao" value={formData.funcao || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width">
            <label>LOCAL DE TRABALHO:</label>
            <input type="text" name="localTrabalho" value={formData.localTrabalho || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>MODALIDADE DE TRABALHO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="modalidadeTrabalho" value="CLT" onChange={(e) => handleRadioChange("modalidadeTrabalho", e.target.value)} checked={formData.modalidadeTrabalho === "CLT"} /> CLT</label>
              <label className="radio-label"><input type="radio" name="modalidadeTrabalho" value="AUTÔNOMO" onChange={(e) => handleRadioChange("modalidadeTrabalho", e.target.value)} checked={formData.modalidadeTrabalho === "AUTÔNOMO"} /> AUTÔNOMO</label>
            </div>
          </div>

          <div className="form-group">
            <label>Se autônomo:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="seAutonomoFormalInformal" value="FORMAL" onChange={(e) => handleRadioChange("seAutonomoFormalInformal", e.target.value)} checked={formData.seAutonomoFormalInformal === "FORMAL"} /> FORMAL</label>
              <label className="radio-label"><input type="radio" name="seAutonomoFormalInformal" value="INFORMAL" onChange={(e) => handleRadioChange("seAutonomoFormalInformal", e.target.value)} checked={formData.seAutonomoFormalInformal === "INFORMAL"} /> INFORMAL</label>
            </div>
          </div>

          <div className="form-group">
            <label>REMUNERAÇÃO:</label>
            <input type="text" name="remuneracao" value={formData.remuneracao || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>EXERCE TRABALHO DOMÉSTICO EM SEU DOMICÍLIO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="exerceTrabalhoDomesticoDomicilio" value="true" onChange={() => handleRadioChange("exerceTrabalhoDomesticoDomicilio", true)} checked={formData.exerceTrabalhoDomesticoDomicilio === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="exerceTrabalhoDomesticoDomicilio" value="false" onChange={() => handleRadioChange("exerceTrabalhoDomesticoDomicilio", false)} checked={formData.exerceTrabalhoDomesticoDomicilio === false} /> Não</label>
            </div>
          </div>

          <div className="form-group">
            <label>RECEBE BENEFÍCIO:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="recebeBeneficio" value="true" onChange={() => handleRadioChange("recebeBeneficio", true)} checked={formData.recebeBeneficio === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="recebeBeneficio" value="false" onChange={() => handleRadioChange("recebeBeneficio", false)} checked={formData.recebeBeneficio === false} /> Não</label>
            </div>
          </div>

          <div className="form-group full-width">
            <label>QUAIS:</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              <label className="radio-label"><input type="checkbox" name="benBolsaFamilia" onChange={handleChange} checked={!!formData.benBolsaFamilia} /> Bolsa Família</label>
              <label className="radio-label"><input type="checkbox" name="benBPC" onChange={handleChange} checked={!!formData.benBPC} /> BPC</label>
              <label className="radio-label"><input type="checkbox" name="benOutros" onChange={handleChange} checked={!!formData.benOutros} /> Outros</label>
              <input type="text" name="quaisBeneficios" value={formData.quaisBeneficios || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="section-title">4. EDUCAÇÃO</div>

          <div className="form-group">
            <label>ESCOLARIDADE:</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Não possui" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Não possui"} /> Não possui</label>
              <label className="radio-label"><input type="radio" name="escolaridadeStatus" value="Cursando" onChange={(e) => handleRadioChange("escolaridadeStatus", e.target.value)} checked={formData.escolaridadeStatus === "Cursando"} /> Cursando</label>
            </div>
            <label style={{marginLeft: '15px'}}>ano:</label>
            <input type="text" name="escolaridadeAno" value={formData.escolaridadeAno || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
          </div>

          <div className="form-group">
            <label>Possui -</label>
            <div className="radio-group" style={{flexWrap: 'wrap'}}>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="FUNDAMENTAL I" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "FUNDAMENTAL I"} /> FUNDAMENTAL I</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="FUNDAMENTAL II" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "FUNDAMENTAL II"} /> FUNDAMENTAL II</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="MÉDIO" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "MÉDIO"} /> MÉDIO</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="TECNÓLOGO" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "TECNÓLOGO"} /> TECNÓLOGO</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="TÉCNICO" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "TÉCNICO"} /> TÉCNICO</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="PROFISSIONALIZANTE" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "PROFISSIONALIZANTE"} /> PROFISSIONALIZANTE</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="SUPERIOR" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "SUPERIOR"} /> SUPERIOR</label>
              <label className="radio-label"><input type="radio" name="escolaridadePossui" value="PÓS-GRADUAÇÃO" onChange={(e) => handleRadioChange("escolaridadePossui", e.target.value)} checked={formData.escolaridadePossui === "PÓS-GRADUAÇÃO"} /> PÓS-GRADUAÇÃO</label>
            </div>
          </div>

          <div className="form-group full-width" style={{display: 'block'}}>
            <label style={{display: 'block', marginBottom: '10px'}}>Quais escolas servem os Ilha/Povoados:</label>
            <input type="text" name="quaisEscolasServemIlhaPovoados" value={formData.quaisEscolasServemIlhaPovoados || ''} onChange={handleChange} style={{width: '100%'}} />
          </div>


          <div className="section-title">5. DESPESAS</div>

          <div className="form-group full-width">
            <div className="radio-group" style={{marginLeft: 0}}>
              <label className="radio-label"><input type="checkbox" name="despEnergia" onChange={handleChange} checked={!!formData.despEnergia} /> Energia Elétrica</label>
              <label className="radio-label"><input type="checkbox" name="despAgua" onChange={handleChange} checked={!!formData.despAgua} /> Água</label>
            </div>
            <label style={{marginLeft: '15px'}}>Alimentação:</label>
            <input type="text" name="despesasAlimentacao" value={formData.despesasAlimentacao || ''} onChange={handleChange} />
          </div>
          <div className="form-group full-width">
            <label>Outros:</label>
            <input type="text" name="despesasOutros" value={formData.despesasOutros || ''} onChange={handleChange} />
          </div>


          <div className="section-title">6. COMPOSIÇÃO FAMILIAR</div>

          <div className="form-group">
            <label>POSSUI FILHOS?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiFilhos" value="true" onChange={() => handleRadioChange("possuiFilhos", true)} checked={formData.possuiFilhos === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiFilhos" value="false" onChange={() => handleRadioChange("possuiFilhos", false)} checked={formData.possuiFilhos === false} /> Não</label>
            </div>
            <label style={{marginLeft: '15px'}}>Quantos?</label>
            <input type="number" name="quantosFilhos" value={formData.quantosFilhos || ''} onChange={handleChange} style={{width: '60px', flexGrow: 0}} />
            <label style={{marginLeft: '15px'}}>Idade?</label>
            <input type="text" name="idadeFilhos" value={formData.idadeFilhos || ''} onChange={handleChange} />
          </div>


          <div className="section-title">7. SAÚDE</div>

          <div className="form-group">
            <label>POSSUI ALGUM PROBLEMA DE SAÚDE?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="possuiProblemaSaude" value="true" onChange={() => handleRadioChange("possuiProblemaSaude", true)} checked={formData.possuiProblemaSaude === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="possuiProblemaSaude" value="false" onChange={() => handleRadioChange("possuiProblemaSaude", false)} checked={formData.possuiProblemaSaude === false} /> Não</label>
            </div>
          </div>

          <div className="form-group full-width">
            <label>QUAL?</label>
            <input type="text" name="qualProblemaSaude" value={formData.qualProblemaSaude || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>FAZ ALGUM TRATAMENTO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="fazTratamento" value="true" onChange={() => handleRadioChange("fazTratamento", true)} checked={formData.fazTratamento === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="fazTratamento" value="false" onChange={() => handleRadioChange("fazTratamento", false)} checked={formData.fazTratamento === false} /> Não</label>
            </div>
          </div>

          <div className="form-group">
            <label>FAZ USO DE MEDICAÇÃO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="fazUsoMedicacao" value="true" onChange={() => handleRadioChange("fazUsoMedicacao", true)} checked={formData.fazUsoMedicacao === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="fazUsoMedicacao" value="false" onChange={() => handleRadioChange("fazUsoMedicacao", false)} checked={formData.fazUsoMedicacao === false} /> Não</label>
            </div>
          </div>
          <div className="form-group full-width">
            <label>Quais:</label>
            <input type="text" name="quaisMedicacoes" value={formData.quaisMedicacoes || ''} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>MEDICAÇÃO USO CONTÍNUO?</label>
            <div className="radio-group">
              <label className="radio-label"><input type="radio" name="medicacaoUsoContinuo" value="true" onChange={() => handleRadioChange("medicacaoUsoContinuo", true)} checked={formData.medicacaoUsoContinuo === true} /> Sim</label>
              <label className="radio-label"><input type="radio" name="medicacaoUsoContinuo" value="false" onChange={() => handleRadioChange("medicacaoUsoContinuo", false)} checked={formData.medicacaoUsoContinuo === false} /> Não</label>
            </div>
          </div>
          <div className="form-group full-width">
            <label>Quais:</label>
            <input type="text" name="quaisMedicacoesUsoContinuo" value={formData.quaisMedicacoesUsoContinuo || ''} onChange={handleChange} />
          </div>

          <div className="form-group full-width" style={{display: 'block'}}>
            <label style={{display: 'block', marginBottom: '10px'}}>QUAL POSTO DE SAÚDE FREQUENTA?</label>
            <input type="text" name="qualPostoSaudeFrequenta" value={formData.qualPostoSaudeFrequenta || ''} onChange={handleChange} style={{width: '100%'}} />
          </div>


          <div className="section-title">8. QUAL A SUA DEMANDA PARA A DEFENSORA</div>
          
          <div className="form-group full-width">
            <textarea name="demandaDefensora" value={formData.demandaDefensora || ''} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="submit-btn">Finalizar e Salvar Dados</button>

        </form>
        

      </div>
    </>
  );
}
