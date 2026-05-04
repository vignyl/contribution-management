import React from "react";
import { C } from "../../utils";

export const Loading = () => {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, color:C.text }}>
      <div style={{ fontSize:30, fontWeight:900, color:C.accent, letterSpacing:4 }}>AFAY</div>
      <div style={{ width:34, height:34, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
