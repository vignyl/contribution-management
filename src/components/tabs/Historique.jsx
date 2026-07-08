import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, TH, TD, Badge } from "../ui";
import { C, fmt } from "../../utils";

export const Historique = () => {
  const { history, histGroup, setHistGroup, histGrouped } = useApp();

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:20, fontWeight:700 }}>📋 Historique</div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.muted }}>Grouper par action :</span>
          <button onClick={() => setHistGroup(v => !v)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${histGroup?C.accent:C.border}`, background:histGroup?C.accent:"transparent", color:histGroup?"#fff":C.muted, cursor:"pointer", fontWeight:700, fontSize:11 }}>
            {histGroup ? "✓ Groupé" : "Par date"}
          </button>
        </div>
      </div>
      {history.length===0 ? <Card><div style={{ textAlign:"center", color:C.muted, padding:"40px 0" }}>Aucune opération</div></Card> :
        histGroup ? (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {histGrouped.map(([action, items]) => (
              <Card key={action}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Badge color={C.blue}>{action}</Badge>
                    <span style={{ fontSize:12, color:C.muted }}>{items.length} opération{items.length>1?"s":""}</span>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:C.gold }}>{fmt(items.reduce((s,h)=>s+h.montant,0))} total</span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>{["Date & Heure","Détail","Montant"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{items.map(h => (
                    <tr key={h.id}>
                      <TD s={{ color:C.muted, fontSize:11, whiteSpace:"nowrap" }}>{h.date}<div style={{ fontSize:10 }}>{h.heure||"—"}</div></TD>
                      <TD>{h.detail}</TD>
                      <TD><span style={{ fontWeight:700, color:h.montant !== 0 ? (h.montant > 0 ? C.gold : C.danger) : C.muted }}>{h.montant !== 0 ? (h.montant > 0 ? "" : "- ") + fmt(Math.abs(h.montant)) : "—"}</span></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr>{["Date & Heure","Action","Détail","Montant"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
              <tbody>{history.map(h => (
                <tr key={h.id}>
                  <TD s={{ color:C.muted, fontSize:12, whiteSpace:"nowrap" }}>{h.date}<div style={{ fontSize:10 }}>{h.heure||"—"}</div></TD>
                  <TD><Badge color={C.blue}>{h.action}</Badge></TD>
                  <TD>{h.detail}</TD>
                  <TD><span style={{ fontWeight:700, color:h.montant !== 0 ? (h.montant > 0 ? C.gold : C.danger) : C.muted }}>{h.montant !== 0 ? (h.montant > 0 ? "" : "- ") + fmt(Math.abs(h.montant)) : "—"}</span></TD>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        )
      }
    </div>
  );
};
