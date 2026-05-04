import React, { useRef } from "react";
import { useApp } from "../context/AppContext";
import { Btn } from "./ui";
import { C } from "../utils";

const TABS = [
  {id:"dashboard",   label:"📊 Tableau de Bord"},
  {id:"membres",     label:"👥 Membres"},
  {id:"prets",       label:"💳 Prêts"},
  {id:"cotisations", label:"💰 Cotisations"},
  {id:"sanctions",   label:"⚠️ Sanctions"},
  {id:"sorties",     label:"📤 Sorties"},
  {id:"historique",  label:"📋 Historique"},
];

export const Header = () => {
  const { tab, setTab, onFileChange, doExport, members, doClearData, openM, authCreds, doLogout } = useApp();
  const fileRef = useRef();

  return (
    <div style={{ background:C.card, borderBottom:`2px solid ${C.accent}`, padding:"10px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 28px rgba(0,0,0,.55)" }}>
      <div>
        <div style={{ fontSize:22, fontWeight:900, background:`linear-gradient(135deg,${C.accent},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:4 }}>AFAY</div>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:1 }}>SYSTÈME DE GESTION FINANCIÈRE</div>
      </div>
      <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:11, background:tab===t.id?C.accent:"rgba(255,255,255,0.05)", color:tab===t.id?"#fff":C.muted }}>{t.label}</button>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={onFileChange}/>
        <Btn bg="rgba(255,255,255,0.07)" sm onClick={() => fileRef.current?.click()}>📥</Btn>
        <Btn bg={C.green} sm onClick={doExport} disabled={members.length===0}>📤</Btn>
        <Btn bg={C.danger} sm onClick={doClearData}>🗑️</Btn>
        <Btn bg="rgba(255,255,255,0.07)" sm onClick={() => openM("changeCredentials", { newUser:authCreds.username })}>⚙️</Btn>
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", background:"rgba(255,255,255,0.05)", borderRadius:8, border:`1px solid ${C.border}` }}>
          <span style={{ fontSize:11, color:C.gold, fontWeight:700 }}>👤 {authCreds.username}</span>
        </div>
        <Btn bg={C.danger} sm onClick={doLogout}>⏻ Déco.</Btn>
      </div>
    </div>
  );
};
