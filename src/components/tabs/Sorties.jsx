import React from "react";
import { useApp } from "../../context/AppContext";
import { SHdr, Card, Btn, TH, TD, Badge } from "../ui";
import { C, fmt, doPrint } from "../../utils";

export const Sorties = () => {
  const { sorties, members, openM, doDeleteSortie } = useApp();

  const prtSorties = () => doPrint("Sorties de Fonds", `<table><thead><tr><th>Date</th><th>Source</th><th>Raison</th><th>Montant</th></tr></thead><tbody>${[...sorties].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>`<tr><td>${s.date}</td><td>${s.source==="caisse"?"Fonds Caisse":"Fonds Association"}</td><td>${s.raison}</td><td><strong>${fmt(s.montant)}</strong></td></tr>`).join("")}</tbody></table>`);

  return (
    <div>
      <SHdr title="📤 Sorties de Fonds" printFn={prtSorties} onAdd={() => openM("addSortie",{sortieMembers:members.map(m=>m.id)})} addLabel="+ Nouvelle Sortie"/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[{l:"Total sorties",v:fmt(sorties.reduce((s,x)=>s+x.montant,0)),c:C.danger},{l:"Depuis Fonds Caisse",v:fmt(sorties.filter(s=>s.source==="caisse").reduce((s,x)=>s+x.montant,0)),c:C.blue},{l:"Depuis Fonds Asso",v:fmt(sorties.filter(s=>s.source==="asso").reduce((s,x)=>s+x.montant,0)),c:C.purple}].map((s,i) => (
          <div key={i} style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${s.c}33` }}><div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>{s.l}</div></div>
        ))}
      </div>
      <Card>
        {sorties.length===0 ? <div style={{ textAlign:"center", color:C.muted, padding:"30px 0" }}>Aucune sortie enregistrée</div> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Date","Source","Raison","Membres concernés","Part / membre","Total","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
            <tbody>{[...sorties].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s => (
              <tr key={s.id}>
                <TD s={{ color:C.muted, fontSize:12, whiteSpace:"nowrap" }}>{s.date}<div style={{ fontSize:10 }}>{s.heure||""}</div></TD>
                <TD><Badge color={s.source==="caisse"?C.blue:C.purple}>{s.source==="caisse"?"🏦 Caisse":"🏛️ Asso"}</Badge></TD>
                <TD style={{ maxWidth:200 }}><span style={{ fontSize:12 }}>{s.raison}</span></TD>
                <TD s={{ fontSize:12 }}>{s.source==="caisse"&&s.memberIds?<div style={{ lineHeight:1.6 }}>{s.memberIds.map(id=>{const mb=members.find(m=>`${m.id}`===`${id}`);return mb?<div key={id} style={{ color:C.muted }}>{mb.name}</div>:null;})}</div>:<span style={{ color:C.muted }}>—</span>}</TD>
                <TD>{s.partParMembre!=null?<strong style={{ color:C.warn }}>{fmt(s.partParMembre)}</strong>:<span style={{ color:C.muted }}>—</span>}</TD>
                <TD><strong style={{ color:C.danger }}>{fmt(s.montant)}</strong></TD>
                <TD><Btn bg={C.danger} sm onClick={() => doDeleteSortie(s.id)}>🗑️ Annuler</Btn></TD>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
