import React from "react";
import { useApp } from "../context/AppContext";
import { Btn } from "./ui";
import { C, fmt } from "../utils";

export const ImportModal = () => {
  const { 
    importData, importStep, importConf, setImportData, setImportStep, 
    doImportMerge, doImportReplace 
  } = useApp();

  if (!importData) return null;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(6px)" }}>
      <div style={{ background:C.card, borderRadius:16, padding:28, width:540, maxWidth:"95vw", border:`1px solid ${C.border}`, boxShadow:"0 24px 80px rgba(0,0,0,.8)", maxHeight:"90vh", overflowY:"auto" }}>
        {importStep===1 && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6, color:C.gold }}>📂 Aperçu</div>
            <div style={{ fontSize:12, color:C.muted, marginBottom:18 }}>Exporté le : {importData._exported_label||"inconnu"}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
              {[{l:"Membres",v:(importData.members||[]).length,c:C.blue},{l:"Prêts",v:(importData.loans||[]).length,c:C.gold},{l:"Sanctions",v:(importData.sanctions||[]).length,c:C.warn},{l:"Fonds Asso",v:fmt(importData.fondsAsso||0),c:C.purple}].map((s,i) => (
                <div key={i} style={{ background:C.card2, borderRadius:10, padding:"10px 14px", border:`1px solid ${s.c}33` }}><div style={{ fontSize:15, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{s.l}</div></div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn bg={C.muted} onClick={()=>{setImportData(null);setImportStep(0);}}>Annuler</Btn><Btn bg={C.blue} onClick={doImportMerge}>🔀 Fusionner</Btn><Btn bg={C.danger} onClick={doImportReplace}>♻️ Remplacer</Btn></div>
          </div>
        )}
        {importStep===2 && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:6, color:C.danger }}>⚠️ {importConf.length} conflit(s)</div>
            <div style={{ maxHeight:260, overflowY:"auto", marginBottom:14, border:`1px solid ${C.border}`, borderRadius:10 }}>
              {importConf.map((c,i) => (
                <div key={i} style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
                  <div style={{ fontWeight:700, color:c.type==="membre"?C.blue:C.gold, marginBottom:5 }}>{c.type==="membre"?"👤":"💳"} Conflit</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div style={{ background:`${C.green}15`, borderRadius:8, padding:"7px 10px" }}><div style={{ color:C.green, fontWeight:700, fontSize:10, marginBottom:3 }}>EXISTANT</div><div>{c.type==="membre"?c.existing.name:fmt(c.existing.montant)}</div></div>
                    <div style={{ background:`${C.warn}15`, borderRadius:8, padding:"7px 10px" }}><div style={{ color:C.warn, fontWeight:700, fontSize:10, marginBottom:3 }}>IMPORTÉ</div><div>{c.type==="membre"?c.imported.name:fmt(c.imported.montant)}</div></div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn bg={C.muted} onClick={()=>{setImportData(null);setImportStep(0);}}>Annuler</Btn><Btn bg={C.blue} onClick={doImportMerge}>🔀 Fusionner</Btn><Btn bg={C.danger} onClick={doImportReplace}>♻️ Remplacer</Btn></div>
          </div>
        )}
      </div>
    </div>
  );
};
