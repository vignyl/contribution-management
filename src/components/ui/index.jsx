import React from "react";
import { C } from "../../utils";

export const Btn = ({ bg=C.accent, sm, xs, children, onClick, disabled, style={} }) =>
  <button disabled={disabled} onClick={onClick} style={{ padding:xs?"3px 8px":sm?"6px 12px":"9px 20px", borderRadius:7, border:"none", cursor:disabled?"not-allowed":"pointer", fontWeight:700, fontSize:xs?10:sm?11:13, background:disabled?"#333":bg, color:"#fff", opacity:disabled?0.5:1, whiteSpace:"nowrap", ...style }}>{children}</button>;

export const Badge = ({ color, children }) =>
  <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, color:"#fff", background:color+"cc" }}>{children}</span>;

export const Card = ({ children, style={} }) =>
  <div style={{ background:C.card, borderRadius:14, padding:"20px 24px", border:`1px solid ${C.border}`, boxShadow:"0 4px 24px rgba(0,0,0,0.3)", ...style }}>{children}</div>;

export const TH = ({ ch }) =>
  <th style={{ textAlign:"left", padding:"10px 14px", background:"rgba(255,255,255,0.03)", color:C.muted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.7, borderBottom:`1px solid ${C.border}` }}>{ch}</th>;

export const TD = ({ children, s={} }) =>
  <td style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, verticalAlign:"middle", ...s }}>{children}</td>;

export const SectionLabel = ({ label }) =>
  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.muted, borderBottom:`1px solid ${C.border}`, paddingBottom:8, marginBottom:14, marginTop:22 }}>{label}</div>;

export const FilterBar = ({ options, value, onChange }) => (
  <div style={{ display:"flex", gap:5, marginBottom:14, flexWrap:"wrap" }}>
    {options.map(opt => (
      <button key={opt.value} onClick={() => onChange(opt.value)} style={{
        padding:"5px 13px", borderRadius:20,
        border:`1px solid ${value===opt.value ? C.accent : C.border}`,
        cursor:"pointer", fontSize:11, fontWeight:700,
        background: value===opt.value ? C.accent : "transparent",
        color: value===opt.value ? "#fff" : C.muted,
      }}>{opt.label}</button>
    ))}
  </div>
);

export const SHdr = ({ title, printFn, printLabel="🖨️ Rapport", printFn2, printLabel2, onAdd, addLabel }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
    <div style={{ fontSize:20, fontWeight:700 }}>{title}</div>
    <div style={{ display:"flex", gap:8 }}>
      {printFn  && <Btn bg="rgba(255,255,255,0.07)" onClick={printFn}>{printLabel}</Btn>}
      {printFn2 && <Btn bg="rgba(255,255,255,0.07)" onClick={printFn2}>{printLabel2}</Btn>}
      {onAdd    && <Btn bg={C.accent} onClick={onAdd}>{addLabel}</Btn>}
    </div>
  </div>
);
