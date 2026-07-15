"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [assistidos, setAssistidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    
    // Pegar todas as chaves únicas de todos os objetos
    const headers = Array.from(new Set(assistidos.flatMap(Object.keys)));
    
    const csvContent = [
      headers.join(","),
      ...assistidos.map((row) => 
        headers.map((fieldName) => {
          let field = row[fieldName] || "";
          // Tratar vírgulas e aspas para CSV
          if (typeof field === "string") {
            field = field.replace(/"/g, '""');
            if (field.includes(",") || field.includes("\n") || field.includes('"')) {
              field = `"${field}"`;
            }
          }
          return field;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `assistidos_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{padding: 20}}>Carregando dados...</div>;

  return (
    <div style={{padding: 20, fontFamily: "sans-serif"}}>
      <h1 style={{marginBottom: 20}}>Painel de Administração - Assistidos</h1>
      
      <div style={{marginBottom: 20}}>
        <button 
          onClick={exportToCSV}
          style={{
            padding: "10px 20px", 
            backgroundColor: "#28a745", 
            color: "white", 
            border: "none", 
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Exportar para CSV (Excel)
        </button>
      </div>

      <div style={{overflowX: "auto"}}>
        <table style={{width: "100%", borderCollapse: "collapse", minWidth: 800}}>
          <thead>
            <tr style={{backgroundColor: "#f4f6f8", textAlign: "left"}}>
              <th style={{border: "1px solid #ddd", padding: 8}}>Data/Hora</th>
              <th style={{border: "1px solid #ddd", padding: 8}}>Núcleo</th>
              <th style={{border: "1px solid #ddd", padding: 8}}>Nome</th>
              <th style={{border: "1px solid #ddd", padding: 8}}>CPF</th>
              <th style={{border: "1px solid #ddd", padding: 8}}>Telefone</th>
              <th style={{border: "1px solid #ddd", padding: 8}}>Demanda</th>
            </tr>
          </thead>
          <tbody>
            {assistidos.map((a) => (
              <tr key={a.id}>
                <td style={{border: "1px solid #ddd", padding: 8}}>{new Date(a.createdAt).toLocaleString()}</td>
                <td style={{border: "1px solid #ddd", padding: 8}}>{a.nucleoRegional || "-"}</td>
                <td style={{border: "1px solid #ddd", padding: 8}}>{a.nome}</td>
                <td style={{border: "1px solid #ddd", padding: 8}}>{a.numeroCpf || "-"}</td>
                <td style={{border: "1px solid #ddd", padding: 8}}>{a.telefone || "-"}</td>
                <td style={{border: "1px solid #ddd", padding: 8}}>{a.demandaDefensora || "-"}</td>
              </tr>
            ))}
            {assistidos.length === 0 && (
              <tr>
                <td colSpan={6} style={{border: "1px solid #ddd", padding: 8, textAlign: "center"}}>Nenhum assistido cadastrado ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
