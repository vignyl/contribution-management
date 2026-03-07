import { useState, useMemo, useEffect, useCallback, useRef } from "react";

/* ── Utilitaires ─────────────────────────────────────────────────────────── */
const fmt    = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0)) + " FCFA";
const tod    = () => new Date().toISOString().split("T")[0];
const nowLbl = () => new Date().toLocaleString("fr-FR");
const add3M  = (d) => { const x = new Date(d); x.setMonth(x.getMonth()+3); return x.toISOString().split("T")[0]; };
const dLeft  = (d) => Math.ceil((new Date(d) - new Date()) / 864e5);
const uid    = () => Date.now() + Math.floor(Math.random()*9999);
const SEUIL  = 40000;

// Calcule le montant dû au remboursement avec intérêts composés (+10% par tranche de 90 jours)
// Période 1 : 0–89 jours   → montant × 1.1
// Période 2 : 90–179 jours → montant × 1.1²   etc.
const calcMontantActuel = (loan, dateStr) => {
  const start   = new Date(loan.date);
  const end     = new Date(dateStr || tod());
  const days    = Math.max(0, Math.round((end - start) / 864e5));
  const periods = Math.floor(days / 90) + 1;          // min 1 période
  const montantDu  = loan.montant * Math.pow(1.1, periods);
  const interets   = montantDu - loan.montant;
  const fraisAsso  = interets * 0.2;                  // 20 % des intérêts → asso (équiv. 2%/10% du montant)
  const gainMbr    = interets * 0.8;                  // 80 % → membres
  return { montantDu, interets, fraisAsso, gainMbr, periods };
};

const C = {
  bg:"#080918", card:"#0f1024", card2:"#151630",
  accent:"#e94560", gold:"#f5a623", green:"#27ae60",
  blue:"#2980b9", danger:"#c0392b", warn:"#e67e22",
  purple:"#8e44ad", teal:"#16a085",
  muted:"#5a6478", text:"#dde3f0", border:"rgba(255,255,255,0.08)",
};
const INP = { background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 14px", color:C.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" };
const LBL = { fontSize:11, color:C.muted, display:"block", marginBottom:5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6 };
const FR  = { marginBottom:15 };

/* ── Composants atomiques ────────────────────────────────────────────────── */
const Btn = ({ bg=C.accent, sm, xs, children, onClick, disabled, style={} }) =>
  <button disabled={disabled} onClick={onClick} style={{ padding:xs?"3px 8px":sm?"6px 12px":"9px 20px", borderRadius:7, border:"none", cursor:disabled?"not-allowed":"pointer", fontWeight:700, fontSize:xs?10:sm?11:13, background:disabled?"#333":bg, color:"#fff", opacity:disabled?0.5:1, whiteSpace:"nowrap", ...style }}>{children}</button>;

const Badge = ({ color, children }) =>
  <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, color:"#fff", background:color+"cc" }}>{children}</span>;

const Card = ({ children, style={} }) =>
  <div style={{ background:C.card, borderRadius:14, padding:"20px 24px", border:`1px solid ${C.border}`, boxShadow:"0 4px 24px rgba(0,0,0,0.3)", ...style }}>{children}</div>;

const TH = ({ ch }) =>
  <th style={{ textAlign:"left", padding:"10px 14px", background:"rgba(255,255,255,0.03)", color:C.muted, fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.7, borderBottom:`1px solid ${C.border}` }}>{ch}</th>;

const TD = ({ children, s={} }) =>
  <td style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`, verticalAlign:"middle", ...s }}>{children}</td>;

const SectionLabel = ({ label }) =>
  <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:C.muted, borderBottom:`1px solid ${C.border}`, paddingBottom:8, marginBottom:14, marginTop:22 }}>{label}</div>;

/* ── Impression ──────────────────────────────────────────────────────────── */
const doPrint = (title, body) => {
  const w = window.open("","_blank");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>AFAY – ${title}</title><style>
    *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#111;padding:28px}
    .hdr{display:flex;justify-content:space-between;border-bottom:3px solid #e94560;padding-bottom:12px;margin-bottom:22px}
    .logo{font-size:26px;font-weight:900;color:#e94560;letter-spacing:4px}.sub{font-size:11px;color:#777;margin-top:3px}
    .meta{text-align:right;font-size:12px;color:#666}h2{font-size:15px;margin:18px 0 10px;border-left:4px solid #e94560;padding-left:10px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px}
    th{background:#f2f2f8;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#444;border-bottom:2px solid #ddd}
    td{padding:8px 12px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#fafafa}
    .sg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
    .sb{border:1px solid #ddd;border-radius:8px;padding:12px}.sv{font-size:17px;font-weight:800;color:#e94560;margin-bottom:3px}
    .sl{font-size:10px;color:#888;text-transform:uppercase}
    .ok{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#d5f5e3;color:#1a6b3c;font-weight:700}
    .ko{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#fde8e8;color:#922b21;font-weight:700}
    .wa{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;background:#fef5e4;color:#9a5a00;font-weight:700}
    .bw{background:#eee;border-radius:3px;height:7px}.bf{background:#e94560;border-radius:3px;height:7px}
    .ft{margin-top:28px;font-size:10px;color:#bbb;border-top:1px solid #eee;padding-top:10px;text-align:center}
    @media print{body{padding:12px}}
  </style></head><body>
  <div class="hdr"><div><div class="logo">AFAY</div><div class="sub">Système de Gestion Financière</div></div>
  <div class="meta"><strong>${title}</strong><br>Généré le ${nowLbl()}</div></div>
  ${body}
  <div class="ft">AFAY — Document généré automatiquement — ${nowLbl()}</div>
  </body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); }, 350);
};

/* ── Clés de stockage ────────────────────────────────────────────────────── */
const SK = {
  members:"afay:members", loans:"afay:loans", assist:"afay:assist",
  history:"afay:history", fondsAsso:"afay:fondsAsso",
  cotisations:"afay:cotisations", dismissed:"afay:dismissed",
  sanctions:"afay:sanctions", sorties:"afay:sorties",
};

/* ══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [ready,       setReady]       = useState(false);
  const [tab,         setTab]         = useState("dashboard");
  const [cotisSubTab, setCotisSubTab] = useState("tous");
  const [members,     setMembers]     = useState([]);
  const [loans,       setLoans]       = useState([]);
  const [assist,      setAssist]      = useState([]);
  const [history,     setHistory]     = useState([]);
  const [fondsAsso,   setFondsAsso]   = useState(0);
  const [cotisations, setCotisations] = useState([]);
  const [dismissed,   setDismissed]   = useState([]);
  const [sanctions,   setSanctions]   = useState([]);
  const [sorties,     setSorties]     = useState([]);
  const [modal,       setModal]       = useState(null);
  const [parentModal, setParentModal] = useState(null);
  const [form,        setForm]        = useState({});
  const [editFA,      setEditFA]      = useState(false);
  const [editFAV,     setEditFAV]     = useState("");
  const [importData,  setImportData]  = useState(null);
  const [importConf,  setImportConf]  = useState([]);
  const [importStep,  setImportStep]  = useState(0);
  const fileRef = useRef();

  /* ── Chargement ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const load = async (k) => {
        try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
        catch { return null; }
      };
      const [m,l,a,h,f,c,d,s,so] = await Promise.all([
        load(SK.members), load(SK.loans),   load(SK.assist),   load(SK.history),
        load(SK.fondsAsso), load(SK.cotisations), load(SK.dismissed),
        load(SK.sanctions), load(SK.sorties),
      ]);
      if (m)  setMembers(m);      if (l)  setLoans(l);       if (a)  setAssist(a);
      if (h)  setHistory(h);      if (f!=null) setFondsAsso(f);
      if (c)  setCotisations(c);  if (d)  setDismissed(d);
      if (s)  setSanctions(s);    if (so) setSorties(so);
      setReady(true);
    })();
  }, []);

  /* ── Sauvegarde auto ────────────────────────────────────────────────────── */
  const save = useCallback(async (k,v) => {
    try { await window.storage.set(k, JSON.stringify(v)); } catch {}
  }, []);
  useEffect(() => { if (ready) save(SK.members,     members);     }, [members,     ready]);
  useEffect(() => { if (ready) save(SK.loans,       loans);       }, [loans,       ready]);
  useEffect(() => { if (ready) save(SK.assist,      assist);      }, [assist,      ready]);
  useEffect(() => { if (ready) save(SK.history,     history);     }, [history,     ready]);
  useEffect(() => { if (ready) save(SK.fondsAsso,   fondsAsso);   }, [fondsAsso,   ready]);
  useEffect(() => { if (ready) save(SK.cotisations, cotisations); }, [cotisations, ready]);
  useEffect(() => { if (ready) save(SK.dismissed,   dismissed);   }, [dismissed,   ready]);
  useEffect(() => { if (ready) save(SK.sanctions,   sanctions);   }, [sanctions,   ready]);
  useEffect(() => { if (ready) save(SK.sorties,     sorties);     }, [sorties,     ready]);

  /* ── Dérivés ────────────────────────────────────────────────────────────── */
  const totFR    = useMemo(() => members.reduce((s,m) => s+m.fondsRoulement, 0), [members]);
  const totFC    = useMemo(() => members.reduce((s,m) => s+m.fondsCaisse,    0), [members]);
  const actLoans = useMemo(() => loans.filter(l => l.status==="actif"),          [loans]);
  const totDette = useMemo(() => actLoans.reduce((s,l) => s+l.montantDu, 0),    [actLoans]);
  const totGains = useMemo(() => loans.filter(l=>l.status==="rembourse").reduce((s,l)=>s+l.interets,0), [loans]);

  const membersX = useMemo(() => members.map(m => ({
    ...m,
    prorata:   totFR > 0 ? (m.fondsRoulement / totFR) * 100 : 0,
    aJour:     m.fondsCaisse >= SEUIL,
    droitPret: !assist.some(a => a.assistantId===m.id && loans.some(l=>l.id===a.loanId && l.status==="actif")),
    loanActif: actLoans.find(l => l.emprunteurId===m.id),
  })), [members, totFR, assist, actLoans, loans]);

  const alerts = useMemo(() => {
    const r = [];
    actLoans.forEach(l => {
      const d = dLeft(l.echeance), m = members.find(x=>x.id===l.emprunteurId);
      if (d<=30) r.push({ key:`loan-${l.id}`, t:d<=0?"danger":"warn",
        msg:`${m?.name} — ${d<=0?`RETARD ${Math.abs(d)}j`:`Échéance dans ${d}j`} (${l.echeance})`, amt:fmt(l.montantDu) });
    });
    members.filter(m=>m.fondsCaisse<SEUIL).forEach(m =>
      r.push({ key:`caisse-${m.id}`, t:"info",
        msg:`${m.name} — Fonds de Caisse insuffisant (${fmt(m.fondsCaisse)} / ${fmt(SEUIL)} requis)` })
    );
    sanctions.filter(s=>s.status==="en_attente").forEach(s => {
      const m = members.find(x=>x.id===s.memberId);
      if (m) r.push({ key:`sanction-${s.id}`, t:"warn", msg:`⚠️ Sanction en attente — ${m.name} : ${s.raison} (${fmt(s.montant)})` });
    });
    return r;
  }, [actLoans, members, sanctions]);

  const visibleAlerts = useMemo(() => alerts.filter(a=>!dismissed.includes(a.key)), [alerts, dismissed]);

  /* ── Helpers modales ────────────────────────────────────────────────────── */
  const pushH = (action, detail, montant=0, dt=null) =>
    setHistory(h => [{ id:uid(), date:dt||tod(), heure:new Date().toLocaleTimeString("fr-FR"), action, detail, montant }, ...h]);

  const openSub = (type, data={}) => { setParentModal(modal); setModal({type,data}); setForm({date:tod(),...data}); };
  const openM   = (type, data={}) => { setParentModal(null);  setModal({type,data}); setForm({date:tod(),...data}); };
  const closeM  = () => {
    if (parentModal) { setModal(parentModal); setForm({date:tod(),...parentModal.data}); setParentModal(null); }
    else             { setModal(null); setForm({}); }
  };
  const closeAll = () => { setModal(null); setParentModal(null); setForm({}); };
  const dismissAlert = (key) => setDismissed(d => d.includes(key)?d:[...d,key]);
  const sf = (k) => (v) => setForm(f => ({...f, [k]: v}));

  /* ── CRUD Membres ───────────────────────────────────────────────────────── */
  const doAddMember = () => {
    if (!form.name?.trim()) return;
    setMembers(ms => [...ms, { id:uid(), name:form.name.trim(), ville:(form.ville||"").trim(), telephone:(form.telephone||"").trim(), fondsCaisse:0, fondsRoulement:0 }]);
    pushH("Nouveau membre", form.name.trim());
    closeM();
  };
  const doEditMember = () => {
    if (!form.name?.trim()) return;
    const id = parseInt(form.memberId);
    setMembers(ms => ms.map(m => m.id===id ? {...m, name:form.name.trim(), ville:(form.ville||"").trim(), telephone:(form.telephone||"").trim()} : m));
    pushH("Modif. Membre", form.name.trim());
    closeM();
  };
  const doDeleteMember = (id) => {
    const mb = members.find(m=>m.id===id);
    if (loans.some(l=>l.emprunteurId===id&&l.status==="actif")) { alert(`Impossible — ${mb?.name} a un prêt actif.`); return; }
    if (!window.confirm(`Supprimer ${mb?.name} et toutes ses données ?`)) return;
    setMembers(ms=>ms.filter(m=>m.id!==id));
    setLoans(ls=>ls.filter(l=>l.emprunteurId!==id));
    setCotisations(cs=>cs.filter(c=>c.memberId!==id));
    setAssist(as=>as.filter(a=>a.assistantId!==id));
    setSanctions(ss=>ss.filter(s=>s.memberId!==id));
    pushH("Suppression Membre", mb?.name||"");
  };

  /* ── CRUD Cotisations ───────────────────────────────────────────────────── */
  const doAddCotisation = () => {
    const mid = parseInt(form.memberId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m=>m.id===mid);
    if (!mb||!form.type||!montant||montant<=0) { alert("Remplissez tous les champs."); return; }
    const cot = { id:uid(), memberId:mid, type:form.type, montant, date, heure:new Date().toLocaleTimeString("fr-FR") };
    setCotisations(cs=>[...cs, cot]);
    setMembers(ms=>ms.map(m=>m.id!==mid?m : form.type==="caisse" ? {...m,fondsCaisse:m.fondsCaisse+montant} : {...m,fondsRoulement:m.fondsRoulement+montant}));
    setHistory(h=>[{id:uid(),date,heure:new Date().toLocaleTimeString("fr-FR"),
      action:`Cotisation ${form.type==="caisse"?"Fonds de Caisse":"Fonds de Roulement"}`, detail:mb.name, montant},...h]);
    closeM();
  };
  const doEditCotisation = () => {
    const cotId = parseInt(form.cotisId), old = cotisations.find(c=>c.id===cotId);
    if (!old) return;
    if (old.auto) { alert("Entrée générée automatiquement — non modifiable."); closeM(); return; }
    const newM=parseFloat(form.montant), newT=form.type, newD=form.date||tod();
    if (!newT||!newM||newM<=0) return;
    const mb = members.find(m=>m.id===old.memberId);
    const dc = (newT==="caisse"?newM:0) - (old.type==="caisse"?old.montant:0);
    const dr = (newT==="roulement"?newM:0) - (old.type==="roulement"?old.montant:0);
    setMembers(ms=>ms.map(m=>m.id===old.memberId?{...m,fondsCaisse:m.fondsCaisse+dc,fondsRoulement:m.fondsRoulement+dr}:m));
    setCotisations(cs=>cs.map(c=>c.id===cotId?{...c,type:newT,montant:newM,date:newD}:c));
    pushH("Modif. Cotisation",`${mb?.name} — ${newT} ${fmt(newM)}`,newM,newD);
    closeM();
  };
  const doDeleteCotisation = (cotId) => {
    const c = cotisations.find(x=>x.id===cotId); if(!c) return;
    if (c.auto) { alert("Entrée auto — supprimez le prêt associé pour la retirer."); return; }
    const mb = members.find(m=>m.id===c.memberId);
    if (!window.confirm(`Supprimer ce versement de ${fmt(c.montant)} ?`)) return;
    setMembers(ms=>ms.map(m=>m.id!==c.memberId?m:{...m,
      fondsCaisse:    c.type==="caisse"    ? m.fondsCaisse    - c.montant : m.fondsCaisse,
      fondsRoulement: c.type==="roulement" ? m.fondsRoulement - c.montant : m.fondsRoulement,
    }));
    setCotisations(cs=>cs.filter(x=>x.id!==cotId));
    pushH("Suppression Cotisation",`${mb?.name} — ${c.type} ${fmt(c.montant)}`);
  };

  /* ── CRUD Prêts ─────────────────────────────────────────────────────────── */
  const calcContribs = (currentMembers, loanMontant) => {
    const t = currentMembers.reduce((s,m) => s+m.fondsRoulement, 0);
    return currentMembers.map(m => ({
      memberId: m.id,
      pct: t>0 ? m.fondsRoulement/t : 0,
      montantContrib: t>0 ? (m.fondsRoulement/t)*loanMontant : 0,
    }));
  };

  const doAddLoan = () => {
    try {
      const rawId   = form.emprunteurId;
      const montant = parseFloat(form.montant);
      const date    = form.date || tod();

      if (!rawId || rawId === "")   { alert("Sélectionnez un emprunteur."); return; }
      if (isNaN(montant)||montant<=0){ alert("Montant invalide."); return; }

      // Recherche de l'emprunteur en comparant les IDs comme chaînes (évite tout piège number/string)
      const empr = members.find(m => `${m.id}` === `${rawId}`);
      if (!empr) { alert(`Emprunteur ID "${rawId}" introuvable. Membres : ${members.map(m=>m.id).join(",")}`); return; }

      const emprId    = empr.id;
      const rawAssist = form.assistantId;
      const assistMb  = rawAssist && rawAssist !== "" ? members.find(m => `${m.id}` === `${rawAssist}`) : null;
      const assistId  = assistMb ? assistMb.id : null;

      const interets  = montant * 0.1;
      const fraisAsso = montant * 0.02;
      const gainMbr   = montant * 0.08;

      // Snapshot prorata depuis members (source directe, pas membersX)
      const totalFR   = members.reduce((s, m) => s + (m.fondsRoulement || 0), 0);
      const contribs  = members.map(m => {
        const fr = m.fondsRoulement || 0;
        const pct = totalFR > 0 ? fr / totalFR : 1 / members.length;
        return { memberId: m.id, pct, montantContrib: pct * montant };
      });

      const loanId = uid();
      const now    = new Date().toLocaleTimeString("fr-FR");

      const newLoan = {
        id: loanId, emprunteurId: emprId, montant, interets,
        montantDu: montant + interets, fraisAsso, gainMbr,
        date, echeance: add3M(date), status: "actif",
        assistantId: assistId, contributions: contribs,
      };

      // 1. Enregistrer le prêt
      setLoans(prev => [...prev, newLoan]);
      // 2. Assistant
      if (assistId) setAssist(prev => [...prev, { assistantId: assistId, loanId }]);
      // 3. Déduire du fonds de roulement
      setMembers(prev => prev.map(m => {
        const c = contribs.find(x => x.memberId === m.id);
        return c ? { ...m, fondsRoulement: (m.fondsRoulement || 0) - c.montantContrib } : m;
      }));
      // 4. Lignes auto cotisation
      const t0 = uid();
      const cotisDebits = contribs.map((c, i) => ({
        id: t0 + i, memberId: c.memberId,
        type: "roulement", direction: "debit", auto: true, loanId,
        label: "Contribution prêt", montant: c.montantContrib, date, heure: now,
      }));
      setCotisations(prev => [...prev, ...cotisDebits]);
      // 5. Historique
      pushH("Prêt accordé", `${empr.name}${assistMb ? ` (Asst: ${assistMb.name})` : ""}`, montant);
      // 6. Fermer et aller sur l'onglet Prêts pour confirmer visuellement
      setModal(null); setParentModal(null); setForm({});
      setTab("prets");
    } catch(err) {
      alert(`Erreur lors de l'enregistrement du prêt : ${err.message}`);
    }
  };

  const doEditLoan = () => {
    const loanId = parseInt(form.loanId);
    const old    = loans.find(l => l.id === loanId); if (!old) return;
    const newM   = parseFloat(form.montant);
    const newDate = form.date || tod();
    const newAssistId = form.assistantId ? parseInt(form.assistantId) : null;
    if (!newM || newM <= 0) { alert("Montant invalide."); return; }

    const newI = newM*0.1, newFA = newM*0.02, newGM = newM*0.08;
    const now  = new Date().toLocaleTimeString("fr-FR");

    if (old.status === "actif") {
      // Restituer l'ancienne contribution, puis appliquer la nouvelle
      const restored = members.map(m => {
        const c = (old.contributions||[]).find(x=>x.memberId===m.id);
        return c ? {...m, fondsRoulement: m.fondsRoulement + c.montantContrib} : m;
      });
      const newContribs = calcContribs(restored, newM);
      setMembers(restored.map(m => {
        const c = newContribs.find(x=>x.memberId===m.id);
        return c ? {...m, fondsRoulement: m.fondsRoulement - c.montantContrib} : m;
      }));
      // Remplacer les lignes auto-débit
      const newDebits = newContribs.filter(c=>c.montantContrib>0).map((c,i) => ({
        id:uid()+i, memberId:c.memberId, type:"roulement", direction:"debit",
        auto:true, loanId, label:"Contribution prêt (modifié)", montant:c.montantContrib, date:newDate, heure:now,
      }));
      setCotisations(cs => [...cs.filter(c=>!(c.loanId===loanId&&c.direction==="debit")), ...newDebits]);
      setLoans(ls => ls.map(l => l.id===loanId ? {...l,montant:newM,interets:newI,montantDu:newM+newI,fraisAsso:newFA,gainMbr:newGM,date:newDate,echeance:add3M(newDate),assistantId:newAssistId,contributions:newContribs} : l));
    } else {
      setLoans(ls => ls.map(l => l.id===loanId ? {...l,montant:newM,interets:newI,montantDu:newM+newI,fraisAsso:newFA,gainMbr:newGM,date:newDate,echeance:add3M(newDate)} : l));
    }

    setAssist(as => { const f=as.filter(a=>a.loanId!==loanId); return newAssistId?[...f,{assistantId:newAssistId,loanId}]:f; });
    pushH("Modif. Prêt", `#${loanId} → ${fmt(newM)}`, newM);
    closeM();
  };

  const doDeleteLoan = (loanId) => {
    const loan = loans.find(l=>l.id===loanId); if (!loan) return;
    const empr = members.find(m=>m.id===loan.emprunteurId);
    if (!window.confirm(`Supprimer le prêt ${loan.status==="actif"?"ACTIF ⚠️":"remboursé"} de ${fmt(loan.montant)} — ${empr?.name} ?`)) return;
    if (loan.status === "actif") {
      setMembers(ms => ms.map(m => {
        const c = (loan.contributions||[]).find(x=>x.memberId===m.id);
        return c ? {...m, fondsRoulement: m.fondsRoulement + c.montantContrib} : m;
      }));
      setCotisations(cs => cs.filter(c => c.loanId !== loanId));
      setAssist(as => as.filter(a => a.loanId !== loanId));
    }
    setLoans(ls => ls.filter(l=>l.id!==loanId));
    pushH("Suppression Prêt", `${empr?.name} — ${fmt(loan.montant)}`);
  };

  const doRepay = (loanId, repayDate) => {
    const loan = loans.find(l => l.id === loanId); if (!loan) return;
    const date = repayDate || tod();
    const now  = new Date().toLocaleTimeString("fr-FR");

    // Intérêts composés selon la date de remboursement réelle
    const { montantDu, interets, fraisAsso, gainMbr } = calcMontantActuel(loan, date);

    const contribs = loan.contributions || [];
    if (contribs.length === 0) {
      // Fallback legacy : redistribuer au prorata actuel
      setMembers(ms => {
        const t = ms.reduce((s,m) => s+m.fondsRoulement, 0);
        return ms.map(m => ({ ...m, fondsRoulement: m.fondsRoulement + (t>0?(m.fondsRoulement/t)*gainMbr:0) }));
      });
    } else {
      // Retour contribution initiale + gains au prorata snapshot
      const retours = contribs.map((c, i) => {
        const retour = c.montantContrib + c.pct * gainMbr;
        return {
          memberId: c.memberId, montant: retour,
          cot: { id:uid()+i, memberId:c.memberId, type:"roulement", direction:"credit",
                 auto:true, loanId, label:`Retour prêt + gains (${interets>0?"+"+Math.round(interets)+" FCFA d'intérêts":""})`,
                 montant: retour, date, heure: now },
        };
      });
      setMembers(ms => ms.map(m => {
        const r = retours.find(x => x.memberId === m.id);
        return r ? { ...m, fondsRoulement: m.fondsRoulement + r.montant } : m;
      }));
      setCotisations(cs => [...cs, ...retours.map(r => r.cot)]);
    }

    setFondsAsso(f => f + fraisAsso);
    setLoans(ls => ls.map(l => l.id===loanId
      ? { ...l, status:"rembourse", dateRembours: date, montantRembourse: montantDu, interetsRembourse: interets }
      : l
    ));
    setAssist(as => as.filter(a => a.loanId !== loanId));
    const empr = members.find(m => m.id === loan.emprunteurId);
    pushH("Remboursement", `${empr?.name} — Intérêts: ${fmt(interets)} | Gains mbr: ${fmt(gainMbr)} | Asso: ${fmt(fraisAsso)}`, montantDu, date);
    closeM();
  };

  /* ── CRUD Sanctions ─────────────────────────────────────────────────────── */
  const doAddSanction = () => {
    const memberId = parseInt(form.memberId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m=>m.id===memberId);
    if (!mb)          { alert("Sélectionnez un membre."); return; }
    if (!montant||montant<=0) { alert("Montant invalide."); return; }
    if (!form.raison?.trim()) { alert("La raison est obligatoire."); return; }
    setSanctions(ss => [...ss, { id:uid(), memberId, montant, date, raison:form.raison.trim(), status:"en_attente" }]);
    pushH("Sanction créée", `${mb.name} — ${form.raison.trim()}`, montant);
    closeM();
  };
  const doEditSanction = () => {
    const id = parseInt(form.sancId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m=>m.id===parseInt(form.memberId));
    if (!mb||!montant||montant<=0||!form.raison?.trim()) { alert("Remplissez tous les champs."); return; }
    setSanctions(ss => ss.map(s => s.id===id ? {...s, memberId:parseInt(form.memberId), montant, date, raison:form.raison.trim()} : s));
    pushH("Modif. Sanction", `${mb.name} — ${form.raison.trim()}`, montant);
    closeM();
  };
  const doDeleteSanction = (id) => {
    const s = sanctions.find(x=>x.id===id); if (!s) return;
    const mb = members.find(m=>m.id===s.memberId);
    if (s.status==="payee") { alert("Sanction déjà remboursée — impossible à supprimer."); return; }
    if (!window.confirm(`Supprimer la sanction de ${fmt(s.montant)} pour ${mb?.name} ?`)) return;
    setSanctions(ss=>ss.filter(x=>x.id!==id));
    pushH("Suppression Sanction", `${mb?.name} — ${s.raison}`);
  };
  const doPaySanction = (id) => {
    const s = sanctions.find(x=>x.id===id); if (!s||s.status==="payee") return;
    const mb = members.find(m=>m.id===s.memberId);
    setSanctions(ss=>ss.map(x=>x.id===id?{...x,status:"payee",datePaiement:tod()}:x));
    setFondsAsso(f => f + s.montant);
    pushH("Sanction remboursée", `${mb?.name} — ${s.raison} → Fonds Asso +${fmt(s.montant)}`, s.montant);
    // Retirer l'alerte associée
    setDismissed(d => d.includes(`sanction-${id}`) ? d : [...d, `sanction-${id}`]);
  };

  /* ── CRUD Sorties ───────────────────────────────────────────────────────── */
  const doAddSortie = () => {
    const montant = parseFloat(form.montant), date = form.date || tod();
    if (isNaN(montant) || montant <= 0) { alert("Montant invalide."); return; }
    if (!form.raison?.trim())           { alert("La raison est obligatoire."); return; }
    if (!form.source)                   { alert("Sélectionnez la source (Fonds Caisse ou Fonds Asso)."); return; }

    const source = form.source;

    if (source === "caisse") {
      // Sélection de membres obligatoire
      const selIds = form.sortieMembers || [];
      if (selIds.length === 0) { alert("Choisissez au moins un membre concerné par cette sortie."); return; }
      const partParMembre = montant / selIds.length;

      // Déduire équitablement — solde négatif autorisé
      setMembers(ms => ms.map(m => {
        if (!selIds.some(id => `${id}` === `${m.id}`)) return m;
        return { ...m, fondsCaisse: (m.fondsCaisse || 0) - partParMembre };
      }));

      const sortie = {
        id: uid(), montant, date, raison: form.raison.trim(), source,
        heure: new Date().toLocaleTimeString("fr-FR"),
        memberIds: selIds.map(id => members.find(m => `${m.id}` === `${id}`)?.id).filter(Boolean),
        partParMembre,
        nbMembres: selIds.length,
      };
      setSorties(ss => [...ss, sortie]);
      pushH("Sortie Fonds Caisse", `${selIds.length} membre(s) — ${fmt(partParMembre)}/mbr — ${form.raison.trim()}`, montant);

    } else {
      // Fonds Asso — pas de sélection de membres
      if (montant > fondsAsso) { alert(`Solde insuffisant. Fonds Association : ${fmt(fondsAsso)}`); return; }
      setFondsAsso(f => f - montant);
      const sortie = {
        id: uid(), montant, date, raison: form.raison.trim(), source,
        heure: new Date().toLocaleTimeString("fr-FR"),
      };
      setSorties(ss => [...ss, sortie]);
      pushH("Sortie Fonds Association", form.raison.trim(), montant);
    }
    closeM();
  };

  const doDeleteSortie = (id) => {
    const s = sorties.find(x => x.id === id); if (!s) return;
    if (!window.confirm(`Annuler et RECRÉDITER ${fmt(s.montant)} ?`)) return;
    if (s.source === "caisse") {
      // Recréditer uniquement les membres concernés (stocker dans memberIds)
      const ids   = s.memberIds || members.map(m => m.id);
      const part  = s.partParMembre || (s.montant / ids.length);
      setMembers(ms => ms.map(m => {
        if (!ids.some(x => `${x}` === `${m.id}`)) return m;
        return { ...m, fondsCaisse: (m.fondsCaisse || 0) + part };
      }));
    } else {
      setFondsAsso(f => f + s.montant);
    }
    setSorties(ss => ss.filter(x => x.id !== id));
    pushH("Annulation Sortie", s.raison, 0);
  };

  const doClearData = () => {
    if (!window.confirm("⚠️ Effacer TOUTES les données ? Irréversible.")) return;
    setMembers([]); setLoans([]); setAssist([]); setHistory([]);
    setFondsAsso(0); setCotisations([]); setDismissed([]); setSanctions([]); setSorties([]);
  };

  /* ── Export / Import ────────────────────────────────────────────────────── */
  const doExport = () => {
    const blob = new Blob([JSON.stringify({
      _afay_version:"1.2", _exported_label:nowLbl(),
      members, loans, assistance:assist, history, fondsAsso, cotisations, sanctions, sorties,
    },null,2)],{type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`AFAY_${tod()}.json`; a.click();
    pushH("Export",`${members.length} membres`);
  };
  const onFileChange = (e) => {
    const file=e.target.files?.[0]; if(!file) return; e.target.value="";
    const r=new FileReader();
    r.onload=(ev)=>{
      try {
        const raw=JSON.parse(ev.target.result);
        if (!raw._afay_version||!Array.isArray(raw.members)) throw new Error("Fichier non reconnu.");
        const cf=[];
        (raw.members||[]).forEach(m=>{if(members.find(x=>x.id===m.id))cf.push({type:"membre",imported:m,existing:members.find(x=>x.id===m.id)});});
        (raw.loans||[]).forEach(l=>{if(loans.find(x=>x.id===l.id))cf.push({type:"pret",imported:l,existing:loans.find(x=>x.id===l.id)});});
        setImportData(raw); setImportConf(cf); setImportStep(cf.length>0?2:1);
      } catch(err) { alert("Erreur : "+err.message); }
    };
    r.readAsText(file);
  };
  const doImportReplace = () => {
    if (!importData) return;
    setMembers(importData.members||[]); setLoans(importData.loans||[]);
    setAssist(importData.assistance||[]); setHistory(importData.history||[]);
    setFondsAsso(importData.fondsAsso||0); setCotisations(importData.cotisations||[]);
    setSanctions(importData.sanctions||[]); setSorties(importData.sorties||[]);
    pushH("Import (remplacement)",`${(importData.members||[]).length} membres`);
    setImportData(null); setImportConf([]); setImportStep(0);
  };
  const doImportMerge = () => {
    if (!importData) return;
    const exM=new Set(members.map(m=>m.id)),exL=new Set(loans.map(l=>l.id));
    const exC=new Set(cotisations.map(c=>c.id)),exA=new Set(assist.map(a=>`${a.assistantId}-${a.loanId}`));
    setMembers([...members,...(importData.members||[]).filter(m=>!exM.has(m.id))]);
    setLoans([...loans,...(importData.loans||[]).filter(l=>!exL.has(l.id))]);
    setCotisations([...cotisations,...(importData.cotisations||[]).filter(c=>!exC.has(c.id))]);
    setAssist([...assist,...(importData.assistance||[]).filter(a=>!exA.has(`${a.assistantId}-${a.loanId}`))]);
    if(importData.fondsAsso>0) setFondsAsso(f=>f+importData.fondsAsso);
    pushH("Import (fusion)",`membres importés`);
    setImportData(null); setImportConf([]); setImportStep(0);
  };

  /* ── Rapports ───────────────────────────────────────────────────────────── */
  const prtDash = () => doPrint("Tableau de Bord",
    `<div class="sg"><div class="sb"><div class="sv">${fmt(totFC)}</div><div class="sl">Fonds Caisse</div></div>
    <div class="sb"><div class="sv">${fmt(totFR)}</div><div class="sl">Fonds Roulement</div></div>
    <div class="sb"><div class="sv">${fmt(totDette)}</div><div class="sl">Prêts actifs</div></div>
    <div class="sb"><div class="sv">${fmt(fondsAsso)}</div><div class="sl">Fonds Association</div></div></div>
    <h2>Membres</h2>
    <table><thead><tr><th>Membre</th><th>Ville</th><th>Fonds Caisse</th><th>Fonds Roulement</th><th>Part%</th><th>Statut</th></tr></thead>
    <tbody>${membersX.map(m=>`<tr><td>${m.name}</td><td>${m.ville||"—"}</td><td>${fmt(m.fondsCaisse)}</td><td>${fmt(m.fondsRoulement)}</td><td>${m.prorata.toFixed(2)}%</td><td>${m.aJour?'<span class="ok">À jour</span>':'<span class="ko">Non à jour</span>'}</td></tr>`).join("")}</tbody></table>`);

  const prtSanctions = () => doPrint("Sanctions",
    `<div class="sg"><div class="sb"><div class="sv">${sanctions.length}</div><div class="sl">Total</div></div>
    <div class="sb"><div class="sv">${sanctions.filter(s=>s.status==="en_attente").length}</div><div class="sl">En attente</div></div>
    <div class="sb"><div class="sv">${fmt(sanctions.filter(s=>s.status==="payee").reduce((s,x)=>s+x.montant,0))}</div><div class="sl">Encaissé</div></div>
    <div class="sb"><div class="sv">${fmt(sanctions.filter(s=>s.status==="en_attente").reduce((s,x)=>s+x.montant,0))}</div><div class="sl">En attente (total)</div></div></div>
    <table><thead><tr><th>Date</th><th>Membre</th><th>Raison</th><th>Montant</th><th>Statut</th></tr></thead>
    <tbody>${[...sanctions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>{const mb=members.find(m=>m.id===s.memberId);return`<tr><td>${s.date}</td><td>${mb?.name||"?"}</td><td>${s.raison}</td><td><strong>${fmt(s.montant)}</strong></td><td>${s.status==="payee"?'<span class="ok">Payée</span>':'<span class="wa">En attente</span>'}</td></tr>`;}).join("")}</tbody></table>`);

  const prtSorties = () => doPrint("Sorties de Fonds",
    `<table><thead><tr><th>Date</th><th>Source</th><th>Raison</th><th>Montant</th></tr></thead>
    <tbody>${[...sorties].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>`<tr><td>${s.date}</td><td>${s.source==="caisse"?"Fonds Caisse":"Fonds Association"}</td><td>${s.raison}</td><td><strong>${fmt(s.montant)}</strong></td></tr>`).join("")}</tbody></table>`);

  const prtMember = (mb) => {
    const cots = [...cotisations].filter(c=>c.memberId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const lns  = [...loans].filter(l=>l.emprunteurId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const mX   = membersX.find(m=>m.id===mb.id)||mb;
    const totC = cots.filter(c=>c.type==="caisse"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    const totR = cots.filter(c=>c.type==="roulement"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    doPrint(`Fiche — ${mb.name}`,
      `<table><tbody>
        <tr><td><strong>Nom</strong></td><td>${mb.name}</td><td><strong>Ville</strong></td><td>${mb.ville||"—"}</td></tr>
        <tr><td><strong>Téléphone</strong></td><td>${mb.telephone||"—"}</td><td><strong>Part prorata</strong></td><td>${mX.prorata?.toFixed(2)||"0.00"}%</td></tr>
        <tr><td><strong>Fonds Caisse</strong></td><td>${fmt(mb.fondsCaisse)}</td><td><strong>Fonds Roulement</strong></td><td>${fmt(mb.fondsRoulement)}</td></tr>
      </tbody></table>
      <h2>Fonds de Caisse — ${cots.filter(c=>c.type==="caisse"&&!c.auto).length} versements — Total : ${fmt(totC)}</h2>
      <table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead>
      <tbody>${cots.filter(c=>c.type==="caisse"&&!c.auto).map(c=>`<tr><td>${c.date}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||`<tr><td colspan="3" style="color:#999">Aucun</td></tr>`}</tbody></table>
      <h2>Fonds de Roulement — ${cots.filter(c=>c.type==="roulement"&&!c.auto).length} versements — Total : ${fmt(totR)}</h2>
      <table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead>
      <tbody>${cots.filter(c=>c.type==="roulement"&&!c.auto).map(c=>`<tr><td>${c.date}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||`<tr><td colspan="3" style="color:#999">Aucun</td></tr>`}</tbody></table>
      <h2>Mouvements auto (prêts)</h2>
      <table><thead><tr><th>Date</th><th>Opération</th><th>Montant</th></tr></thead>
      <tbody>${cots.filter(c=>c.auto).map(c=>`<tr><td>${c.date}</td><td>${c.direction==="debit"?"📤 Contribution":"📥 Retour"} — ${c.label||""}</td><td>${c.direction==="debit"?"−":"+"}${fmt(c.montant)}</td></tr>`).join("")||`<tr><td colspan="3" style="color:#999">Aucun</td></tr>`}</tbody></table>
      <h2>Prêts — ${lns.length} au total</h2>
      <table><thead><tr><th>Date</th><th>Montant</th><th>Total Dû</th><th>Échéance</th><th>Statut</th></tr></thead>
      <tbody>${lns.map(l=>`<tr><td>${l.date}</td><td>${fmt(l.montant)}</td><td>${fmt(l.montantDu)}</td><td>${l.echeance}</td><td>${l.status==="actif"?'<span class="wa">En cours</span>':`<span class="ok">Remboursé ${l.dateRembours||""}</span>`}</td></tr>`).join("")||`<tr><td colspan="5" style="color:#999">Aucun</td></tr>`}</tbody></table>`
    );
  };

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  const SHdr = ({ title, printFn, onAdd, addLabel }) => (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div style={{ fontSize:20, fontWeight:700 }}>{title}</div>
      <div style={{ display:"flex", gap:8 }}>
        {printFn && <Btn bg="rgba(255,255,255,0.07)" onClick={printFn}>🖨️ Rapport</Btn>}
        {onAdd   && <Btn bg={C.accent} onClick={onAdd}>{addLabel}</Btn>}
      </div>
    </div>
  );

  const TABS = [
    {id:"dashboard",   label:"📊 Tableau de Bord"},
    {id:"membres",     label:"👥 Membres"},
    {id:"prets",       label:"💳 Prêts"},
    {id:"cotisations", label:"💰 Cotisations"},
    {id:"sanctions",   label:"⚠️ Sanctions"},
    {id:"sorties",     label:"📤 Sorties"},
    {id:"historique",  label:"📋 Historique"},
  ];

  if (!ready) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, color:C.text }}>
      <div style={{ fontSize:30, fontWeight:900, color:C.accent, letterSpacing:4 }}>AFAY</div>
      <div style={{ width:34, height:34, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.accent}`, borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Données temps réel modale détail ───────────────────────────────────── */
  const detailMbId   = modal?.type==="memberDetail" ? modal.data.memberId : null;
  const detailMb     = detailMbId ? membersX.find(m=>m.id===detailMbId) : null;
  const detailCotis  = detailMbId ? [...cotisations].filter(c=>c.memberId===detailMbId).sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
  const detailCotisC = detailCotis.filter(c=>c.type==="caisse"&&!c.auto);
  const detailCotisR = detailCotis.filter(c=>c.type==="roulement"&&!c.auto);
  const detailLoans  = detailMbId ? [...loans].filter(l=>l.emprunteurId===detailMbId).sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
  const editLoanObj  = modal?.type==="editLoan" ? loans.find(l=>l.id===parseInt(form.loanId)) : null;

  /* ════════════════════════ RENDU ═══════════════════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        select option{background:#0f1024;color:#dde3f0}
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.7);cursor:pointer}
        tr:hover td{background:rgba(255,255,255,0.018)}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.13);border-radius:3px}
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{ background:C.card, borderBottom:`2px solid ${C.accent}`, padding:"10px 22px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 4px 28px rgba(0,0,0,.55)" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, background:`linear-gradient(135deg,${C.accent},${C.gold})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:4 }}>AFAY</div>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:1 }}>SYSTÈME DE GESTION FINANCIÈRE</div>
        </div>
        <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:11, background:tab===t.id?C.accent:"rgba(255,255,255,0.05)", color:tab===t.id?"#fff":C.muted }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <input ref={fileRef} type="file" accept=".json" style={{ display:"none" }} onChange={onFileChange}/>
          <Btn bg="rgba(255,255,255,0.07)" sm onClick={()=>fileRef.current?.click()}>📥</Btn>
          <Btn bg={C.green} sm onClick={doExport} disabled={members.length===0}>📤</Btn>
          <Btn bg={C.danger} sm onClick={doClearData}>🗑️</Btn>
          <div style={{ display:"flex", alignItems:"center", gap:4, marginLeft:4 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:C.green, boxShadow:`0 0 5px ${C.green}` }}/>
            <span style={{ fontSize:9, color:C.muted }}>Sauvegardé</span>
          </div>
        </div>
      </div>

      <div style={{ padding:"20px 24px" }}>

        {/* Alertes */}
        {visibleAlerts.length>0 && (
          <div style={{ marginBottom:16 }}>
            {visibleAlerts.map(a=>(
              <div key={a.key} style={{ background:`${a.t==="danger"?C.danger:a.t==="warn"?C.warn:C.blue}18`, border:`1px solid ${a.t==="danger"?C.danger:a.t==="warn"?C.warn:C.blue}44`, borderRadius:10, padding:"9px 14px", marginBottom:6, display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
                <span>{a.t==="danger"?"🚨":a.t==="warn"?"⚠️":"ℹ️"}</span>
                <span style={{ flex:1 }}>{a.msg}</span>
                {a.amt&&<strong style={{ color:C.accent }}>{a.amt}</strong>}
                <button onClick={()=>dismissAlert(a.key)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:17, padding:"0 4px" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (
          <div>
            <SHdr title="📊 Tableau de Bord" printFn={prtDash}/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:18 }}>
              {[
                {icon:"🏦",label:"Fonds de Caisse",    val:fmt(totFC),    color:C.blue},
                {icon:"🔄",label:"Fonds de Roulement", val:fmt(totFR),    color:C.green},
                {icon:"📉",label:"Dette en Cours",     val:fmt(totDette), color:C.danger},
                {icon:"📈",label:"Gains",               val:fmt(totGains), color:C.gold},
                {icon:"🏛️",label:"Fonds Association",  val:fmt(fondsAsso),color:C.purple},
              ].map((st,i)=>(
                <div key={i} style={{ background:C.card, borderRadius:14, padding:"16px 18px", border:`1px solid ${st.color}33` }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{st.icon}</div>
                  <div style={{ fontSize:17, fontWeight:800, color:st.color, marginBottom:3 }}>{st.val}</div>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:1 }}>{st.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16 }}>
              {/* Fonds Association */}
              <Card>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10, borderLeft:`3px solid ${C.purple}`, paddingLeft:10 }}>🏛️ Fonds de l'Association</div>
                <div style={{ fontSize:24, fontWeight:800, color:C.purple, marginBottom:6 }}>{fmt(fondsAsso)}</div>
                <div style={{ fontSize:11, color:C.muted, marginBottom:12 }}>2%/prêt + sanctions remboursées</div>
                {editFA ? (
                  <div style={{ display:"flex", gap:7 }}>
                    <input style={{ ...INP, flex:1 }} type="number" value={editFAV} onChange={e=>setEditFAV(e.target.value)}/>
                    <Btn bg={C.green} onClick={()=>{const v=parseFloat(editFAV);if(!isNaN(v)&&v>=0){pushH("Modif. Fonds Asso","",v);setFondsAsso(v);}setEditFA(false);}}>✓</Btn>
                    <Btn bg={C.muted} onClick={()=>setEditFA(false)}>✕</Btn>
                  </div>
                ) : <Btn bg="rgba(255,255,255,0.07)" onClick={()=>{setEditFA(true);setEditFAV(String(fondsAsso));}}>✏️ Modifier</Btn>}
              </Card>

              {/* Prêts actifs */}
              <Card>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10, borderLeft:`3px solid ${C.accent}`, paddingLeft:10 }}>💳 Prêts Actifs ({actLoans.length})</div>
                {actLoans.length===0
                  ? <div style={{ color:C.muted, textAlign:"center", padding:"18px 0", fontSize:13 }}>✓ Aucun prêt actif</div>
                  : actLoans.slice(0,4).map(l=>{const m=members.find(x=>x.id===l.emprunteurId),d=dLeft(l.echeance);
                    const actual=calcMontantActuel(l,tod());
                    return(
                    <div key={l.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{m?.name}</div>
                        <div style={{ fontSize:10, color:d<=0?C.danger:d<=30?C.warn:C.muted }}>{d<=0?`🚨 ${Math.abs(d)}j retard (pér. ${actual.periods})`:`${d}j restants`}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:700, color:d<=0?C.danger:C.accent, fontSize:12 }}>{fmt(actual.montantDu)}</div>
                        {d<=0&&<div style={{fontSize:10,color:C.muted,textDecoration:"line-through"}}>{fmt(l.montantDu)}</div>}
                        <Btn bg={C.green} sm style={{ marginTop:3 }} onClick={()=>openM("repayLoan",{loanId:`${l.id}`})}>✓ Payer</Btn>
                      </div>
                    </div>
                  );})}
              </Card>

              {/* Sanctions */}
              <Card>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:10, borderLeft:`3px solid ${C.warn}`, paddingLeft:10 }}>⚠️ Sanctions ({sanctions.filter(s=>s.status==="en_attente").length} en attente)</div>
                {sanctions.filter(s=>s.status==="en_attente").length===0
                  ? <div style={{ color:C.muted, textAlign:"center", padding:"18px 0", fontSize:13 }}>✓ Aucune sanction en attente</div>
                  : sanctions.filter(s=>s.status==="en_attente").slice(0,4).map(s=>{const m=members.find(x=>x.id===s.memberId);return(
                    <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                      <div><div style={{ fontWeight:600, fontSize:13 }}>{m?.name}</div><div style={{ fontSize:10, color:C.muted }}>{s.raison}</div></div>
                      <div style={{ textAlign:"right" }}><div style={{ fontWeight:700, color:C.warn, fontSize:12 }}>{fmt(s.montant)}</div><Btn bg={C.green} sm style={{ marginTop:3 }} onClick={()=>doPaySanction(s.id)}>✓ Payer</Btn></div>
                    </div>
                  );})}
              </Card>
            </div>

            {members.length>0 && (
              <Card>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12, borderLeft:`3px solid ${C.blue}`, paddingLeft:10 }}>📊 Prorata Fonds de Roulement</div>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Membre","Ville","Fonds Roulement","Part %","Statut Caisse","Droit Prêt"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{membersX.map(m=>(
                    <tr key={m.id}>
                      <TD><strong>{m.name}</strong></TD>
                      <TD s={{color:C.muted,fontSize:12}}>{m.ville||"—"}</TD>
                      <TD>{fmt(m.fondsRoulement)}</TD>
                      <TD><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ flex:1, height:6, background:"rgba(255,255,255,0.07)", borderRadius:3 }}><div style={{ width:`${m.prorata}%`, height:"100%", background:`linear-gradient(90deg,${C.blue},${C.accent})`, borderRadius:3 }}/></div><span style={{ fontWeight:700, color:C.gold, minWidth:44, textAlign:"right" }}>{m.prorata.toFixed(1)}%</span></div></TD>
                      <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ Non à jour"}</Badge></TD>
                      <TD><Badge color={m.droitPret?C.green:C.warn}>{m.droitPret?"✓ Dispo":"⏸ Bloqué"}</Badge></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* ══ MEMBRES ══ */}
        {tab==="membres" && (
          <div>
            <SHdr title="👥 Gestion des Membres" onAdd={()=>openM("addMember")} addLabel="+ Nouveau Membre"/>
            {members.length===0
              ? <Card style={{textAlign:"center",padding:"40px"}}><div style={{fontSize:36,marginBottom:10}}>👤</div><div style={{color:C.muted,fontSize:13}}>Aucun membre. Créez le premier.</div></Card>
              : <Card><table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Membre","Ville","Téléphone","Fonds Caisse","Fonds Roulement","Part%","Statut","Prêt actif","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{membersX.map(m=>(
                    <tr key={m.id}>
                      <TD><strong>{m.name}</strong></TD>
                      <TD s={{color:C.muted,fontSize:12}}>{m.ville||"—"}</TD>
                      <TD s={{color:C.muted,fontSize:12}}>{m.telephone||"—"}</TD>
                      <TD><span style={{color:m.aJour?C.green:C.warn,fontWeight:600}}>{fmt(m.fondsCaisse)}</span></TD>
                      <TD>{fmt(m.fondsRoulement)}</TD>
                      <TD><span style={{fontWeight:700,color:C.gold}}>{m.prorata.toFixed(2)}%</span></TD>
                      <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ En retard"}</Badge></TD>
                      <TD>{m.loanActif?<span style={{color:C.warn,fontWeight:600}}>{fmt(m.loanActif.montantDu)}</span>:<span style={{color:C.muted}}>—</span>}</TD>
                      <TD><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        <Btn bg={C.blue}   sm onClick={()=>openM("addCotisation",{memberId:m.id})}>+ Cotis.</Btn>
                        <Btn bg={C.accent} sm onClick={()=>openM("addLoan",{emprunteurId:`${m.id}`})}>+ Prêt</Btn>
                        <Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn>
                        <Btn bg={C.gold}   sm onClick={()=>openM("editMember",{memberId:m.id,name:m.name,ville:m.ville||"",telephone:m.telephone||""})}>✏️</Btn>
                        <Btn bg={C.danger} sm onClick={()=>doDeleteMember(m.id)}>🗑️</Btn>
                      </div></TD>
                    </tr>
                  ))}</tbody>
                </table>
              </Card>
            }
          </div>
        )}

        {/* ══ PRÊTS ══ */}
        {tab==="prets" && (
          <div>
            <SHdr title="💳 Gestion des Prêts" onAdd={()=>openM("addLoan")} addLabel="+ Nouveau Prêt"/>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
              {[{l:"Actifs",v:actLoans.length,c:C.warn},{l:"Remboursés",v:loans.filter(l=>l.status==="rembourse").length,c:C.green},{l:"Total Intérêts",v:fmt(loans.reduce((s,l)=>s+l.interets,0)),c:C.gold}].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${s.c}33`}}>
                  <div style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <Card>
              {loans.length===0
                ? <div style={{textAlign:"center",color:C.muted,padding:"30px 0"}}>Aucun prêt enregistré</div>
                : <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead><tr>{["Date","Emprunteur","Capital","Montant Initial","Montant Actualisé","Période","Échéance","Remboursé le","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                    <tbody>{loans.map(l=>{
                      const empr = members.find(m=>m.id===l.emprunteurId);
                      const d    = dLeft(l.echeance);
                      const actual = l.status==="actif"
                        ? calcMontantActuel(l, tod())
                        : { montantDu: l.montantRembourse||l.montantDu, interets: l.interetsRembourse||l.interets, periods: "—" };
                      const overdue = l.status==="actif" && d <= 0;
                      return(<tr key={l.id} style={{background: overdue?"rgba(192,57,43,0.06)":"transparent"}}>
                        <TD s={{color:C.muted,fontSize:12}}>{l.date}</TD>
                        <TD><strong>{empr?.name}</strong></TD>
                        <TD>{fmt(l.montant)}</TD>
                        <TD s={{color:C.muted,fontSize:12}}>{fmt(l.montant*1.1)}<div style={{fontSize:10,color:C.muted}}>1 période</div></TD>
                        <TD>
                          <strong style={{color:overdue?C.danger:C.accent,fontSize:14}}>{fmt(actual.montantDu)}</strong>
                          <div style={{fontSize:10,color:C.gold}}>+{fmt(actual.interets)} intérêts</div>
                        </TD>
                        <TD>
                          <span style={{fontWeight:700,color:overdue?C.danger:C.gold,fontSize:13}}>
                            {typeof actual.periods==="number"?`Période ${actual.periods}`:actual.periods}
                          </span>
                          {overdue&&<div style={{fontSize:10,color:C.danger}}>🚨 {Math.abs(d)}j retard</div>}
                          {l.status==="actif"&&!overdue&&<div style={{fontSize:10,color:d<=30?C.warn:C.muted}}>{d}j restants</div>}
                        </TD>
                        <TD s={{fontSize:12,color:overdue?C.danger:C.muted}}>{l.echeance}</TD>
                        <TD>
                          {l.dateRembours
                            ? <span style={{fontSize:12,color:C.green,fontWeight:600}}>{l.dateRembours}</span>
                            : <span style={{color:C.muted,fontSize:12}}>—</span>}
                        </TD>
                        <TD><Badge color={l.status==="actif"?(overdue?C.danger:C.warn):C.green}>{l.status==="actif"?(overdue?"🚨 En retard":"En cours"):"✓ Remboursé"}</Badge></TD>
                        <TD><div style={{display:"flex",gap:3}}>
                          {l.status==="actif"&&<Btn bg={C.green} sm onClick={()=>openM("repayLoan",{loanId:`${l.id}`})}>✓ Payer</Btn>}
                          <Btn bg={C.gold}   sm onClick={()=>openM("editLoan",{loanId:`${l.id}`,montant:`${l.montant}`,date:l.date,assistantId:`${l.assistantId||""}`,emprunteurId:`${l.emprunteurId}`})}>✏️</Btn>
                          <Btn bg={C.danger} sm onClick={()=>doDeleteLoan(l.id)}>🗑️</Btn>
                        </div></TD>
                      </tr>);
                    })}</tbody>
                  </table>
              }
            </Card>
          </div>
        )}

        {/* ══ COTISATIONS ══ */}
        {tab==="cotisations" && (
          <div>
            <SHdr title="💰 Cotisations" onAdd={()=>openM("addCotisation")} addLabel="+ Nouvelle Cotisation"/>
            <div style={{ display:"flex", gap:2, marginBottom:16, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:4, width:"fit-content" }}>
              {[{id:"tous",label:"🗂️ Vue d'ensemble"},{id:"caisse",label:"🏦 Fonds de Caisse"},{id:"roulement",label:"🔄 Fonds de Roulement"}].map(t=>(
                <button key={t.id} onClick={()=>setCotisSubTab(t.id)} style={{ padding:"7px 16px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:12, background:cotisSubTab===t.id?C.accent:"transparent", color:cotisSubTab===t.id?"#fff":C.muted }}>{t.label}</button>
              ))}
            </div>
            {members.length===0
              ? <Card style={{textAlign:"center",padding:"40px"}}><div style={{color:C.muted}}>Aucun membre.</div></Card>
              : <div>
                {cotisSubTab==="tous" && (
                  <Card>
                    <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>Seuil Fonds de Caisse «à jour» : <strong style={{color:C.gold}}>{fmt(SEUIL)}</strong></div>
                    <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                      <thead><tr>{["Membre","FC — Progression","Statut","Fonds Roulement","Part%","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                      <tbody>{membersX.map(m=>{
                        const nb=cotisations.filter(c=>c.memberId===m.id&&!c.auto).length;
                        const pct=Math.min((m.fondsCaisse/SEUIL)*100,100);
                        return(<tr key={m.id}>
                          <TD><strong>{m.name}</strong>{m.ville&&<div style={{fontSize:11,color:C.muted}}>{m.ville}</div>}</TD>
                          <TD><div style={{fontSize:12,fontWeight:600,color:m.aJour?C.green:C.warn,marginBottom:4}}>{fmt(m.fondsCaisse)}</div>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:m.aJour?C.green:C.warn,borderRadius:3}}/></div><span style={{fontSize:11,color:C.muted,minWidth:32}}>{pct.toFixed(0)}%</span></div></TD>
                          <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ Non"}</Badge></TD>
                          <TD>{fmt(m.fondsRoulement)}</TD>
                          <TD><span style={{fontWeight:700,color:C.gold}}>{m.prorata.toFixed(2)}%</span></TD>
                          <TD><span style={{background:"rgba(255,255,255,0.07)",padding:"2px 9px",borderRadius:20,fontSize:12}}>{nb} enreg.</span></TD>
                          <TD><div style={{display:"flex",gap:3}}>
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
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.blue}33`}}><div style={{fontSize:19,fontWeight:800,color:C.blue}}>{fmt(totFC)}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Total solde</div></div>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.green}33`}}><div style={{fontSize:19,fontWeight:800,color:C.green}}>{membersX.filter(m=>m.aJour).length}/{members.length}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>À jour</div></div>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.warn}33`}}><div style={{fontSize:19,fontWeight:800,color:C.warn}}>{fmt(SEUIL)}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Seuil requis</div></div>
                    </div>
                    <Card style={{marginBottom:16}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.blue,marginBottom:12,borderLeft:`3px solid ${C.blue}`,paddingLeft:10}}>🏦 Par membre</div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                        <thead><tr>{["Membre","Ville","Fonds Caisse","Progression","Statut","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                        <tbody>{membersX.map(m=>{const cots=cotisations.filter(c=>c.memberId===m.id&&c.type==="caisse"&&!c.auto);const pct=Math.min((m.fondsCaisse/SEUIL)*100,100);return(<tr key={m.id}>
                          <TD><strong>{m.name}</strong></TD><TD s={{color:C.muted,fontSize:12}}>{m.ville||"—"}</TD>
                          <TD><strong style={{color:m.aJour?C.green:C.warn}}>{fmt(m.fondsCaisse)}</strong></TD>
                          <TD><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3}}><div style={{width:`${pct}%`,height:"100%",background:m.aJour?C.green:C.warn,borderRadius:3}}/></div><span style={{fontSize:11,color:C.muted,minWidth:34}}>{pct.toFixed(0)}%</span></div></TD>
                          <TD><Badge color={m.aJour?C.green:C.danger}>{m.aJour?"✓ À jour":"✗ Non"}</Badge></TD>
                          <TD><span style={{background:`${C.blue}22`,color:C.blue,padding:"2px 9px",borderRadius:20,fontSize:12}}>{cots.length}</span></TD>
                          <TD><div style={{display:"flex",gap:3}}><Btn bg={C.blue} sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"caisse"})}>+ Verser</Btn><Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn></div></TD>
                        </tr>);})}
                        </tbody>
                      </table>
                    </Card>
                    <Card>
                      <div style={{fontSize:13,fontWeight:700,color:C.blue,marginBottom:12,borderLeft:`3px solid ${C.blue}`,paddingLeft:10}}>📋 Historique ({cotisations.filter(c=>c.type==="caisse"&&!c.auto).length})</div>
                      {cotisations.filter(c=>c.type==="caisse"&&!c.auto).length===0
                        ?<div style={{textAlign:"center",color:C.muted,padding:"18px 0"}}>Aucun versement</div>
                        :<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                          <thead><tr>{["Date","Heure","Membre","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                          <tbody>{[...cotisations].filter(c=>c.type==="caisse"&&!c.auto).sort((a,b)=>new Date(b.date)-new Date(a.date)).map(c=>{const mb=members.find(m=>m.id===c.memberId);return(<tr key={c.id}>
                            <TD s={{fontSize:11,color:C.muted}}>{c.date}</TD><TD s={{fontSize:11,color:C.muted}}>{c.heure||"—"}</TD>
                            <TD><strong>{mb?.name||"?"}</strong>{mb?.ville&&<span style={{fontSize:11,color:C.muted,marginLeft:5}}>{mb.ville}</span>}</TD>
                            <TD><strong style={{color:C.blue}}>{fmt(c.montant)}</strong></TD>
                            <TD><div style={{display:"flex",gap:3}}><Btn bg={C.gold} xs onClick={()=>openM("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn><Btn bg={C.danger} xs onClick={()=>doDeleteCotisation(c.id)}>🗑️</Btn></div></TD>
                          </tr>);})}
                          </tbody>
                        </table>}
                    </Card>
                  </div>
                )}
                {cotisSubTab==="roulement" && (
                  <div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.green}33`}}><div style={{fontSize:19,fontWeight:800,color:C.green}}>{fmt(totFR)}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Solde net actuel</div></div>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.warn}33`}}><div style={{fontSize:19,fontWeight:800,color:C.warn}}>{fmt(totDette)}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>En prêts actifs</div></div>
                      <div style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${C.gold}33`}}><div style={{fontSize:19,fontWeight:800,color:C.gold}}>{cotisations.filter(c=>c.type==="roulement").length}</div><div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>Mouvements</div></div>
                    </div>
                    <Card style={{marginBottom:16}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:12,borderLeft:`3px solid ${C.green}`,paddingLeft:10}}>🔄 Par membre</div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                        <thead><tr>{["Membre","Ville","Fonds Roulement","Part %","Versements","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                        <tbody>{membersX.map(m=>{const cots=cotisations.filter(c=>c.memberId===m.id&&c.type==="roulement"&&!c.auto);return(<tr key={m.id}>
                          <TD><strong>{m.name}</strong></TD><TD s={{color:C.muted,fontSize:12}}>{m.ville||"—"}</TD>
                          <TD><strong style={{color:C.green}}>{fmt(m.fondsRoulement)}</strong></TD>
                          <TD><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:5,background:"rgba(255,255,255,0.07)",borderRadius:3}}><div style={{width:`${m.prorata}%`,height:"100%",background:`linear-gradient(90deg,${C.green},${C.blue})`,borderRadius:3}}/></div><span style={{fontSize:11,fontWeight:700,color:C.gold,minWidth:44}}>{m.prorata.toFixed(1)}%</span></div></TD>
                          <TD><span style={{background:`${C.green}22`,color:C.green,padding:"2px 9px",borderRadius:20,fontSize:12}}>{cots.length}</span></TD>
                          <TD><div style={{display:"flex",gap:3}}><Btn bg={C.green} sm onClick={()=>openM("addCotisation",{memberId:`${m.id}`,type:"roulement"})}>+ Verser</Btn><Btn bg="rgba(255,255,255,0.1)" sm onClick={()=>openM("memberDetail",{memberId:m.id})}>👁️</Btn></div></TD>
                        </tr>);})}
                        </tbody>
                      </table>
                    </Card>
                    <Card>
                      <div style={{fontSize:13,fontWeight:700,color:C.green,marginBottom:12,borderLeft:`3px solid ${C.green}`,paddingLeft:10}}>📋 Historique des mouvements</div>
                      {cotisations.filter(c=>c.type==="roulement").length===0
                        ?<div style={{textAlign:"center",color:C.muted,padding:"18px 0"}}>Aucun mouvement</div>
                        :<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                          <thead><tr>{["Date","Heure","Membre","Opération","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                          <tbody>{[...cotisations].filter(c=>c.type==="roulement").sort((a,b)=>new Date(b.date)-new Date(a.date)).map(c=>{
                            const mb=members.find(m=>m.id===c.memberId);
                            const isD=c.direction==="debit", isCr=c.direction==="credit"&&c.auto;
                            return(<tr key={c.id}>
                              <TD s={{fontSize:11,color:C.muted}}>{c.date}</TD><TD s={{fontSize:11,color:C.muted}}>{c.heure||"—"}</TD>
                              <TD><strong>{mb?.name||"?"}</strong></TD>
                              <TD>{isD?<Badge color={C.warn}>📤 {c.label||"Contribution"}</Badge>:isCr?<Badge color={C.green}>📥 {c.label||"Retour"}</Badge>:<Badge color={C.green}>🔄 Versement</Badge>}</TD>
                              <TD><strong style={{color:isD?C.danger:C.green}}>{isD?"−":"+"} {fmt(c.montant)}</strong></TD>
                              <TD>{c.auto?<span style={{fontSize:10,color:C.muted,fontStyle:"italic"}}>auto</span>:<div style={{display:"flex",gap:3}}><Btn bg={C.gold} xs onClick={()=>openM("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn><Btn bg={C.danger} xs onClick={()=>doDeleteCotisation(c.id)}>🗑️</Btn></div>}</TD>
                            </tr>);
                          })}
                          </tbody>
                        </table>}
                    </Card>
                  </div>
                )}
              </div>
            }
          </div>
        )}

        {/* ══ SANCTIONS ══ */}
        {tab==="sanctions" && (
          <div>
            <SHdr title="⚠️ Sanctions" printFn={prtSanctions} onAdd={()=>openM("addSanction")} addLabel="+ Nouvelle Sanction"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
              {[
                {l:"Total",     v:sanctions.length,                                                               c:C.muted},
                {l:"En attente",v:sanctions.filter(s=>s.status==="en_attente").length,                            c:C.warn},
                {l:"Payées",    v:sanctions.filter(s=>s.status==="payee").length,                                  c:C.green},
                {l:"Encaissé → Fonds Asso", v:fmt(sanctions.filter(s=>s.status==="payee").reduce((s,x)=>s+x.montant,0)), c:C.purple},
              ].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${s.c}33`}}>
                  <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <Card>
              {sanctions.length===0
                ?<div style={{textAlign:"center",color:C.muted,padding:"30px 0"}}>Aucune sanction enregistrée</div>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr>{["Date","Membre","Raison","Montant","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{[...sanctions].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>{
                    const mb=members.find(m=>m.id===s.memberId);
                    return(<tr key={s.id}>
                      <TD s={{color:C.muted,fontSize:12}}>{s.date}</TD>
                      <TD><strong>{mb?.name||"Membre inconnu"}</strong>{mb?.ville&&<div style={{fontSize:11,color:C.muted}}>{mb.ville}</div>}</TD>
                      <TD style={{maxWidth:220}}><span style={{fontSize:12}}>{s.raison}</span></TD>
                      <TD><strong style={{color:C.warn}}>{fmt(s.montant)}</strong></TD>
                      <TD>
                        {s.status==="payee"
                          ?<div><Badge color={C.green}>✓ Payée</Badge>{s.datePaiement&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.datePaiement}</div>}</div>
                          :<Badge color={C.warn}>⏳ En attente</Badge>}
                      </TD>
                      <TD><div style={{display:"flex",gap:3}}>
                        {s.status==="en_attente"&&<Btn bg={C.green} sm onClick={()=>doPaySanction(s.id)}>✓ Payer</Btn>}
                        {s.status==="en_attente"&&<Btn bg={C.gold}  sm onClick={()=>openM("editSanction",{sancId:`${s.id}`,memberId:`${s.memberId}`,montant:`${s.montant}`,date:s.date,raison:s.raison})}>✏️</Btn>}
                        {s.status==="en_attente"&&<Btn bg={C.danger} sm onClick={()=>doDeleteSanction(s.id)}>🗑️</Btn>}
                      </div></TD>
                    </tr>);
                  })}</tbody>
                </table>
              }
            </Card>
          </div>
        )}

        {/* ══ SORTIES ══ */}
        {tab==="sorties" && (
          <div>
            <SHdr title="📤 Sorties de Fonds" printFn={prtSorties} onAdd={()=>openM("addSortie",{sortieMembers:members.map(m=>m.id)})} addLabel="+ Nouvelle Sortie"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
              {[
                {l:"Total sorties", v:fmt(sorties.reduce((s,x)=>s+x.montant,0)), c:C.danger},
                {l:"Depuis Fonds Caisse", v:fmt(sorties.filter(s=>s.source==="caisse").reduce((s,x)=>s+x.montant,0)), c:C.blue},
                {l:"Depuis Fonds Asso",   v:fmt(sorties.filter(s=>s.source==="asso").reduce((s,x)=>s+x.montant,0)), c:C.purple},
              ].map((s,i)=>(
                <div key={i} style={{background:C.card,borderRadius:12,padding:"14px 18px",border:`1px solid ${s.c}33`}}>
                  <div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3,textTransform:"uppercase"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <Card>
              {sorties.length===0
                ?<div style={{textAlign:"center",color:C.muted,padding:"30px 0"}}>Aucune sortie enregistrée</div>
                :<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead><tr>{["Date","Source","Raison","Membres concernés","Part / membre","Total","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{[...sorties].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>(
                    <tr key={s.id}>
                      <TD s={{color:C.muted,fontSize:12,whiteSpace:"nowrap"}}>{s.date}<div style={{fontSize:10}}>{s.heure||""}</div></TD>
                      <TD><Badge color={s.source==="caisse"?C.blue:C.purple}>{s.source==="caisse"?"🏦 Caisse":"🏛️ Asso"}</Badge></TD>
                      <TD style={{maxWidth:200}}><span style={{fontSize:12}}>{s.raison}</span></TD>
                      <TD s={{fontSize:12}}>
                        {s.source==="caisse" && s.memberIds
                          ? <div style={{lineHeight:1.6}}>
                              {s.memberIds.map(id=>{
                                const mb=members.find(m=>`${m.id}`===`${id}`);
                                return mb ? <div key={id} style={{color:C.muted}}>{mb.name}</div> : null;
                              })}
                            </div>
                          : <span style={{color:C.muted}}>—</span>}
                      </TD>
                      <TD>{s.partParMembre!=null ? <strong style={{color:C.warn}}>{fmt(s.partParMembre)}</strong> : <span style={{color:C.muted}}>—</span>}</TD>
                      <TD><strong style={{color:C.danger}}>{fmt(s.montant)}</strong></TD>
                      <TD><Btn bg={C.danger} sm onClick={()=>doDeleteSortie(s.id)}>🗑️ Annuler</Btn></TD>
                    </tr>
                  ))}</tbody>
                </table>
              }
            </Card>
          </div>
        )}

        {/* ══ HISTORIQUE ══ */}
        {tab==="historique" && (
          <div>
            <SHdr title="📋 Historique"/>
            <Card>
              {history.length===0
                ?<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}>Aucune opération</div>
                :<table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Date","Heure","Action","Détail","Montant"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{history.map(h=>(
                    <tr key={h.id}>
                      <TD s={{color:C.muted,fontSize:12}}>{h.date}</TD>
                      <TD s={{color:C.muted,fontSize:12}}>{h.heure||"—"}</TD>
                      <TD><Badge color={C.blue}>{h.action}</Badge></TD>
                      <TD>{h.detail}</TD>
                      <TD><span style={{fontWeight:700,color:h.montant>0?C.gold:C.muted}}>{h.montant>0?fmt(h.montant):"—"}</span></TD>
                    </tr>
                  ))}</tbody>
                </table>
              }
            </Card>
          </div>
        )}
      </div>

      {/* ══════════════════════ MODALES ═══════════════════════════════════════ */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(5px)" }}
          onClick={modal.type==="memberDetail" ? undefined : closeM}>
          <div style={{ background:C.card, borderRadius:16, padding:modal.type==="memberDetail"?0:28, width:modal.type==="memberDetail"?800:480, maxWidth:"96vw", border:`1px solid ${C.border}`, boxShadow:"0 24px 70px rgba(0,0,0,.8)", maxHeight:"94vh", overflowY:"auto" }}
            onClick={e=>e.stopPropagation()}>

            {/* ── Nouveau membre ── */}
            {modal.type==="addMember" && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.gold}}>👤 Nouveau Membre</div>
                <div style={FR}><label style={LBL}>Nom complet *</label><input style={INP} value={form.name||""} onChange={e=>sf("name")(e.target.value)} autoFocus placeholder="Ex: Amadou Diallo"/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div style={FR}><label style={LBL}>Ville</label><input style={INP} value={form.ville||""} onChange={e=>sf("ville")(e.target.value)} placeholder="Ex: Dakar"/></div>
                  <div style={FR}><label style={LBL}>Téléphone</label><input style={INP} value={form.telephone||""} onChange={e=>sf("telephone")(e.target.value)} placeholder="Ex: +221 77 …"/></div>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.accent} onClick={doAddMember}>✓ Créer</Btn></div>
              </div>
            )}
            {modal.type==="editMember" && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.gold}}>✏️ Modifier le Membre</div>
                <div style={FR}><label style={LBL}>Nom *</label><input style={INP} value={form.name||""} onChange={e=>sf("name")(e.target.value)} autoFocus/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div style={FR}><label style={LBL}>Ville</label><input style={INP} value={form.ville||""} onChange={e=>sf("ville")(e.target.value)}/></div>
                  <div style={FR}><label style={LBL}>Téléphone</label><input style={INP} value={form.telephone||""} onChange={e=>sf("telephone")(e.target.value)}/></div>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.gold} onClick={doEditMember}>✓ Enregistrer</Btn></div>
              </div>
            )}

            {/* ── Cotisation ── */}
            {(modal.type==="addCotisation"||modal.type==="editCotisation") && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.gold}}>{modal.type==="editCotisation"?"✏️ Modifier":"💰 Nouvelle"} Cotisation</div>
                {modal.type==="addCotisation" && (
                  <div style={FR}><label style={LBL}>Membre *</label>
                    <select style={INP} value={form.memberId||""} onChange={e=>sf("memberId")(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {members.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}</option>)}
                    </select>
                  </div>
                )}
                <div style={FR}><label style={LBL}>Type *</label>
                  <select style={INP} value={form.type||""} onChange={e=>sf("type")(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    <option value="caisse">🏦 Fonds de Caisse</option>
                    <option value="roulement">🔄 Fonds de Roulement</option>
                  </select>
                </div>
                <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 25 000"/></div>
                <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={modal.type==="editCotisation"?C.gold:C.accent} onClick={modal.type==="editCotisation"?doEditCotisation:doAddCotisation}>✓ {modal.type==="editCotisation"?"Modifier":"Enregistrer"}</Btn></div>
              </div>
            )}

            {/* ── Nouveau prêt ── */}
            {modal.type==="addLoan" && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.gold}}>💳 Nouveau Prêt</div>
                <div style={FR}><label style={LBL}>Emprunteur *</label>
                  <select style={INP} value={form.emprunteurId||""} onChange={e=>sf("emprunteurId")(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {membersX.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}{!m.droitPret?" ⏸":""}</option>)}
                  </select>
                </div>
                <div style={FR}><label style={LBL}>Montant (FCFA) *</label>
                  <input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 50 000"/>
                </div>
                <div style={FR}>
                  <label style={LBL}>Date du prêt <span style={{fontWeight:400,fontSize:11,textTransform:"none",color:C.muted,marginLeft:6}}>(échéance = +3 mois)</span></label>
                  <input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/>
                  <div style={{fontSize:11,color:C.muted,marginTop:5,padding:"5px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6,display:"flex",gap:16}}>
                    <span>📅 <strong style={{color:C.text}}>{form.date||tod()}</strong></span>
                    <span>⏱️ Échéance : <strong style={{color:C.gold}}>{add3M(form.date||tod())}</strong></span>
                  </div>
                </div>
                {form.montant&&parseFloat(form.montant)>0&&(
                  <div style={{background:`${C.gold}0e`,border:`1px solid ${C.gold}28`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,lineHeight:2}}>
                    <div>📌 Montant : <strong>{fmt(parseFloat(form.montant))}</strong></div>
                    <div>💰 Intérêts (10%) : <strong style={{color:C.gold}}>{fmt(parseFloat(form.montant)*0.1)}</strong></div>
                    <div style={{paddingLeft:12,color:C.muted}}>🏛️ 2% → Fonds Association : {fmt(parseFloat(form.montant)*0.02)}</div>
                    <div style={{paddingLeft:12,color:C.muted}}>👥 8% → Redistribués au prorata snapshot : {fmt(parseFloat(form.montant)*0.08)}</div>
                    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:5,marginTop:2}}>💳 <strong>Total à rembourser : <span style={{color:C.accent}}>{fmt(parseFloat(form.montant)*1.1)}</span></strong></div>
                  </div>
                )}
                <div style={FR}><label style={LBL}>Assistant (optionnel)</label>
                  <select style={INP} value={form.assistantId||""} onChange={e=>sf("assistantId")(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {membersX.filter(m=>`${m.id}`!==form.emprunteurId&&m.droitPret).map(m=><option key={m.id} value={`${m.id}`}>{m.name}</option>)}
                  </select>
                  {form.assistantId&&<div style={{fontSize:11,color:C.warn,marginTop:5,background:`${C.warn}12`,padding:"5px 10px",borderRadius:6}}>⚠️ L'assistant perdra son droit de prêt jusqu'au remboursement.</div>}
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.accent} onClick={doAddLoan}>✓ Accorder le prêt</Btn></div>
              </div>
            )}

            {/* ── Modifier prêt ── */}
            {modal.type==="editLoan" && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:8,color:C.gold}}>✏️ Modifier le Prêt</div>
                {editLoanObj?.status==="actif"&&<div style={{fontSize:12,color:C.warn,marginBottom:16,background:`${C.warn}12`,padding:"8px 12px",borderRadius:8}}>⚠️ Prêt actif — la modification recalcule les contributions et réajuste les fonds.</div>}
                <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)}/></div>
                {form.montant&&parseFloat(form.montant)>0&&<div style={{background:`${C.gold}0e`,border:`1px solid ${C.gold}28`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,lineHeight:1.9}}><div>💰 Intérêts : <strong style={{color:C.gold}}>{fmt(parseFloat(form.montant)*0.1)}</strong></div><div>💳 Total : <strong style={{color:C.accent}}>{fmt(parseFloat(form.montant)*1.1)}</strong></div></div>}
                <div style={FR}>
                  <label style={LBL}>Date du prêt</label>
                  <input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/>
                  <div style={{fontSize:11,color:C.muted,marginTop:5,padding:"5px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6,display:"flex",gap:16}}><span>📅 <strong style={{color:C.text}}>{form.date||tod()}</strong></span><span>⏱️ <strong style={{color:C.gold}}>{add3M(form.date||tod())}</strong></span></div>
                </div>
                {editLoanObj?.status==="actif"&&<div style={FR}><label style={LBL}>Assistant</label>
                  <select style={INP} value={form.assistantId||""} onChange={e=>sf("assistantId")(e.target.value)}>
                    <option value="">— Aucun —</option>
                    {membersX.filter(m=>`${m.id}`!==form.emprunteurId&&(m.droitPret||m.id===editLoanObj?.assistantId)).map(m=><option key={m.id} value={`${m.id}`}>{m.name}</option>)}
                  </select>
                </div>}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.gold} onClick={doEditLoan}>✓ Enregistrer</Btn></div>
              </div>
            )}

            {/* ── Remboursement prêt ── */}
            {modal.type==="repayLoan" && (() => {
              const loan    = loans.find(l => `${l.id}` === `${form.loanId}`);
              const empr    = loan ? members.find(m => m.id === loan.emprunteurId) : null;
              const repDate = form.repayDate || tod();
              const actual  = loan ? calcMontantActuel(loan, repDate) : null;
              return loan && actual ? (
                <div>
                  <div style={{fontSize:16,fontWeight:700,marginBottom:6,color:C.green}}>💳 Remboursement de Prêt</div>
                  <div style={{fontSize:13,color:C.muted,marginBottom:18}}>{empr?.name} — Prêt accordé le <strong style={{color:C.text}}>{loan.date}</strong></div>

                  {/* Date de remboursement */}
                  <div style={FR}>
                    <label style={LBL}>📅 Date de remboursement *</label>
                    <input style={INP} type="date" value={repDate} onChange={e=>sf("repayDate")(e.target.value)} min={loan.date}/>
                    <div style={{fontSize:11,color:C.muted,marginTop:5,padding:"5px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>
                      Délai : <strong style={{color:C.text}}>
                        {Math.max(0,Math.round((new Date(repDate)-new Date(loan.date))/864e5))} jours
                        depuis le prêt
                      </strong>
                    </div>
                  </div>

                  {/* Décomposition calculée */}
                  <div style={{background:`${actual.periods>1?C.danger:C.gold}10`,border:`1px solid ${actual.periods>1?C.danger:C.gold}30`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,color:actual.periods>1?C.danger:C.gold,marginBottom:10}}>
                      {actual.periods > 1 ? `⚠️ Période ${actual.periods} — Intérêts composés` : `✓ Période 1 — Dans les délais`}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
                        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",marginBottom:3}}>Capital emprunté</div>
                        <div style={{fontWeight:700}}>{fmt(loan.montant)}</div>
                      </div>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
                        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",marginBottom:3}}>Intérêts ({actual.periods}×10%)</div>
                        <div style={{fontWeight:700,color:C.gold}}>+{fmt(actual.interets)}</div>
                      </div>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
                        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",marginBottom:3}}>→ Fonds Asso (20% int.)</div>
                        <div style={{fontWeight:700,color:C.purple}}>+{fmt(actual.fraisAsso)}</div>
                      </div>
                      <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8}}>
                        <div style={{color:C.muted,fontSize:10,textTransform:"uppercase",marginBottom:3}}>→ Membres (80% int.)</div>
                        <div style={{fontWeight:700,color:C.green}}>+{fmt(actual.gainMbr)}</div>
                      </div>
                    </div>
                    {/* Total */}
                    <div style={{borderTop:`1px solid ${C.border}`,marginTop:12,paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontWeight:700,fontSize:14}}>💳 Total à encaisser</span>
                      <span style={{fontWeight:900,fontSize:18,color:actual.periods>1?C.danger:C.green}}>{fmt(actual.montantDu)}</span>
                    </div>
                    {/* Calcul des périodes */}
                    {actual.periods > 1 && (
                      <div style={{marginTop:10,fontSize:11,color:C.muted,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
                        {Array.from({length:actual.periods}).map((_,i)=>(
                          <span key={i} style={{marginRight:8}}>Pér.{i+1}: {fmt(loan.montant*Math.pow(1.1,i+1))}{i<actual.periods-1?" →":""}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
                    <Btn bg={C.muted} onClick={closeM}>Annuler</Btn>
                    <Btn bg={C.green} onClick={()=>doRepay(loan.id, repDate)}>✓ Confirmer le remboursement</Btn>
                  </div>
                </div>
              ) : <div style={{color:C.muted,padding:"20px 0",textAlign:"center"}}>Prêt introuvable.</div>;
            })()}

            {/* ── Sanction ── */}
            {(modal.type==="addSanction"||modal.type==="editSanction") && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.warn}}>{modal.type==="editSanction"?"✏️ Modifier la Sanction":"⚠️ Nouvelle Sanction"}</div>
                <div style={FR}><label style={LBL}>Membre sanctionné *</label>
                  <select style={INP} value={form.memberId||""} onChange={e=>sf("memberId")(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {members.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}</option>)}
                  </select>
                </div>
                <div style={FR}><label style={LBL}>Raison de la sanction *</label>
                  <input style={INP} value={form.raison||""} onChange={e=>sf("raison")(e.target.value)} placeholder="Ex: Absence non justifiée à la réunion du 15/01"/>
                </div>
                <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 5 000"/></div>
                <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.warn} onClick={modal.type==="editSanction"?doEditSanction:doAddSanction}>✓ {modal.type==="editSanction"?"Modifier":"Enregistrer"}</Btn></div>
              </div>
            )}

            {/* ── Sortie de fonds ── */}
            {modal.type==="addSortie" && (
              <div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:20,color:C.danger}}>📤 Nouvelle Sortie de Fonds</div>

                {/* Source */}
                <div style={FR}><label style={LBL}>Source *</label>
                  <select style={INP} value={form.source||""} onChange={e=>{sf("source")(e.target.value);}}>
                    <option value="">— Sélectionner —</option>
                    <option value="caisse">🏦 Fonds de Caisse (total membres : {fmt(totFC)})</option>
                    <option value="asso">🏛️ Fonds de l'Association ({fmt(fondsAsso)})</option>
                  </select>
                </div>

                {/* Sélection membres — uniquement pour Fonds Caisse */}
                {form.source==="caisse" && members.length>0 && (
                  <div style={FR}>
                    <label style={LBL}>Membres concernés * <span style={{fontWeight:400,fontSize:11,textTransform:"none",color:C.muted}}>(débit = montant ÷ nb membres sélectionnés)</span></label>
                    {/* Raccourcis */}
                    <div style={{display:"flex",gap:6,marginBottom:8}}>
                      <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>sf("sortieMembers")(members.map(m=>m.id))}>✓ Tous</Btn>
                      <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>sf("sortieMembers")([])}>✗ Aucun</Btn>
                    </div>
                    {/* Liste des membres */}
                    <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
                      {members.map((m,i) => {
                        const selIds  = form.sortieMembers || [];
                        const checked = selIds.some(id => `${id}` === `${m.id}`);
                        const n       = selIds.length;
                        const part    = n > 0 && form.montant && parseFloat(form.montant)>0 ? parseFloat(form.montant)/n : null;
                        const après   = checked && part != null ? (m.fondsCaisse||0) - part : null;
                        const toggle  = () => {
                          if (checked) sf("sortieMembers")(selIds.filter(id=>`${id}`!==`${m.id}`));
                          else         sf("sortieMembers")([...selIds, m.id]);
                        };
                        return (
                          <div key={m.id} onClick={toggle} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:i<members.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",background:checked?"rgba(233,69,96,0.07)":"transparent"}}>
                            {/* Case à cocher visuelle */}
                            <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${checked?C.accent:C.muted}`,background:checked?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {checked && <span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
                            </div>
                            <div style={{flex:1}}>
                              <span style={{fontWeight:600,fontSize:13}}>{m.name}</span>
                              {m.ville && <span style={{fontSize:11,color:C.muted,marginLeft:6}}>{m.ville}</span>}
                            </div>
                            <div style={{textAlign:"right",minWidth:140}}>
                              <span style={{fontSize:12,color:C.muted}}>Solde : </span>
                              <span style={{fontSize:12,fontWeight:700,color:(m.fondsCaisse||0)>=0?C.text:C.danger}}>{fmt(m.fondsCaisse||0)}</span>
                              {checked && part!=null && (
                                <div style={{fontSize:11,color:après!=null&&après<0?C.danger:C.gold,marginTop:2}}>
                                  − {fmt(part)} → <strong style={{color:après!=null&&après<0?C.danger:C.green}}>{fmt(après)}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Résumé split */}
                    {(form.sortieMembers||[]).length>0 && form.montant && parseFloat(form.montant)>0 && (
                      <div style={{marginTop:8,padding:"8px 12px",background:`${C.accent}12`,borderRadius:8,border:`1px solid ${C.accent}22`,fontSize:12,display:"flex",gap:16,flexWrap:"wrap"}}>
                        <span>👥 <strong>{(form.sortieMembers||[]).length}</strong> membre(s) sélectionné(s)</span>
                        <span>÷</span>
                        <span>💸 <strong style={{color:C.gold}}>{fmt(parseFloat(form.montant))}</strong> total</span>
                        <span>=</span>
                        <span>📌 <strong style={{color:C.accent}}>{fmt(parseFloat(form.montant)/(form.sortieMembers||[1]).length)}</strong> / membre</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Raison */}
                <div style={FR}><label style={LBL}>Raison / Justification *</label>
                  <input style={INP} value={form.raison||""} onChange={e=>sf("raison")(e.target.value)} placeholder="Ex: Achat de fournitures pour la réunion annuelle"/>
                </div>

                {/* Montant */}
                <div style={FR}><label style={LBL}>Montant total (FCFA) *</label>
                  <input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 33 000"/>
                  {form.source==="asso" && form.montant && parseFloat(form.montant)>0 && (
                    <div style={{fontSize:11,color:C.muted,marginTop:5,padding:"5px 10px",background:"rgba(255,255,255,0.04)",borderRadius:6}}>
                      Solde Fonds Asso après sortie : <strong style={{color:parseFloat(form.montant)<=fondsAsso?C.green:C.danger}}>
                        {fmt(fondsAsso - parseFloat(form.montant))}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>

                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}>
                  <Btn bg={C.muted} onClick={closeM}>Annuler</Btn>
                  <Btn bg={C.danger} onClick={doAddSortie}>✓ Enregistrer la sortie</Btn>
                </div>
              </div>
            )}

            {/* ── Détail Membre ── */}
            {modal.type==="memberDetail" && detailMb && (
              <div>
                <div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:19,fontWeight:800,marginBottom:3}}>{detailMb.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginBottom:8}}>
                      {detailMb.ville&&<span style={{marginRight:14}}>📍 {detailMb.ville}</span>}
                      {detailMb.telephone&&<span>📞 {detailMb.telephone}</span>}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Badge color={detailMb.aJour?C.green:C.danger}>{detailMb.aJour?"✓ À jour":"✗ Non à jour"}</Badge>
                      <Badge color={detailMb.droitPret?C.green:C.warn}>{detailMb.droitPret?"✓ Droit prêt":"⏸ Bloqué"}</Badge>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:7,alignItems:"center"}}>
                    <Btn bg={C.blue}   sm onClick={()=>openSub("addCotisation",{memberId:`${detailMb.id}`})}>+ Cotisation</Btn>
                    <Btn bg={C.accent} sm onClick={()=>openSub("addLoan",{emprunteurId:`${detailMb.id}`})}>+ Prêt</Btn>
                    <Btn bg="rgba(255,255,255,0.07)" sm onClick={()=>prtMember(detailMb)}>🖨️</Btn>
                    <button onClick={closeAll} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,lineHeight:1,marginLeft:4}}>✕</button>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"14px 24px",borderBottom:`1px solid ${C.border}`}}>
                  {[{l:"Fonds Caisse",v:fmt(detailMb.fondsCaisse),c:detailMb.aJour?C.green:C.warn},{l:"Fonds Roulement",v:fmt(detailMb.fondsRoulement),c:C.blue},{l:"Part Prorata",v:detailMb.prorata.toFixed(2)+"%",c:C.gold},{l:"Prêt actif",v:detailMb.loanActif?fmt(detailMb.loanActif.montantDu):"Aucun",c:detailMb.loanActif?C.danger:C.muted}].map((s,i)=>(
                    <div key={i} style={{background:C.card2,borderRadius:10,padding:"10px 12px",border:`1px solid ${s.c}33`}}>
                      <div style={{fontSize:13,fontWeight:800,color:s.c,marginBottom:3}}>{s.v}</div>
                      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:0.6}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"0 24px 24px"}}>
                  <SectionLabel label={`💰 Cotisations — ${detailCotis.filter(c=>!c.auto).length} manuelles + ${detailCotis.filter(c=>c.auto).length} auto`}/>
                  {detailCotis.length===0
                    ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"14px 0"}}>Aucune cotisation</div>
                    :<div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                        <div style={{background:`${C.blue}14`,border:`1px solid ${C.blue}30`,borderRadius:10,padding:"10px 14px"}}>
                          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",marginBottom:3}}>🏦 Fonds de Caisse</div>
                          <div style={{fontSize:15,fontWeight:800,color:C.blue}}>{fmt(detailCotisC.reduce((s,c)=>s+c.montant,0))}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{detailCotisC.length} versement{detailCotisC.length!==1?"s":""}</div>
                        </div>
                        <div style={{background:`${C.green}14`,border:`1px solid ${C.green}30`,borderRadius:10,padding:"10px 14px"}}>
                          <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",marginBottom:3}}>🔄 Fonds de Roulement</div>
                          <div style={{fontSize:15,fontWeight:800,color:C.green}}>{fmt(detailCotisR.reduce((s,c)=>s+c.montant,0))}</div>
                          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{detailCotisR.length} versement{detailCotisR.length!==1?"s":""}</div>
                        </div>
                      </div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead><tr>{["Date","Heure","Type / Opération","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                        <tbody>{detailCotis.map(c=>{
                          const isD=c.direction==="debit", isCr=c.direction==="credit"&&c.auto;
                          const bColor=isD?C.warn:isCr?C.green:c.type==="caisse"?C.blue:C.green;
                          const bLabel=isD?`📤 ${c.label||"Contribution"}`:(isCr?`📥 ${c.label||"Retour"}`:c.type==="caisse"?"🏦 Fonds Caisse":"🔄 Fonds Roulement");
                          return(<tr key={c.id}>
                            <TD s={{fontSize:11,color:C.muted}}>{c.date}</TD>
                            <TD s={{fontSize:11,color:C.muted}}>{c.heure||"—"}</TD>
                            <TD><Badge color={bColor}>{bLabel}</Badge></TD>
                            <TD><strong style={{color:isD?C.danger:C.gold}}>{isD?"−":"+"} {fmt(c.montant)}</strong></TD>
                            <TD>{c.auto?<span style={{fontSize:10,color:C.muted,fontStyle:"italic"}}>auto</span>:<div style={{display:"flex",gap:3}}><Btn bg={C.gold} xs onClick={()=>openSub("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn><Btn bg={C.danger} xs onClick={()=>doDeleteCotisation(c.id)}>🗑️</Btn></div>}</TD>
                          </tr>);
                        })}</tbody>
                      </table>
                    </div>}

                  <SectionLabel label={`💳 Prêts — ${detailLoans.length} au total`}/>
                  {detailLoans.length===0
                    ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"14px 0"}}>Aucun prêt</div>
                    :<table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                      <thead><tr>{["Date","Montant","Intérêts","Total Dû","Échéance","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                      <tbody>{detailLoans.map(l=>{const d=dLeft(l.echeance);return(<tr key={l.id}>
                        <TD s={{fontSize:11,color:C.muted}}>{l.date}</TD>
                        <TD>{fmt(l.montant)}</TD>
                        <TD s={{color:C.gold}}>{fmt(l.interets)}</TD>
                        <TD><strong style={{color:C.accent}}>{fmt(l.montantDu)}</strong></TD>
                        <TD><div style={{fontSize:11}}>{l.echeance}</div>{l.status==="actif"&&<div style={{fontSize:10,color:d<=0?C.danger:d<=30?C.warn:C.muted}}>{d<=0?`🚨 ${Math.abs(d)}j`:`${d}j restants`}</div>}</TD>
                        <TD><Badge color={l.status==="actif"?C.warn:C.green}>{l.status==="actif"?"En cours":"Remboursé"}</Badge></TD>
                        <TD><div style={{display:"flex",gap:3}}>
                          {l.status==="actif"&&<Btn bg={C.green} xs onClick={()=>openSub("repayLoan",{loanId:`${l.id}`})}>✓ Payer</Btn>}
                          <Btn bg={C.gold}   xs onClick={()=>openSub("editLoan",{loanId:`${l.id}`,montant:`${l.montant}`,date:l.date,assistantId:`${l.assistantId||""}`,emprunteurId:`${l.emprunteurId}`})}>✏️</Btn>
                          <Btn bg={C.danger} xs onClick={()=>doDeleteLoan(l.id)}>🗑️</Btn>
                        </div></TD>
                      </tr>);})}
                      </tbody>
                    </table>}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ══ IMPORT ══ */}
      {importData && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, backdropFilter:"blur(6px)" }}>
          <div style={{ background:C.card, borderRadius:16, padding:28, width:540, maxWidth:"95vw", border:`1px solid ${C.border}`, boxShadow:"0 24px 80px rgba(0,0,0,.8)", maxHeight:"90vh", overflowY:"auto" }}>
            {importStep===1&&<div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:6,color:C.gold}}>📂 Aperçu</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:18}}>Exporté le : {importData._exported_label||"inconnu"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
                {[{l:"Membres",v:(importData.members||[]).length,c:C.blue},{l:"Prêts",v:(importData.loans||[]).length,c:C.gold},{l:"Sanctions",v:(importData.sanctions||[]).length,c:C.warn},{l:"Fonds Asso",v:fmt(importData.fondsAsso||0),c:C.purple}].map((s,i)=>(
                  <div key={i} style={{background:C.card2,borderRadius:10,padding:"10px 14px",border:`1px solid ${s.c}33`}}><div style={{fontSize:15,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{s.l}</div></div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn bg={C.muted} onClick={()=>{setImportData(null);setImportStep(0);}}>Annuler</Btn><Btn bg={C.blue} onClick={doImportMerge}>🔀 Fusionner</Btn><Btn bg={C.danger} onClick={doImportReplace}>♻️ Remplacer</Btn></div>
            </div>}
            {importStep===2&&<div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:6,color:C.danger}}>⚠️ {importConf.length} conflit(s)</div>
              <div style={{maxHeight:260,overflowY:"auto",marginBottom:14,border:`1px solid ${C.border}`,borderRadius:10}}>
                {importConf.map((c,i)=>(
                  <div key={i} style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:12}}>
                    <div style={{fontWeight:700,color:c.type==="membre"?C.blue:C.gold,marginBottom:5}}>{c.type==="membre"?"👤":"💳"} Conflit</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div style={{background:`${C.green}15`,borderRadius:8,padding:"7px 10px"}}><div style={{color:C.green,fontWeight:700,fontSize:10,marginBottom:3}}>EXISTANT</div><div>{c.type==="membre"?c.existing.name:fmt(c.existing.montant)}</div></div>
                      <div style={{background:`${C.warn}15`,borderRadius:8,padding:"7px 10px"}}><div style={{color:C.warn,fontWeight:700,fontSize:10,marginBottom:3}}>IMPORTÉ</div><div>{c.type==="membre"?c.imported.name:fmt(c.imported.montant)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn bg={C.muted} onClick={()=>{setImportData(null);setImportStep(0);}}>Annuler</Btn><Btn bg={C.blue} onClick={doImportMerge}>🔀 Fusionner</Btn><Btn bg={C.danger} onClick={doImportReplace}>♻️ Remplacer</Btn></div>
            </div>}
          </div>
        </div>
      )}
    </div>
  );
}