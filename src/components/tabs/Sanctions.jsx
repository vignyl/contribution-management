import React from "react";
import { useApp } from "../../context/AppContext";
import { FilterBar, SHdr, Card, TH, TD, Badge, Btn } from "../ui";
import { C, fmt, doPrint, fmtDate } from "../../utils";

export const Sanctions = () => {
  const { sanctions, filteredSanctions, fSanc, setFSanc, fSancMember, setFSancMember, members, openM, doPaySanction, doDeleteSanction } = useApp();

  const prtSanctions = () => doPrint("Sanctions", `<div class="sg"><div class="sb"><div class="sv">${sanctions.length}</div><div class="sl">Total</div></div><div class="sb"><div class="sv">${sanctions.filter(s=>s.status==="en_attente").length}</div><div class="sl">En attente</div></div><div class="sb"><div class="sv">${fmt(sanctions.filter(s=>s.status==="payee").reduce((s,x)=>s+x.montant,0))}</div><div class="sl">Encaissé</div></div><div class="sb"><div class="sv">${fmt(sanctions.filter(s=>s.status==="en_attente").reduce((s,x)=>s+x.montant,0))}</div><div class="sl">En attente (total)</div></div></div><table><thead><tr><th>Date</th><th>Membre</th><th>Raison</th><th>Montant</th><th>Statut</th></tr></thead><tbody>${[...sanctions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>{const mb=members.find(m=>m.id===s.memberId);return`<tr><td>${fmtDate(s.date)}</td><td>${mb?.name||"?"}</td><td>${s.raison}</td><td><strong>${fmt(s.montant)}</strong></td><td>${s.status==="payee"?'<span class="ok">Payée</span>':'<span class="wa">En attente</span>'}</td></tr>`;}).join("")}</tbody></table>`);

  return (
    <div>
      <SHdr title="⚠️ Sanctions" printFn={prtSanctions} onAdd={() => openM("addSanction")} addLabel="+ Nouvelle Sanction"/>
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        <FilterBar value={fSanc} onChange={setFSanc} options={[
          {value:"tous",       label:`Toutes (${sanctions.length})`},
          {value:"en_attente", label:`⏳ En attente (${sanctions.filter(s=>s.status==="en_attente").length})`},
          {value:"payee",      label:`✓ Payées (${sanctions.filter(s=>s.status==="payee").length})`},
        ]}/>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:11, color:C.muted }}>👤 Filtrer par membre :</span>
          <select 
            value={fSancMember} 
            onChange={e=>setFSancMember(e.target.value)}
            style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, color:C.text, outline:"none", padding:"6px 10px", fontSize:12, cursor:"pointer" }}
          >
            <option value="">Tous les membres</option>
            {[...members].sort((a,b)=>a.name.localeCompare(b.name)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {fSancMember && <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>setFSancMember("")}>✕</Btn>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[{l:"Total",v:sanctions.length,c:C.muted},{l:"En attente",v:sanctions.filter(s=>s.status==="en_attente").length,c:C.warn},{l:"Payées",v:sanctions.filter(s=>s.status==="payee").length,c:C.green},{l:"Encaissé → Fonds Asso",v:fmt(sanctions.filter(s=>s.status==="payee").reduce((s,x)=>s+x.montant,0)),c:C.purple}].map((s,i) => (
          <div key={i} style={{ background:C.card, borderRadius:12, padding:"14px 18px", border:`1px solid ${s.c}33` }}><div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:11, color:C.muted, marginTop:3, textTransform:"uppercase" }}>{s.l}</div></div>
        ))}
      </div>
      <Card>
        {filteredSanctions.length===0 ? <div style={{ textAlign:"center", color:C.muted, padding:"30px 0" }}>Aucune sanction pour ce filtre</div> : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Date","Membre","Raison","Montant","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
            <tbody>{filteredSanctions.map(s => {
              const mb=members.find(m=>m.id===s.memberId);
              return (<tr key={s.id}>
                <TD s={{ color:C.muted, fontSize:12 }}>{fmtDate(s.date)}</TD>
                <TD><strong>{mb?.name||"Membre inconnu"}</strong>{mb?.ville&&<div style={{ fontSize:11, color:C.muted }}>{mb.ville}</div>}</TD>
                <TD style={{ maxWidth:220 }}><span style={{ fontSize:12 }}>{s.raison}</span></TD>
                <TD><strong style={{ color:C.warn }}>{fmt(s.montant)}</strong></TD>
                <TD>{s.status==="payee"?<div><Badge color={C.green}>✓ Payée</Badge>{s.datePaiement&&<div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{fmtDate(s.datePaiement)}</div>}</div>:<Badge color={C.warn}>⏳ En attente</Badge>}</TD>
                <TD><div style={{ display:"flex", gap:3 }}>
                  {s.status==="en_attente"&&<Btn bg={C.green}  sm onClick={() => doPaySanction(s.id)}>✓ Payer</Btn>}
                  {s.status==="en_attente"&&<Btn bg={C.gold}   sm onClick={() => openM("editSanction",{sancId:`${s.id}`,memberId:`${s.memberId}`,montant:`${s.montant}`,date:s.date,raison:s.raison})}>✏️</Btn>}
                  {s.status==="en_attente"&&<Btn bg={C.danger} sm onClick={() => doDeleteSanction(s.id)}>🗑️</Btn>}
                </div></TD>
              </tr>);
            })}</tbody>
            <tfoot style={{ background:"rgba(255,255,255,0.03)", fontWeight:800 }}>
              <tr>
                <TD style={{ textTransform:"uppercase", fontSize:11, letterSpacing:1 }}>TOTAL</TD>
                <TD></TD>
                <TD></TD>
                <TD style={{ color:C.warn }}>{fmt(filteredSanctions.reduce((s,x)=>s+x.montant,0))}</TD>
                <TD colSpan={2}></TD>
              </tr>
            </tfoot>
          </table>
        )}
      </Card>
    </div>
  );
};
