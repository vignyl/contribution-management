import React from "react";
import { useApp } from "../../context/AppContext";
import { C, INP, LBL } from "../../utils";
import { Btn } from "../ui";

export const Login = () => {
  const { loginU, setLoginU, loginP, setLoginP, loginErr, doLogin } = useApp();

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input::placeholder{color:#5a6478}`}</style>
      <div style={{ width:400, maxWidth:"95vw" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:42, fontWeight:900, background:`linear-gradient(135deg,${C.accent},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:6, marginBottom:6 }}>AFAY</div>
          <div style={{ fontSize:11, color:C.muted, letterSpacing:2 }}>SYSTÈME DE GESTION FINANCIÈRE</div>
        </div>
        <div style={{ background:C.card, borderRadius:18, padding:"32px 28px", border:`1px solid ${C.border}`, boxShadow:"0 24px 80px rgba(0,0,0,.6)" }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:24, textAlign:"center" }}>🔐 Connexion</div>
          <div style={{ marginBottom:14 }}>
            <label style={LBL}>Nom d'utilisateur</label>
            <input style={{ ...INP, fontSize:14 }} type="text" placeholder="afay-username" autoFocus
              value={loginU} onChange={e => setLoginU(e.target.value)}
              onKeyDown={e => e.key==="Enter" && doLogin()} />
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={LBL}>Mot de passe</label>
            <input style={{ ...INP, fontSize:14 }} type="password" placeholder="••••••••"
              value={loginP} onChange={e => setLoginP(e.target.value)}
              onKeyDown={e => e.key==="Enter" && doLogin()} />
          </div>
          {loginErr && <div style={{ color:C.danger, fontSize:12, marginBottom:12, padding:"8px 12px", background:`${C.danger}18`, borderRadius:8, border:`1px solid ${C.danger}44` }}>⚠️ {loginErr}</div>}
          <Btn bg={C.accent} style={{ width:"100%", marginTop:8, padding:"11px", fontSize:14 }} onClick={doLogin}>Se connecter →</Btn>
        </div>
      </div>
    </div>
  );
};
