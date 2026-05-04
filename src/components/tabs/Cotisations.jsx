import React from "react";
import { useApp } from "../../context/AppContext";
import { SHdr, Card, Btn, TH, TD, Badge } from "../ui";
import { C, fmt, SEUIL } from "../../utils";

export const Cotisations = () => {
  const { 
    members, membersX, cotisations, cotisSubTab, setCotisSubTab, 
    fCotisName, setFCotisName, openM, doDeleteCotisation, totFC, totFR, totDette 
  } = useApp();

  return (
    <div>
      <SHdr title="💰 Cotisations" onAdd={() => openM("addCotisation")} addLabel="+ Nouvelle Cotisation"/>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:2, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:4 }}>
          {[{id:"tous",label:"🗂️ Vue d'ensemble"},{id:"caisse",label:"🏦 Fonds de Caisse"},{id:"roulement",label:"🔄 Fonds de Roulement"}].map(t=>(
            <button key={t.id} onClick={()=>setCotisSubTab(t.id)} style={{ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:cotisSubTab===t.id?C.accent:"transparent", color:cotisSubTab===t.id?"#fff":C.muted }}>{t.label}</button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:11, color:C.muted }}>🔍</span>
          <input style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, outline:"none", width:200, padding:"6px 12px", fontSize:12 }} placeholder="Filtrer par nom…" value={fCotisName} onChange={e=>setFCotisName(e.target.value)}/>
          {fCotisName && <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>setFCotisName("")}>✕</Btn>}
        </div>
      </div>
      {members.length===0 ? <Card style={{ textAlign:"center", padding:"40px" }}><div style={{ color:C.muted }}>Aucun membre.</div></Card> : (
        <div>
          {cotisSubTab==="tous" && (
            <Card>
              <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Seuil Fonds de Caisse «à jour» : <strong style={{ color:C.gold }}>{fmt(SEUIL)}</strong></div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead><tr>{["Membre","FC — Progression","Statut","Fonds Roulement","Part%","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                <tbody>{membersX.filter(m=>!fCotisName||m.name.toLowerCase().includes(fCotisName.toLowerCase())).map(m => {
                  const nb=cotisations.filter(c=>c.memberId===m.id&&!c.auto).length;
                  const pct=Math.min((m.fondsCaisse/SEUIL)*100,100);
                  return (<tr key={m.id}>
                    <TD><strong>{m.name}</strong>{m.ville&&<div style={{ fontSize:11, color:C.muted }}>{m.ville}</div>}</TD>
                    <TD><div style={{ fontSize:12, fontWeight:600, color:m.aJour?C.green:C.warn, marginBottom:4 }}>{fmt(m.fondsCaisse)}</div><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3 }}><div style={{ width:`${pct}%`, height:"100%", background:m.aJour?C.green:C.warn, borderRadius:3 }}/></div><span style={{ fontSize:11, color:C.muted, minWidth:32 }}>{pct.toFixed(0)}%</span></div></TD>
                    <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ Non"}</Badge></TD>
                    <TD>{fmt(m.fondsRoulement)}</TD>
                    <TD><span style={{ fontWeight:700, color:C.gold }}>{m.prorata.toFixed(2)}%</span></TD>
                    <TD><span style={{ background:"rgba(255,255,255,0.07)", padding:"2px 9px", borderRadius:20, fontSize:12 }}>{nb} enreg.</span></TD>
                    <TD><div style={{ display:"flex", gap:3 }}>
                      <Btn bg={C.blue}  sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"caisse"})}>+ Caisse</Btn>
                      <Btn bg={C.green} sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"roulement"})}>+ Roulem.</Btn>
                      <Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn>
                    </div></TD>
                  </tr>);
                })}</tbody>
              </table>
            </Card>
          )}
          {cotisSubTab==="caisse" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.blue}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.blue }}>{fmt(totFC)}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>Total solde</div></div>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.green}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.green }}>{membersX.filter(m=>m.aJour).length}/{members.length}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>À jour</div></div>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.warn}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.warn }}>{fmt(SEUIL)}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>Seuil requis</div></div>
              </div>
              <Card style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:12, borderLeft:`3px solid ${C.blue}`, paddingLeft:10 }}>🏦 Par membre</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Membre","Ville","Fonds Caisse","Progression","Statut","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{membersX.filter(m=>!fCotisName||m.name.toLowerCase().includes(fCotisName.toLowerCase())).map(m => {
                    const cots=cotisations.filter(c=>c.memberId===m.id&&c.type==="caisse"&&!c.auto);
                    const pct=Math.min((m.fondsCaisse/SEUIL)*100,100);
                    return (<tr key={m.id}>
                      <TD><strong>{m.name}</strong></TD>
                      <TD s={{ color:C.muted, fontSize:12 }}>{m.ville||"—"}</TD>
                      <TD><strong style={{ color:m.aJour?C.green:C.warn }}>{fmt(m.fondsCaisse)}</strong></TD>
                      <TD><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3 }}><div style={{ width:`${pct}%`, height:"100%", background:m.aJour?C.green:C.warn, borderRadius:3 }}/></div><span style={{ fontSize:11, color:C.muted, minWidth:34 }}>{pct.toFixed(0)}%</span></div></TD>
                      <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ Non"}</Badge></TD>
                      <TD><span style={{ background:`${C.blue}22`, color:C.blue, padding:"2px 9px", borderRadius:20, fontSize:12 }}>{cots.length}</span></TD>
                      <TD><div style={{ display:"flex", gap:3 }}><Btn bg={C.blue} sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"caisse"})}>+ Verser</Btn><Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn></div></TD>
                    </tr>);
                  })}</tbody>
                </table>
              </Card>
              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:C.blue, marginBottom:12, borderLeft:`3px solid ${C.blue}`, paddingLeft:10 }}>📋 Historique ({cotisations.filter(c=>c.type==="caisse"&&!c.auto).length})</div>
                {cotisations.filter(c=>c.type==="caisse"&&!c.auto).length===0 ? <div style={{ textAlign:"center", color:C.muted, padding:"18px 0" }}>Aucun versement</div> : (
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr>{["Date & Heure","Membre","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                    <tbody>{[...cotisations].filter(c=>c.type==="caisse"&&!c.auto&&(!fCotisName||members.find(m=>m.id===c.memberId)?.name.toLowerCase().includes(fCotisName.toLowerCase()))).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(c => {
                      const mb=members.find(m=>m.id===c.memberId);
                      return (<tr key={c.id}>
                        <TD s={{ fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{c.date}<div style={{ fontSize:10 }}>{c.heure||"—"}</div></TD>
                        <TD><strong>{mb?.name||"?"}</strong>{mb?.ville&&<span style={{ fontSize:11, color:C.muted, marginLeft:5 }}>{mb.ville}</span>}</TD>
                        <TD><strong style={{ color:C.blue }}>{fmt(c.montant)}</strong></TD>
                        <TD><div style={{ display:"flex", gap:3 }}>
                          <Btn bg={C.gold}   xs onClick={()=>openM("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn>
                          <Btn bg={C.danger} xs onClick={()=>doDeleteCotisation(c.id)}>🗑️</Btn>
                        </div></TD>
                      </tr>);
                    })}</tbody>
                  </table>
                )}
              </Card>
            </div>
          )}
          {cotisSubTab==="roulement" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.green}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.green }}>{fmt(totFR)}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>Solde net actuel</div></div>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.warn}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.warn }}>{fmt(totDette)}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>En prêts actifs</div></div>
                <div style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${C.gold}33` }}><div style={{ fontSize:19, fontWeight:800, color:C.gold }}>{cotisations.filter(c=>c.type==="roulement").length}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>Mouvements</div></div>
              </div>
              <Card style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:12, borderLeft:`3px solid ${C.green}`, paddingLeft:10 }}>🔄 Par membre</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Membre","Ville","Fonds Roulement","Part %","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{membersX.filter(m=>!fCotisName||m.name.toLowerCase().includes(fCotisName.toLowerCase())).map(m => {
                    const cots=cotisations.filter(c=>c.memberId===m.id&&c.type==="roulement"&&!c.auto);
                    return (<tr key={m.id}>
                      <TD><strong>{m.name}</strong></TD>
                      <TD s={{ color:C.muted, fontSize:12 }}>{m.ville||"—"}</TD>
                      <TD><strong style={{ color:C.green }}>{fmt(m.fondsRoulement)}</strong></TD>
                      <TD><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3 }}><div style={{ width:`${m.prorata}%`, height:"100%", background:`linear-gradient(90deg,${C.green},${C.blue})`, borderRadius:3 }}/></div><span style={{ fontSize:11, fontWeight:700, color:C.gold, minWidth:44 }}>{m.prorata.toFixed(1)}%</span></div></TD>
                      <TD><span style={{ background:`${C.green}22`, color:C.green, padding:"2px 9px", borderRadius:20, fontSize:12 }}>{cots.length}</span></TD>
                      <TD><div style={{ display:"flex", gap:3 }}><Btn bg={C.green} sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"roulement"})}>+ Verser</Btn><Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn></div></TD>
                    </tr>);
                  })}</tbody>
                </table>
              </Card>
              <Card>
                <div style={{ fontSize:13, fontWeight:700, color:C.green, marginBottom:12, borderLeft:`3px solid ${C.green}`, paddingLeft:10 }}>📋 Historique des mouvements</div>
                {cotisations.filter(c=>c.type==="roulement").length===0 ? <div style={{ textAlign:"center", color:C.muted, padding:"18px 0" }}>Aucun mouvement</div> : (
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr>{["Date & Heure","Membre","Opération","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                    <tbody>{[...cotisations].filter(c=>c.type==="roulement"&&(!fCotisName||members.find(m=>m.id===c.memberId)?.name.toLowerCase().includes(fCotisName.toLowerCase()))).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(c => {
                      const mb=members.find(m=>m.id===c.memberId);
                      const isD=c.direction==="debit", isCr=c.direction==="credit"&&c.auto;
                      return (<tr key={c.id}>
                        <TD s={{ fontSize:11, color:C.muted, whiteSpace:"nowrap" }}>{c.date}<div style={{ fontSize:10 }}>{c.heure||"—"}</div></TD>
                        <TD><strong>{mb?.name||"?"}</strong></TD>
                        <TD>{isD?<Badge color={C.warn}>📤 {c.label||"Contribution"}</Badge>:isCr?<Badge color={C.green}>📥 {c.label||"Retour"}</Badge>:<Badge color={C.green}>🔄 Versement</Badge>}</TD>
                        <TD><strong style={{ color:isD?C.danger:C.green }}>{isD?"−":"+"} {fmt(c.montant)}</strong></TD>
                        <TD>{c.auto?<span style={{ fontSize:10, color:C.muted, fontStyle:"italic" }}>auto</span>:<div style={{ display:"flex", gap:3 }}><Btn bg={C.gold} xs onClick={()=>openM("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn><Btn bg={C.danger} xs onClick={()=>doDeleteCotisation(c.id)}>🗑️</Btn></div>}</TD>
                      </tr>);
                    })}</tbody>
                  </table>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
