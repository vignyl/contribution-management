import React from "react";
import { useApp } from "../../context/AppContext";
import { FilterBar, SHdr, Card, TH, TD, Badge, Btn } from "../ui";
import { C, fmt } from "../../utils";

export const Membres = () => {
  const { fMbr, setFMbr, membersX, filteredMembers, openM, doDeleteMember, prtAllRapports } = useApp();

  return (
    <div>
      <SHdr title="👥 Gestion des Membres" printFn={prtAllRapports} onAdd={() => openM("addMember")} addLabel="+ Nouveau Membre"/>
      <FilterBar value={fMbr} onChange={setFMbr} options={[
        {value:"tous",     label:`Tous (${membersX.length})`},
        {value:"ajour",    label:`✓ À jour (${membersX.filter(m=>m.aJour).length})`},
        {value:"nonajour", label:`✗ Non à jour (${membersX.filter(m=>!m.aJour).length})`},
        {value:"loan",     label:`💳 Avec prêt actif (${membersX.filter(m=>!!m.loanActif).length})`},
      ]}/>
      {filteredMembers.length===0 ? (
        <Card style={{ textAlign:"center", padding:"40px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>👤</div>
          <div style={{ color:C.muted, fontSize:13 }}>Aucun membre pour ce filtre.</div>
        </Card>
      ) : (
        <Card>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Membre","Ville","Téléphone","Fonds Caisse","Fonds Roulement","Part%","Statut","Prêt actif","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
            <tbody>{filteredMembers.map(m => (
              <tr key={m.id}>
                <TD><strong>{m.name}</strong></TD>
                <TD s={{ color:C.muted, fontSize:12 }}>{m.ville||"—"}</TD>
                <TD s={{ color:C.muted, fontSize:12 }}>{m.telephone||"—"}</TD>
                <TD><span style={{ color:m.aJour?C.green:C.warn, fontWeight:600 }}>{fmt(m.fondsCaisse)}</span></TD>
                <TD>{fmt(m.fondsRoulement)}</TD>
                <TD><span style={{ fontWeight:700, color:C.gold }}>{m.prorata.toFixed(2)}%</span></TD>
                <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ En retard"}</Badge></TD>
                <TD>{m.loanActif?<span style={{ color:C.warn, fontWeight:600 }}>{fmt(m.loanActif.montantDu)}</span>:<span style={{ color:C.muted }}>—</span>}</TD>
                <TD><div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                  <Btn bg={C.blue}   sm onClick={() => openM("addCotisation",{memberId:m.id})}>+ Cotis.</Btn>
                  <Btn bg={C.accent} sm onClick={() => openM("addLoan",{emprunteurId:`${m.id}`})}>+ Prêt</Btn>
                  <Btn bg="rgba(255,255,255,0.1)" sm onClick={() => openM("memberDetail",{memberId:m.id})}>👁️</Btn>
                  <Btn bg={C.gold}   sm onClick={() => openM("editMember",{memberId:m.id,name:m.name,ville:m.ville||"",telephone:m.telephone||""})}>✏️</Btn>
                  <Btn bg={C.danger} sm onClick={() => doDeleteMember(m.id)}>🗑️</Btn>
                </div></TD>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
