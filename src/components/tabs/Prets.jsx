import React from "react";
import { useApp } from "../../context/AppContext";
import { FilterBar, SHdr, Card, TH, TD, Badge, Btn } from "../ui";
import { C, fmt, dLeft, tod, calcMontantActuel } from "../../utils";

export const Prets = () => {
  const { fLoan, setFLoan, loans, actLoans, filteredLoans, members, openM, doDeleteLoan } = useApp();

  return (
    <div>
      <SHdr title="💳 Gestion des Prêts" onAdd={() => openM("addLoan")} addLabel="+ Nouveau Prêt"/>
      <FilterBar value={fLoan} onChange={setFLoan} options={[
        {value:"tous",      label:`Tous (${loans.length})`},
        {value:"actif",     label:`⏳ Actifs (${loans.filter(l=>l.status==="actif").length})`},
        {value:"retard",    label:`🚨 En retard (${loans.filter(l=>l.status==="actif"&&dLeft(l.echeance)<=0).length})`},
        {value:"rembourse", label:`✓ Remboursés (${loans.filter(l=>l.status==="rembourse").length})`},
      ]}/>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[{l:"Actifs",v:actLoans.length,c:C.warn},{l:"Remboursés",v:loans.filter(l=>l.status==="rembourse").length,c:C.green},{l:"Total Intérêts",v:fmt(loans.reduce((s,l)=>s+l.interets,0)),c:C.gold}].map((s,i) => (
          <div key={i} style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${s.c}33` }}>
            <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>
      <Card>
        {filteredLoans.length===0 ? <div style={{ textAlign:"center", color:C.muted, padding:"30px 0" }}>Aucun prêt pour ce filtre</div> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Date","Emprunteur","Capital","Montant Initial","Montant Actualisé","Période","Échéance","Remboursé le","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
            <tbody>{filteredLoans.map(l => {
              const empr=members.find(m=>m.id===l.emprunteurId), d=dLeft(l.echeance);
              const actual=l.status==="actif" ? calcMontantActuel(l,tod()) : { montantDu:l.montantRembourse||l.montantDu, interets:l.interetsRembourse||l.interets, periods:"—" };
              const overdue=l.status==="actif"&&d<=0;
              return (<tr key={l.id} style={{ background:overdue?"rgba(192,57,43,0.06)":"transparent" }}>
                <TD s={{ color:C.muted, fontSize:12 }}>{l.date}</TD>
                <TD><strong>{empr?.name}</strong></TD>
                <TD>{fmt(l.montant)}</TD>
                <TD s={{ color:C.muted, fontSize:12 }}>{fmt(l.montant*1.1)}<div style={{ fontSize:10, color:C.muted }}>1 période</div></TD>
                <TD><strong style={{ color:overdue?C.danger:C.accent, fontSize:14 }}>{fmt(actual.montantDu)}</strong><div style={{ fontSize:10, color:C.gold }}>+{fmt(actual.interets)} intérêts</div></TD>
                <TD><span style={{ fontWeight:700, color:overdue?C.danger:C.gold, fontSize:13 }}>{typeof actual.periods==="number"?`Période ${actual.periods}`:actual.periods}</span>{overdue&&<div style={{ fontSize:10, color:C.danger }}>🚨 {Math.abs(d)}j retard</div>}{l.status==="actif"&&!overdue&&<div style={{ fontSize:10, color:d<=30?C.warn:C.muted }}>{d}j restants</div>}</TD>
                <TD s={{ fontSize:12, color:overdue?C.danger:C.muted }}>{l.echeance}</TD>
                <TD>{l.dateRembours?<span style={{ fontSize:12, color:C.green, fontWeight:600 }}>{l.dateRembours}</span>:<span style={{ color:C.muted, fontSize:12 }}>—</span>}</TD>
                <TD><Badge color={l.status==="actif"?(overdue?C.danger:C.warn):C.green}>{l.status==="actif"?(overdue?"🚨 En retard":"En cours"):"✓ Remboursé"}</Badge></TD>
                <TD><div style={{ display:"flex", gap:3 }}>
                  {l.status==="actif"&&<Btn bg={C.green} sm onClick={() => openM("repayLoan",{loanId:`${l.id}`})}>✓ Payer</Btn>}
                  <Btn bg={C.gold}   sm onClick={() => openM("editLoan",{loanId:`${l.id}`,montant:`${l.montant}`,date:l.date,assistantId:`${l.assistantId||""}`,emprunteurId:`${l.emprunteurId}`})}>✏️</Btn>
                  <Btn bg={C.danger} sm onClick={() => doDeleteLoan(l.id)}>🗑️</Btn>
                </div></TD>
              </tr>);
            })}</tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
