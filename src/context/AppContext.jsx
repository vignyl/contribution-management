import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { sha1, uid, tod, SK, DEFAULT_USER, DEFAULT_PASS_HASH, SEUIL, calcMontantActuel, add3M, dLeft, nowLbl, doPrint, fmt, fmtDate } from '../utils';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  /* ── Auth ── */
  const [authed,      setAuthed]      = useState(false);
  const [loginU,      setLoginU]      = useState("");
  const [loginP,      setLoginP]      = useState("");
  const [loginErr,    setLoginErr]    = useState("");
  const [authCreds,   setAuthCreds]   = useState({ username:DEFAULT_USER, passHash:DEFAULT_PASS_HASH });

  /* ── App state ── */
  const [ready,       setReady]       = useState(false);
  const [tab,         setTab]         = useState("dashboard");
  const [cotisSubTab, setCotisSubTab] = useState("tous");
  const [members,     setMembers]     = useState([]);
  const [loans,       setLoans]       = useState([]);
  const [assist,      setAssist]      = useState([]);
  const [history,     setHistory]     = useState([]);
  // fondsAsso is now computed live
  const [cotisations, setCotisations] = useState([]);
  const [dismissed,   setDismissed]   = useState([]);
  const [sanctions,   setSanctions]   = useState([]);
  const [sorties,     setSorties]     = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [dailyContributions, setDailyContributions] = useState([]);
  const [modal,       setModal]       = useState(null);
  const [parentModal, setParentModal] = useState(null);
  const [form,        setForm]        = useState({});
  const [editFA,      setEditFA]      = useState(false);
  const [editFAV,     setEditFAV]     = useState("");
  const [importData,  setImportData]  = useState(null);
  const [importConf,  setImportConf]  = useState([]);
  const [importStep,  setImportStep]  = useState(0);

  /* ── Filtres ── */
  const [fMbr,  setFMbr]  = useState("tous");
  const [fLoan, setFLoan] = useState("tous");
  const [fSanc, setFSanc] = useState("tous");
  const [fSancMember, setFSancMember] = useState("");
  const [fCotisName, setFCotisName] = useState("");

  /* ── Historique groupé ── */
  const [histGroup, setHistGroup] = useState(false);

  /* ── Chargement ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const load = async (k) => {
        try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
        catch { return null; }
      };
      const [m,l,a,h,f,c,d,s,so,ac,se,dc] = await Promise.all([
        load(SK.members), load(SK.loans), load(SK.assist), load(SK.history),
        load(SK.fondsAsso), load(SK.cotisations), load(SK.dismissed),
        load(SK.sanctions), load(SK.sorties), load(SK.authCreds),
        load(SK.sessions), load(SK.dailyContributions),
      ]);
      if (m)  setMembers(m);       if (l)  setLoans(l);        if (a)  setAssist(a);
      if (h)  setHistory(h);
      if (c)  setCotisations(c);   if (d)  setDismissed(d);
      if (s)  setSanctions(s);     if (so) setSorties(so);
      if (ac) setAuthCreds(ac);
      if (se) setSessions(se);     if (dc) setDailyContributions(dc);
      setReady(true);
    })();
  }, []);

  /* ── Sauvegarde auto ────────────────────────────────────────────────────── */
  const save = useCallback(async (k,v) => {
    try { await window.storage.set(k, JSON.stringify(v)); } catch {}
  }, []);
  useEffect(() => { if (ready) save(SK.members,     members);     }, [members,     ready, save]);
  useEffect(() => { if (ready) save(SK.loans,       loans);       }, [loans,       ready, save]);
  useEffect(() => { if (ready) save(SK.assist,      assist);      }, [assist,      ready, save]);
  useEffect(() => { if (ready) save(SK.history,     history);     }, [history,     ready, save]);
  useEffect(() => { if (ready) save(SK.cotisations, cotisations); }, [cotisations, ready, save]);
  useEffect(() => { if (ready) save(SK.dismissed,   dismissed);   }, [dismissed,   ready, save]);
  useEffect(() => { if (ready) save(SK.sanctions,   sanctions);   }, [sanctions,   ready, save]);
  useEffect(() => { if (ready) save(SK.sorties,     sorties);     }, [sorties,     ready, save]);
  useEffect(() => { if (ready) save(SK.authCreds,   authCreds);   }, [authCreds,   ready, save]);
  useEffect(() => { if (ready) save(SK.sessions,    sessions);    }, [sessions,    ready, save]);
  useEffect(() => { if (ready) save(SK.dailyContributions, dailyContributions); }, [dailyContributions, ready, save]);

  /* ── Dérivés ────────────────────────────────────────────────────────────── */
  const totFR    = useMemo(() => members.reduce((s,m) => s+m.fondsRoulement, 0), [members]);
  const totFC    = useMemo(() => members.reduce((s,m) => s+m.fondsCaisse, 0), [members]);
  const actLoans = useMemo(() => loans.filter(l => l.status==="actif"), [loans]);
  const totDette = useMemo(() => actLoans.reduce((s,l) => s + calcMontantActuel(l, tod()).montantDu, 0), [actLoans]);
  const totGains = useMemo(() => loans.filter(l=>l.status==="rembourse").reduce((s,l)=>s+(l.interetsRembourse || l.interets),0), [loans]);

  const membersX = useMemo(() => members.map(m => ({
    ...m,
    prorata:   totFR > 0 ? (m.fondsRoulement / totFR) * 100 : 0,
    aJour:     m.fondsCaisse >= SEUIL,
    droitPret: !assist.some(a => a.assistantId===m.id && loans.some(l=>l.id===a.loanId && l.status==="actif")),
    loanActif: actLoans.find(l => l.emprunteurId===m.id),
  })), [members, totFR, assist, actLoans, loans]);

  const fondsAsso = useMemo(() => {
    const fromLoans = loans.filter(l => l.status==="rembourse").reduce((s,l) => s + (l.fraisAssoRembourse || 0), 0);
    const fromSanctions = sanctions.filter(s => s.status==="payee").reduce((s,sanc) => s + sanc.montant, 0);
    const fromSorties = sorties.filter(s => s.source==="asso").reduce((s,so) => s + so.montant, 0);
    return fromLoans + fromSanctions - fromSorties;
  }, [loans, sanctions, sorties]);

  /* ── Listes filtrées ── */
  const filteredMembers = useMemo(() => {
    if (fMbr === "ajour")    return membersX.filter(m => m.aJour);
    if (fMbr === "nonajour") return membersX.filter(m => !m.aJour);
    if (fMbr === "loan")     return membersX.filter(m => !!m.loanActif);
    return membersX;
  }, [membersX, fMbr]);

  const filteredLoans = useMemo(() => {
    const base = [...loans].sort((a,b) => new Date(b.date)-new Date(a.date));
    if (fLoan === "actif")     return base.filter(l => l.status==="actif");
    if (fLoan === "retard")    return base.filter(l => l.status==="actif" && dLeft(l.echeance)<=0);
    if (fLoan === "rembourse") return base.filter(l => l.status==="rembourse");
    return base;
  }, [loans, fLoan]);

  const filteredSanctions = useMemo(() => {
    let base = [...sanctions].sort((a,b) => new Date(b.date)-new Date(a.date));
    if (fSanc === "en_attente") base = base.filter(s => s.status==="en_attente");
    if (fSanc === "payee")      base = base.filter(s => s.status==="payee");
    if (fSancMember)            base = base.filter(s => s.memberId === parseInt(fSancMember));
    return base;
  }, [sanctions, fSanc, fSancMember]);

  const alerts = useMemo(() => {
    const r = [];
    actLoans.forEach(l => {
      const d = dLeft(l.echeance), m = members.find(x => x.id===l.emprunteurId);
      if (d <= 30) r.push({ key:`loan-${l.id}`, t:d<=0?"danger":"warn", msg:`${m?.name} — ${d<=0?`RETARD ${Math.abs(d)}j`:`Échéance dans ${d}j`} (${l.echeance})`, amt:new Intl.NumberFormat("fr-FR").format(Math.round(l.montantDu || 0)) + " FCFA" });
    });
    members.filter(m => m.fondsCaisse < SEUIL).forEach(m =>
      r.push({ key:`caisse-${m.id}`, t:"info", msg:`${m.name} — Fonds de Caisse insuffisant (${new Intl.NumberFormat("fr-FR").format(Math.round(m.fondsCaisse || 0)) + " FCFA"} / ${new Intl.NumberFormat("fr-FR").format(Math.round(SEUIL || 0)) + " FCFA"} requis)` })
    );
    sanctions.filter(s => s.status==="en_attente").forEach(s => {
      const m = members.find(x => x.id===s.memberId);
      if (m) r.push({ key:`sanction-${s.id}`, t:"warn", msg:`⚠️ Sanction en attente — ${m.name} : ${s.raison} (${new Intl.NumberFormat("fr-FR").format(Math.round(s.montant || 0)) + " FCFA"})` });
    });
    return r;
  }, [actLoans, members, sanctions]);

  const visibleAlerts = useMemo(() => alerts.filter(a => !dismissed.includes(a.key)), [alerts, dismissed]);

  /* ── Historique groupé ── */
  const histGrouped = useMemo(() => {
    const g = {};
    history.forEach(h => {
      if (!g[h.action]) g[h.action] = [];
      g[h.action].push(h);
    });
    return Object.entries(g).sort((a,b) => b[1].length - a[1].length);
  }, [history]);

  /* ── Helpers modales ────────────────────────────────────────────────────── */
  const pushH = (action, detail, montant=0, dt=null) =>
    setHistory(h => [{ id:uid(), date:dt||tod(), heure:new Date().toLocaleTimeString("fr-FR"), action, detail, montant }, ...h]);

  const openSub = (type, data={}) => { setParentModal(modal); setModal({ type, data }); setForm({ date:tod(), ...data }); };
  const openM   = (type, data={}) => { setParentModal(null);  setModal({ type, data }); setForm({ date:tod(), ...data }); };
  const closeM  = () => {
    if (parentModal) { setModal(parentModal); setForm({ date:tod(), ...parentModal.data }); setParentModal(null); }
    else { setModal(null); setForm({}); }
  };
  const closeAll = () => { setModal(null); setParentModal(null); setForm({}); };
  const dismissAlert = (key) => setDismissed(d => d.includes(key) ? d : [...d, key]);
  const sf = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  /* ── Auth ────────────────────────────────────────────────────────────────── */
  const doLogin = () => {
    setLoginErr("");
    const u = loginU.trim(), p = loginP;
    if (!u || !p) { setLoginErr("Remplissez tous les champs."); return; }
    const creds = authCreds || { username:DEFAULT_USER, passHash:DEFAULT_PASS_HASH };
    if (u !== creds.username || sha1(p) !== creds.passHash) {
      setLoginErr("Identifiant ou mot de passe incorrect."); return;
    }
    setAuthed(true); setLoginU(""); setLoginP("");
  };

  const doLogout = () => { setAuthed(false); setModal(null); setParentModal(null); setForm({}); };

  const doChangeCredentials = () => {
    const cu = form.curPass, nu = form.newUser?.trim(), np = form.newPass, nc = form.confPass;
    if (!cu || !nu || !np || !nc) { alert("Remplissez tous les champs."); return; }
    if (sha1(cu) !== authCreds.passHash) { alert("Mot de passe actuel incorrect."); return; }
    if (np !== nc) { alert("Les nouveaux mots de passe ne correspondent pas."); return; }
    if (np.length < 4) { alert("Minimum 4 caractères."); return; }
    setAuthCreds({ username:nu, passHash:sha1(np) });
    alert("Identifiants mis à jour.");
    closeM();
  };

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
    setMembers(ms => ms.map(m => m.id===id ? { ...m, name:form.name.trim(), ville:(form.ville||"").trim(), telephone:(form.telephone||"").trim() } : m));
    pushH("Modif. Membre", form.name.trim());
    closeM();
  };
  const doDeleteMember = (id) => {
    const mb = members.find(m => m.id===id);
    if (loans.some(l => l.emprunteurId===id && l.status==="actif")) { alert(`Impossible — ${mb?.name} a un prêt actif.`); return; }
    if (!window.confirm(`Supprimer ${mb?.name} et toutes ses données ?`)) return;
    setMembers(ms => ms.filter(m => m.id!==id));
    setLoans(ls => ls.filter(l => l.emprunteurId!==id));
    setCotisations(cs => cs.filter(c => c.memberId!==id));
    setAssist(as => as.filter(a => a.assistantId!==id));
    setSanctions(ss => ss.filter(s => s.memberId!==id));
    pushH("Suppression Membre", mb?.name||"");
  };

  /* ── CRUD Cotisations ───────────────────────────────────────────────────── */
  const doAddCotisation = () => {
    const mid = parseInt(form.memberId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m => m.id===mid);
    if (!mb || !form.type || !montant || montant<=0) { alert("Remplissez tous les champs."); return; }
    const cot = { id:uid(), memberId:mid, type:form.type, montant, date, heure:new Date().toLocaleTimeString("fr-FR") };
    setCotisations(cs => [...cs, cot]);
    setMembers(ms => ms.map(m => m.id!==mid ? m : form.type==="caisse" ? { ...m, fondsCaisse:m.fondsCaisse+montant } : { ...m, fondsRoulement:m.fondsRoulement+montant }));
    setHistory(h => [{ id:uid(), date, heure:new Date().toLocaleTimeString("fr-FR"), action:`Cotisation ${form.type==="caisse"?"Fonds de Caisse":"Fonds de Roulement"}`, detail:mb.name, montant }, ...h]);
    closeM();
  };
  const doEditCotisation = () => {
    const cotId = parseInt(form.cotisId), old = cotisations.find(c => c.id===cotId);
    if (!old) return;
    if (old.auto) { alert("Entrée générée automatiquement — non modifiable."); closeM(); return; }
    const newM = parseFloat(form.montant), newT = form.type, newD = form.date||tod();
    if (!newT || !newM || newM<=0) return;
    const mb = members.find(m => m.id===old.memberId);
    const dc = (newT==="caisse"?newM:0) - (old.type==="caisse"?old.montant:0);
    const dr = (newT==="roulement"?newM:0) - (old.type==="roulement"?old.montant:0);
    setMembers(ms => ms.map(m => m.id===old.memberId ? { ...m, fondsCaisse:m.fondsCaisse+dc, fondsRoulement:m.fondsRoulement+dr } : m));
    setCotisations(cs => cs.map(c => c.id===cotId ? { ...c, type:newT, montant:newM, date:newD } : c));
    pushH("Modif. Cotisation", `${mb?.name} — ${newT} ${newM}`, newM, newD);
    closeM();
  };
  const doDeleteCotisation = (cotId) => {
    const c = cotisations.find(x => x.id===cotId); if (!c) return;
    if (c.auto) { alert("Entrée auto — supprimez le prêt associé pour la retirer."); return; }
    const mb = members.find(m => m.id===c.memberId);
    if (!window.confirm(`Supprimer ce versement de ${c.montant} ?`)) return;
    setMembers(ms => ms.map(m => m.id!==c.memberId ? m : { ...m, fondsCaisse:c.type==="caisse"?m.fondsCaisse-c.montant:m.fondsCaisse, fondsRoulement:c.type==="roulement"?m.fondsRoulement-c.montant:m.fondsRoulement }));
    setCotisations(cs => cs.filter(x => x.id!==cotId));
    pushH("Suppression Cotisation", `${mb?.name} — ${c.type} ${c.montant}`);
  };

  /* ── CRUD Prêts ─────────────────────────────────────────────────────────── */
  const calcContribs = (currentMembers, loanMontant) => {
    const t = currentMembers.reduce((s,m) => s+m.fondsRoulement, 0);
    return currentMembers.map(m => ({ memberId:m.id, pct:t>0?m.fondsRoulement/t:0, montantContrib:t>0?(m.fondsRoulement/t)*loanMontant:0 }));
  };

  const doAddLoan = () => {
    try {
      const rawId = form.emprunteurId, montant = parseFloat(form.montant), date = form.date||tod();
      if (!rawId || rawId==="") { alert("Sélectionnez un emprunteur."); return; }
      if (isNaN(montant) || montant<=0) { alert("Montant invalide."); return; }
      const empr = members.find(m => `${m.id}`===`${rawId}`);
      if (!empr) { alert(`Emprunteur introuvable.`); return; }
      const emprId = empr.id;
      const rawAssist = form.assistantId;
      const assistMb = rawAssist && rawAssist!=="" ? members.find(m => `${m.id}`===`${rawAssist}`) : null;
      const assistId = assistMb ? assistMb.id : null;
      const interets = montant*0.1, fraisAsso = montant*0.02, gainMbr = montant*0.08;
      const totalFR = members.reduce((s,m) => s+(m.fondsRoulement||0), 0);
      const contribs = members.map(m => { const fr=m.fondsRoulement||0, pct=totalFR>0?fr/totalFR:1/members.length; return { memberId:m.id, pct, montantContrib:pct*montant }; });
      const loanId = uid(), now = new Date().toLocaleTimeString("fr-FR");
      const newLoan = { id:loanId, emprunteurId:emprId, montant, interets, montantDu:montant+interets, fraisAsso, gainMbr, date, echeance:add3M(date), status:"actif", assistantId:assistId, contributions:contribs };
      setLoans(prev => [...prev, newLoan]);
      if (assistId) setAssist(prev => [...prev, { assistantId:assistId, loanId }]);
      setMembers(prev => prev.map(m => { const c=contribs.find(x=>x.memberId===m.id); return c ? { ...m, fondsRoulement:(m.fondsRoulement||0)-c.montantContrib } : m; }));
      const t0 = uid();
      setCotisations(prev => [...prev, ...contribs.map((c,i) => ({ id:t0+i, memberId:c.memberId, type:"roulement", direction:"debit", auto:true, loanId, label:"Contribution prêt", montant:c.montantContrib, date, heure:now }))]);
      pushH("Prêt accordé", `${empr.name}${assistMb?` (Asst: ${assistMb.name})`:""}`, montant);
      setModal(null); setParentModal(null); setForm({}); setTab("prets");
    } catch(err) { alert(`Erreur : ${err.message}`); }
  };

  const doEditLoan = () => {
    const loanId = parseInt(form.loanId), old = loans.find(l => l.id===loanId);
    if (!old) return;
    const newM = parseFloat(form.montant), newDate = form.date||tod(), newAssistId = form.assistantId?parseInt(form.assistantId):null;
    if (!newM || newM<=0) { alert("Montant invalide."); return; }
    const newI=newM*0.1, newFA=newM*0.02, newGM=newM*0.08, now=new Date().toLocaleTimeString("fr-FR");
    if (old.status==="actif") {
      const restored = members.map(m => { const c=(old.contributions||[]).find(x=>x.memberId===m.id); return c ? { ...m, fondsRoulement:m.fondsRoulement+c.montantContrib } : m; });
      const newContribs = calcContribs(restored, newM);
      setMembers(restored.map(m => { const c=newContribs.find(x=>x.memberId===m.id); return c ? { ...m, fondsRoulement:m.fondsRoulement-c.montantContrib } : m; }));
      const newDebits = newContribs.filter(c=>c.montantContrib>0).map((c,i) => ({ id:uid()+i, memberId:c.memberId, type:"roulement", direction:"debit", auto:true, loanId, label:"Contribution prêt (modifié)", montant:c.montantContrib, date:newDate, heure:now }));
      setCotisations(cs => [...cs.filter(c=>!(c.loanId===loanId&&c.direction==="debit")), ...newDebits]);
      setLoans(ls => ls.map(l => l.id===loanId ? { ...l, montant:newM, interets:newI, montantDu:newM+newI, fraisAsso:newFA, gainMbr:newGM, date:newDate, echeance:add3M(newDate), assistantId:newAssistId, contributions:newContribs } : l));
    } else {
      setLoans(ls => ls.map(l => l.id===loanId ? { ...l, montant:newM, interets:newI, montantDu:newM+newI, fraisAsso:newFA, gainMbr:newGM, date:newDate, echeance:add3M(newDate) } : l));
    }
    setAssist(as => { const f=as.filter(a=>a.loanId!==loanId); return newAssistId ? [...f, { assistantId:newAssistId, loanId }] : f; });
    pushH("Modif. Prêt", `#${loanId} → ${newM}`, newM);
    closeM();
  };

  const doDeleteLoan = (loanId) => {
    const loan = loans.find(l => l.id===loanId); if (!loan) return;
    const empr = members.find(m => m.id===loan.emprunteurId);
    if (!window.confirm(`Supprimer le prêt ${loan.status==="actif"?"ACTIF ⚠️":"remboursé"} de ${loan.montant} — ${empr?.name} ?`)) return;
    if (loan.status==="actif") {
      setMembers(ms => ms.map(m => { const c=(loan.contributions||[]).find(x=>x.memberId===m.id); return c ? { ...m, fondsRoulement:m.fondsRoulement+c.montantContrib } : m; }));
      setCotisations(cs => cs.filter(c => c.loanId!==loanId));
      setAssist(as => as.filter(a => a.loanId!==loanId));
    }
    setLoans(ls => ls.filter(l => l.id!==loanId));
    pushH("Suppression Prêt", `${empr?.name} — ${loan.montant}`);
  };

  const doRepay = (loanId, repayDate) => {
    const loan = loans.find(l => l.id===loanId); if (!loan) return;
    const date = repayDate||tod(), now = new Date().toLocaleTimeString("fr-FR");
    const { montantDu, interets, fraisAsso, gainMbr } = calcMontantActuel(loan, date);
    const contribs = loan.contributions || [];
    if (contribs.length===0) {
      setMembers(ms => { const t=ms.reduce((s,m)=>s+m.fondsRoulement,0); return ms.map(m => ({ ...m, fondsRoulement:m.fondsRoulement+(t>0?(m.fondsRoulement/t)*gainMbr:0) })); });
    } else {
      const retours = contribs.map((c,i) => {
        const retour = c.montantContrib + c.pct*gainMbr;
        return { memberId:c.memberId, montant:retour, cot:{ id:uid()+i, memberId:c.memberId, type:"roulement", direction:"credit", auto:true, loanId, label:`Retour prêt + gains (${interets>0?"+"+Math.round(interets)+" FCFA d'intérêts":""})`, montant:retour, date, heure:now } };
      });
      setMembers(ms => ms.map(m => { const r=retours.find(x=>x.memberId===m.id); return r ? { ...m, fondsRoulement:m.fondsRoulement+r.montant } : m; }));
      setCotisations(cs => [...cs, ...retours.map(r=>r.cot)]);
    }
    setLoans(ls => ls.map(l => l.id===loanId ? { ...l, status:"rembourse", dateRembours:date, montantRembourse:montantDu, interetsRembourse:interets, fraisAssoRembourse:fraisAsso } : l));
    setAssist(as => as.filter(a => a.loanId!==loanId));
    const empr = members.find(m => m.id===loan.emprunteurId);
    pushH("Remboursement", `${empr?.name} — Intérêts: ${interets} | Gains mbr: ${gainMbr} | Asso: ${fraisAsso}`, montantDu, date);
    closeM();
  };

  /* ── CRUD Sanctions ─────────────────────────────────────────────────────── */
  const doAddSanction = () => {
    const memberId = parseInt(form.memberId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m => m.id===memberId);
    if (!mb) { alert("Sélectionnez un membre."); return; }
    if (!montant || montant<=0) { alert("Montant invalide."); return; }
    if (!form.raison?.trim()) { alert("La raison est obligatoire."); return; }
    setSanctions(ss => [...ss, { id:uid(), memberId, montant, date, raison:form.raison.trim(), status:"en_attente" }]);
    pushH("Sanction créée", `${mb.name} — ${form.raison.trim()}`, montant);
    closeM();
  };
  const doEditSanction = () => {
    const id = parseInt(form.sancId), montant = parseFloat(form.montant), date = form.date||tod();
    const mb = members.find(m => m.id===parseInt(form.memberId));
    if (!mb || !montant || montant<=0 || !form.raison?.trim()) { alert("Remplissez tous les champs."); return; }
    setSanctions(ss => ss.map(s => s.id===id ? { ...s, memberId:parseInt(form.memberId), montant, date, raison:form.raison.trim() } : s));
    pushH("Modif. Sanction", `${mb.name} — ${form.raison.trim()}`, montant);
    closeM();
  };
  const doDeleteSanction = (id) => {
    const s = sanctions.find(x => x.id===id); if (!s) return;
    const mb = members.find(m => m.id===s.memberId);
    if (s.status==="payee") { alert("Sanction déjà remboursée — impossible à supprimer."); return; }
    if (!window.confirm(`Supprimer la sanction de ${s.montant} pour ${mb?.name} ?`)) return;
    setSanctions(ss => ss.filter(x => x.id!==id));
    pushH("Suppression Sanction", `${mb?.name} — ${s.raison}`);
  };
  const doPaySanction = (id) => {
    const s = sanctions.find(x => x.id===id); if (!s || s.status==="payee") return;
    const mb = members.find(m => m.id===s.memberId);
    setSanctions(ss => ss.map(x => x.id===id ? { ...x, status:"payee", datePaiement:tod() } : x));
    pushH("Sanction remboursée", `${mb?.name} — ${s.raison}`, s.montant);
    setDismissed(d => d.includes(`sanction-${id}`) ? d : [...d, `sanction-${id}`]);
  };

  /* ── Cotisation du Jour ─────────────────────────────────────────────────── */
  const doAddSession = () => {
    if (!form.sessionName?.trim()) return;
    const newSession = { id: uid(), name: form.sessionName.trim(), startDate: form.date || tod() };
    setSessions(prev => [...prev, newSession]);
    pushH("Nouvelle Session", form.sessionName.trim());
    sf("sessionId")(newSession.id);
    sf("sessionName")("");
  };

  const doSaveDailyMetadata = () => {
    const { date, sessionId, hostId, beneficiaryId, editId } = form;
    if (!date || !sessionId || !hostId || !beneficiaryId) return;

    const dailyId = editId || uid();
    const existing = dailyContributions.find(d => d.id === dailyId);

    if (existing) {
      setDailyContributions(prev => prev.map(d => d.id === dailyId ? { ...d, date, sessionId: parseInt(sessionId), hostId: parseInt(hostId), beneficiaryId: parseInt(beneficiaryId) } : d));
    } else {
      const newDC = { id: dailyId, date, sessionId: parseInt(sessionId), hostId: parseInt(hostId), beneficiaryId: parseInt(beneficiaryId), tBen: 0, tPaq: 0, tPre: 0, tRec: 0, rows: members.map(m => ({ memberId: m.id, name: m.name, beneficiaryAmt: "", presenceAmt: "", packetAmt: "", sanctionAmt: "", sanctionReason: "", receptionAmt: "" })) };
      setDailyContributions(prev => [newDC, ...prev]);
      sf("editId")(dailyId);
      sf("rows")(newDC.rows);
      pushH("Début Cotis. Jour", `${date}`);
    }
  };

  const doUpdateDailyRow = (memberId, field, value) => {
    const dailyId = form.editId;
    if (!dailyId) return;

    const mid = parseInt(memberId);
    const ben = members.find(m => `${m.id}` === `${form.beneficiaryId}`);
    const now = new Date().toLocaleTimeString("fr-FR");

    setDailyContributions(prev => prev.map(dc => {
      if (dc.id !== dailyId) return dc;
      const newRows = dc.rows.map(r => {
        if (r.memberId !== mid) return r;
        const oldRow = { ...r };
        const newRow = { ...r, [field]: value };

        // --- Application des impacts financiers ---
        
        // Seules les sanctions impactent le système global car elles sont recouvrables plus tard
        const oldS = parseFloat(oldRow.sanctionAmt || 0), newS = parseFloat(newRow.sanctionAmt || 0);
        if (oldS !== newS || (field === "sanctionReason" && value !== oldRow.sanctionReason)) {
          setSanctions(ss => {
            const filtered = ss.filter(s => !(s.dailyId === dailyId && s.memberId === mid));
            if (newS > 0 && (field === "sanctionReason" ? value : newRow.sanctionReason)?.trim()) {
              return [...filtered, { id: uid() + Math.random(), memberId: mid, montant: newS, date: dc.date, raison: (field === "sanctionReason" ? value : newRow.sanctionReason).trim(), status: "en_attente", dailyId }];
            }
            return filtered;
          });
        }

        return newRow;
      });

      const tBen = newRows.reduce((s, r) => s + (parseFloat(r.beneficiaryAmt) || 0), 0);
      const tPaq = newRows.reduce((s, r) => s + (parseFloat(r.packetAmt) || 0), 0);
      const tPre = newRows.reduce((s, r) => s + (parseFloat(r.presenceAmt) || 0), 0);
      const tRec = newRows.reduce((s, r) => s + (parseFloat(r.receptionAmt) || 0), 0);
      
      sf("rows")(newRows);
      
      return { ...dc, rows: newRows, tBen, tPaq, tPre, tRec };
    }));
  };

  const doAddDailyCotis = () => {
    closeM();
  };

  const doDeleteDailyCotis = (id) => {
    const dc = dailyContributions.find(d => d.id === id);
    if (!dc) return;
    if (!window.confirm(`Supprimer cette cotisation du jour (${dc.date}) et annuler tous ses mouvements ?`)) return;

    const relatedCots = cotisations.filter(c => c.dailyId === id);

    setMembers(ms => ms.map(m => {
      const c = relatedCots.find(x => x.memberId === m.id && x.type === "caisse");
      return c ? { ...m, fondsCaisse: (m.fondsCaisse || 0) - c.montant } : m;
    }));
    setCotisations(cs => cs.filter(c => c.dailyId !== id));
    setSanctions(ss => ss.filter(s => s.dailyId !== id));
    setDailyContributions(prev => prev.filter(d => d.id !== id));
    pushH("Suppression Cotis. Jour", dc.date);
  };

  const doPrintReceptionReport = (dailyId, sessionId = null) => {
    let dcs = [];
    let title = "";
    
    if (sessionId) {
      const sess = sessions.find(s => s.id === parseInt(sessionId));
      title = `Rapport de Session — ${sess?.name || "Inconnue"}`;
      dcs = dailyContributions.filter(d => d.sessionId === parseInt(sessionId)).sort((a,b) => new Date(a.date) - new Date(b.date));
    } else {
      const dc = dailyContributions.find(d => d.id === dailyId);
      title = `Rapport de Séance — ${dc?.date}`;
      dcs = [dc];
    }

    if (!dcs.length) return alert("Aucune donnée à imprimer");

    let body = "";
    if (sessionId) {
      const sess = sessions.find(s => s.id === parseInt(sessionId));
      const mbrAgg = {};
      dcs.forEach(dc => {
        dc.rows.forEach(r => {
          if (!mbrAgg[r.memberId]) {
            mbrAgg[r.memberId] = { name: r.name, b: 0, p: 0, r: 0, q: 0, s: 0, sd: [] };
          }
          const m = mbrAgg[r.memberId];
          m.b += parseFloat(r.beneficiaryAmt) || 0;
          m.p += parseFloat(r.presenceAmt) || 0;
          m.r += parseFloat(r.receptionAmt) || 0;
          m.q += parseFloat(r.packetAmt) || 0;
          const sa = parseFloat(r.sanctionAmt) || 0;
          m.s += sa;
          if (sa > 0) m.sd.push({ date: dc.date, amt: sa, reason: r.sanctionReason });
        });
      });

      const aggSorted = Object.values(mbrAgg).sort((a,b) => a.name.localeCompare(b.name));
      const tot = aggSorted.reduce((acc, m) => ({ b:acc.b+m.b, p:acc.p+m.p, r:acc.r+m.r, q:acc.q+m.q, s:acc.s+m.s }), { b:0, p:0, r:0, q:0, s:0 });

      body = `
        <div style="background:#fafafa; padding:15px; border-radius:8px; border:1px solid #eee; margin-bottom:20px; font-size:12px;">
          <strong>Session :</strong> ${sess?.name || "—"}<br>
          <strong>Période :</strong> du ${dcs[0]?.date} au ${dcs[dcs.length-1]?.date}<br>
          <strong>Nombre de séances :</strong> ${dcs.length}
        </div>
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th style="text-align:right">Total Bénéf.</th>
              <th style="text-align:right">Total Présence</th>
              <th style="text-align:right">Total Réception</th>
              <th style="text-align:right">Total Paquet</th>
              <th style="text-align:right">Total Sanctions</th>
            </tr>
          </thead>
          <tbody>
            ${aggSorted.map(m => `
              <tr>
                <td><strong>${m.name}</strong></td>
                <td style="text-align:right">${m.b ? fmt(m.b) : "—"}</td>
                <td style="text-align:right">${m.p ? fmt(m.p) : "—"}</td>
                <td style="text-align:right">${m.r ? fmt(m.r) : "—"}</td>
                <td style="text-align:right">${m.q ? fmt(m.q) : "—"}</td>
                <td style="text-align:right">
                  ${m.s ? `<strong>${fmt(m.s)}</strong>${m.sd.length ? `<br/><small style="color:#666; font-size:9px;">${m.sd.map(x=>`${x.date}`).join(", ")}</small>` : ""}` : "—"}
                </td>
              </tr>
            `).join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold; background:#f2f2f8; font-size:14px;">
              <td>TOTAL SESSION</td>
              <td style="text-align:right; color:#f5a623">${fmt(tot.b)}</td>
              <td style="text-align:right; color:#8e44ad">${fmt(tot.p)}</td>
              <td style="text-align:right; color:#e94560">${fmt(tot.r)}</td>
              <td style="text-align:right; color:#27ae60">${fmt(tot.q)}</td>
              <td style="text-align:right; color:#e67e22">${fmt(tot.s)}</td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      const dc = dcs[0];
      const sess = sessions.find(s => s.id === dc.sessionId);
      const host = members.find(m => m.id === dc.hostId);
      const ben = members.find(m => m.id === dc.beneficiaryId);
      
      body = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; font-size:12px; background:#fafafa; padding:15px; border-radius:8px; border:1px solid #eee;">
          <div>
            <strong>Session :</strong> ${sess?.name || "—"}<br>
            <strong>Date :</strong> ${dc.date}
          </div>
          <div>
            <strong>Lieu (Chez) :</strong> ${host?.name || "—"}<br>
            <strong>Bénéficiaire :</strong> <span style="color:#f5a623; font-weight:700;">${ben?.name || "—"}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Membre</th>
              <th style="text-align:right">Bénéficiaire</th>
              <th style="text-align:right">Présence</th>
              <th style="text-align:right">Réception</th>
              <th style="text-align:right">Paquet</th>
              <th style="text-align:right">Sanction</th>
            </tr>
          </thead>
          <tbody>
            ${dc.rows.map(r => {
              const sAmt = parseFloat(r.sanctionAmt) || 0;
              return `
              <tr>
                <td><strong>${r.name}</strong></td>
                <td style="text-align:right">${r.beneficiaryAmt ? fmt(r.beneficiaryAmt) : "—"}</td>
                <td style="text-align:right">${r.presenceAmt ? fmt(r.presenceAmt) : "—"}</td>
                <td style="text-align:right">${r.receptionAmt ? fmt(r.receptionAmt) : "—"}</td>
                <td style="text-align:right">${r.packetAmt ? fmt(r.packetAmt) : "—"}</td>
                <td style="text-align:right">
                  ${sAmt > 0 ? `<strong>${fmt(sAmt)}</strong>${r.sanctionReason ? `<br/><small style="color:#666">${r.sanctionReason}</small>` : ""}` : "—"}
                </td>
              </tr>`;
            }).join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold; background:#f2f2f8; font-size:14px;">
              <td>TOTAL</td>
              <td style="text-align:right; color:#f5a623">${fmt(dc.tBen)}</td>
              <td style="text-align:right; color:#8e44ad">${fmt(dc.tPre)}</td>
              <td style="text-align:right; color:#e94560">${fmt(dc.tRec)}</td>
              <td style="text-align:right; color:#27ae60">${fmt(dc.tPaq)}</td>
              <td style="text-align:right; color:#e67e22">${fmt(dc.rows.reduce((s,r)=>s+(parseFloat(r.sanctionAmt)||0),0))}</td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    doPrint(title, body);
  };

  /* ── CRUD Sorties ───────────────────────────────────────────────────────── */
  const doAddSortie = () => {
    const montant = parseFloat(form.montant), date = form.date||tod();
    if (isNaN(montant) || montant<=0) { alert("Montant invalide."); return; }
    if (!form.raison?.trim()) { alert("La raison est obligatoire."); return; }
    if (!form.source) { alert("Sélectionnez la source."); return; }
    if (form.source==="caisse") {
      const selIds = form.sortieMembers||[];
      if (selIds.length===0) { alert("Choisissez au moins un membre."); return; }
      const partParMembre = montant/selIds.length;
      setMembers(ms => ms.map(m => { if (!selIds.some(id=>`${id}`===`${m.id}`)) return m; return { ...m, fondsCaisse:(m.fondsCaisse||0)-partParMembre }; }));
      const sortie = { id:uid(), montant, date, raison:form.raison.trim(), source:"caisse", heure:new Date().toLocaleTimeString("fr-FR"), memberIds:selIds.map(id=>members.find(m=>`${m.id}`===`${id}`)?.id).filter(Boolean), partParMembre, nbMembres:selIds.length };
      setSorties(ss => [...ss, sortie]);
      pushH("Sortie Fonds Caisse", `${selIds.length} membre(s) — ${partParMembre}/mbr — ${form.raison.trim()}`, montant);
    } else {
      if (montant > fondsAsso) { alert(`Solde insuffisant. Fonds Association : ${fondsAsso}`); return; }
      setSorties(ss => [...ss, { id:uid(), montant, date, raison:form.raison.trim(), source:"asso", heure:new Date().toLocaleTimeString("fr-FR") }]);
      pushH("Sortie Fonds Association", form.raison.trim(), montant);
    }
    closeM();
  };
  const doDeleteSortie = (id) => {
    const s = sorties.find(x => x.id===id); if (!s) return;
    if (!window.confirm(`Annuler et RECRÉDITER ${s.montant} ?`)) return;
    if (s.source==="caisse") {
      const ids = s.memberIds||members.map(m=>m.id), part = s.partParMembre||s.montant/ids.length;
      setMembers(ms => ms.map(m => { if (!ids.some(x=>`${x}`===`${m.id}`)) return m; return { ...m, fondsCaisse:(m.fondsCaisse||0)+part }; }));
    } 
    setSorties(ss => ss.filter(x => x.id!==id));
    pushH("Annulation Sortie", s.raison, 0);
  };

  const doClearData = () => {
    if (!window.confirm("⚠️ Effacer TOUTES les données ? Irréversible.")) return;
    setMembers([]); setLoans([]); setAssist([]); setHistory([]); 
    setCotisations([]); setDismissed([]); setSanctions([]); setSorties([]);
  };

  /* ── Export / Import ────────────────────────────────────────────────────── */
  const doExport = () => {
    const blob = new Blob([JSON.stringify({ _afay_version:"1.2", _exported_label:new Date().toLocaleString("fr-FR"), members, loans, assistance:assist, history, fondsAsso, cotisations, sanctions, sorties }, null, 2)], { type:"application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `AFAY_${tod()}.json`; a.click();
    pushH("Export", `${members.length} membres`);
  };
  const onFileChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target.result);
        if (!raw._afay_version || !Array.isArray(raw.members)) throw new Error("Fichier non reconnu.");
        const cf = [];
        (raw.members||[]).forEach(m => { if (members.find(x=>x.id===m.id)) cf.push({ type:"membre", imported:m, existing:members.find(x=>x.id===m.id) }); });
        (raw.loans||[]).forEach(l => { if (loans.find(x=>x.id===l.id)) cf.push({ type:"pret", imported:l, existing:loans.find(x=>x.id===l.id) }); });
        setImportData(raw); setImportConf(cf); setImportStep(cf.length>0?2:1);
      } catch(err) { alert("Erreur : "+err.message); }
    };
    r.readAsText(file);
  };
  const doImportReplace = () => {
    if (!importData) return;
    setMembers(importData.members||[]); setLoans(importData.loans||[]); setAssist(importData.assistance||[]);
    setHistory(importData.history||[]); 
    setCotisations(importData.cotisations||[]); setSanctions(importData.sanctions||[]); setSorties(importData.sorties||[]);
    pushH("Import (remplacement)", `${(importData.members||[]).length} membres`);
    setImportData(null); setImportConf([]); setImportStep(0);
  };
  const doImportMerge = () => {
    if (!importData) return;
    const exM=new Set(members.map(m=>m.id)), exL=new Set(loans.map(l=>l.id));
    const exC=new Set(cotisations.map(c=>c.id)), exA=new Set(assist.map(a=>`${a.assistantId}-${a.loanId}`));
    setMembers([...members, ...(importData.members||[]).filter(m=>!exM.has(m.id))]);
    setLoans([...loans, ...(importData.loans||[]).filter(l=>!exL.has(l.id))]);
    setCotisations([...cotisations, ...(importData.cotisations||[]).filter(c=>!exC.has(c.id))]);
    setAssist([...assist, ...(importData.assistance||[]).filter(a=>!exA.has(`${a.assistantId}-${a.loanId}`))]);
    pushH("Import (fusion)", "membres importés");
    setImportData(null); setImportConf([]); setImportStep(0);
  };

  const prtMember = (mb) => {
    const cots = [...cotisations].filter(c=>c.memberId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const lns  = [...loans].filter(l=>l.emprunteurId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const mX   = membersX.find(m=>m.id===mb.id)||mb;
    const totC = cots.filter(c=>c.type==="caisse"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    const totR = cots.filter(c=>c.type==="roulement"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    
    doPrint(`Fiche — ${mb.name}`, `<table><tbody><tr><td><strong>Nom</strong></td><td>${mb.name}</td><td><strong>Ville</strong></td><td>${mb.ville||"—"}</td></tr><tr><td><strong>Téléphone</strong></td><td>${mb.telephone||"—"}</td><td><strong>Part prorata</strong></td><td>${mX.prorata?.toFixed(2)||"0.00"}%</td></tr><tr><td><strong>Fonds Caisse</strong></td><td>${fmt(mb.fondsCaisse)}</td><td><strong>Fonds Roulement</strong></td><td>${fmt(mb.fondsRoulement)}</td></tr></tbody></table><h2>Fonds de Caisse — ${cots.filter(c=>c.type==="caisse"&&!c.auto).length} versements — Total : ${fmt(totC)}</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead><tbody>${cots.filter(c=>c.type==="caisse"&&!c.auto).map(c=>`<tr><td>${fmtDate(c.date)}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||'<tr><td colspan="3" style="color:#999">Aucun</td></tr>'}</tbody></table><h2>Fonds de Roulement — ${cots.filter(c=>c.type==="roulement"&&!c.auto).length} versements — Total : ${fmt(totR)}</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead><tbody>${cots.filter(c=>c.type==="roulement"&&!c.auto).map(c=>`<tr><td>${fmtDate(c.date)}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||'<tr><td colspan="3" style="color:#999">Aucun</td></tr>'}</tbody></table><h2>Prêts — ${lns.length} au total</h2><table><thead><tr><th>Date</th><th>Montant</th><th>Total Dû</th><th>Échéance</th><th>Statut</th></tr></thead><tbody>${lns.map(l=>`<tr><td>${fmtDate(l.date)}</td><td>${fmt(l.montant)}</td><td>${fmt(l.montantDu)}</td><td>${fmtDate(l.echeance)}</td><td>${l.status==="actif"?'<span class="wa">En cours</span>':`<span class="ok">Remboursé ${fmtDate(l.dateRembours)}</span>`}</td></tr>`).join("")||'<tr><td colspan="5" style="color:#999">Aucun</td></tr>'}</tbody></table>`);
  };

  const genLoanReportHTML = (mb) => {
    const lns = loans.filter(l => l.emprunteurId === mb.id);
    if (lns.length === 0) return `<div style="padding:20px; color:#999">Aucun prêt pour ${mb.name}</div>`;
    
    const rows = lns.map(l => `
      <tr>
        <td>${fmtDate(l.date)}</td>
        <td><strong>${fmt(l.montant)}</strong></td>
        <td>${fmt(l.montantDu)}</td>
        <td>${fmtDate(l.echeance)}</td>
        <td>${l.status === "rembourse" ? `<span class="ok">Remboursé le ${fmtDate(l.dateRembours) || "—"}</span>` : '<span class="wa">Actif</span>'}</td>
        <td>${l.status === "rembourse" ? `<strong>${fmt(l.montantRembourse || l.montantDu)}</strong>` : "—"}</td>
      </tr>
    `).join("");

    const totCap = lns.reduce((s,l)=>s+l.montant, 0);
    const totRem = lns.filter(l=>l.status==="rembourse").reduce((s,l)=>s+(l.montantRembourse||l.montantDu), 0);

    return `
      <h2>Rapport de Prêts — ${mb.name}</h2>
      <table>
        <thead>
          <tr><th>Date Prêt</th><th>Capital</th><th>Total Dû</th><th>Échéance</th><th>Statut</th><th>Montant Remboursé</th></tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot style="background:#f9f9f9; font-weight:800">
          <tr><td colspan="1">TOTAUX</td><td>${fmt(totCap)}</td><td colspan="3"></td><td>${fmt(totRem)}</td></tr>
        </tfoot>
      </table>
      <p style="font-size:12px; color:#666; margin-top:10px">Ce rapport liste tous les emprunts et remboursements effectués par le membre.</p>
    `;
  };

  const prtLoanReport = (memberId) => {
    const mb = members.find(m => m.id === memberId);
    if (!mb) return;
    doPrint(`Rapport Prêts — ${mb.name}`, genLoanReportHTML(mb));
  };

  const prtAllLoanReports = () => {
    const mbsWithLoans = members.filter(m => loans.some(l => l.emprunteurId === m.id));
    const content = mbsWithLoans.map((mb, i) => `
      ${i > 0 ? '<div style="page-break-before:always"></div>' : ''}
      ${genLoanReportHTML(mb)}
    `).join("");
    doPrint('Rapports de Prêts — Tous les membres', content);
  };

  const prtCotisationsReport = (subTab, filterName) => {
    const fMbrs = membersX.filter(m => !filterName || m.name.toLowerCase().includes(filterName.toLowerCase()));
    let title = "Rapport des Cotisations";
    let thead = "";
    let tbody = "";
    let tfoot = "";

    if (subTab === "tous") {
      title = "💰 Cotisations — Vue d'ensemble";
      thead = `<thead><tr><th>Membre</th><th style="text-align:right">Fonds Caisse</th><th>Statut</th><th style="text-align:right">Fonds Roulement</th><th style="text-align:right">Part %</th></tr></thead>`;
      tbody = fMbrs.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td style="text-align:right">${fmt(m.fondsCaisse)}</td>
          <td><span class="${m.aJour?'ok':'ko'}">${m.aJour?'À jour':'Non à jour'}</span></td>
          <td style="text-align:right">${fmt(m.fondsRoulement)}</td>
          <td style="text-align:right">${m.prorata.toFixed(2)}%</td>
        </tr>
      `).join("");
      const tFC = fMbrs.reduce((s,m)=>s+m.fondsCaisse,0);
      const tFR = fMbrs.reduce((s,m)=>s+m.fondsRoulement,0);
      const tP  = fMbrs.reduce((s,m)=>s+m.prorata,0);
      tfoot = `<tfoot style="background:#f2f2f8;font-weight:800"><tr><td>TOTAUX</td><td style="text-align:right">${fmt(tFC)}</td><td></td><td style="text-align:right">${fmt(tFR)}</td><td style="text-align:right">${tP.toFixed(2)}%</td></tr></tfoot>`;
    } 
    else if (subTab === "caisse") {
      title = "🏦 Fonds de Caisse — Détail par membre";
      thead = `<thead><tr><th>Membre</th><th>Ville</th><th style="text-align:right">Fonds Caisse</th><th>Statut</th></tr></thead>`;
      tbody = fMbrs.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.ville||"—"}</td>
          <td style="text-align:right">${fmt(m.fondsCaisse)}</td>
          <td><span class="${m.aJour?'ok':'ko'}">${m.aJour?'À jour':'Non à jour'}</span></td>
        </tr>
      `).join("");
      const tFC = fMbrs.reduce((s,m)=>s+m.fondsCaisse,0);
      tfoot = `<tfoot style="background:#f2f2f8;font-weight:800"><tr><td>TOTAUX</td><td></td><td style="text-align:right">${fmt(tFC)}</td><td></td></tr></tfoot>`;
    } 
    else if (subTab === "roulement") {
      title = "🔄 Fonds de Roulement — Détail par membre";
      thead = `<thead><tr><th>Membre</th><th>Ville</th><th style="text-align:right">Total Cotisé</th><th style="text-align:right">Fonds Roulement</th><th style="text-align:right">Part %</th></tr></thead>`;
      tbody = fMbrs.map(m => {
        const tc = cotisations.filter(c => c.memberId===m.id && c.type==="roulement" && !c.auto).reduce((ss,cc)=>ss+cc.montant, 0);
        return `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.ville||"—"}</td>
          <td style="text-align:right">${fmt(tc)}</td>
          <td style="text-align:right">${fmt(m.fondsRoulement)}</td>
          <td style="text-align:right">${m.prorata.toFixed(2)}%</td>
        </tr>`;
      }).join("");
      const tTC = fMbrs.reduce((s,m) => s + cotisations.filter(c => c.memberId===m.id && c.type==="roulement" && !c.auto).reduce((ss,cc)=>ss+cc.montant, 0), 0);
      const tFR = fMbrs.reduce((s,m)=>s+m.fondsRoulement,0);
      const tP  = fMbrs.reduce((s,m)=>s+m.prorata,0);
      tfoot = `<tfoot style="background:#f2f2f8;font-weight:800"><tr><td>TOTAUX</td><td></td><td style="text-align:right">${fmt(tTC)}</td><td style="text-align:right">${fmt(tFR)}</td><td style="text-align:right">${tP.toFixed(2)}%</td></tr></tfoot>`;
    }

    if (tbody) doPrint(title, `<table>${thead}<tbody>${tbody}</tbody>${tfoot}</table>`);
  };

  /* ── Impression rapport individuel de TOUS les membres ────────────────── */
  const prtAllRapports = () => {
    const cols = ["Date","Fond de Caisse","Fond de Roulement","Sorties (Pr\u00eat)","Entr\u00e9es (Pr\u00eat)","Gains (Pr\u00eat)","Sanctions"];
    const thead = `<tr>${cols.map(h=>`<th>${h}</th>`).join('')}</tr>`;

    const calcInteretGagne = (creditCot, mbId) => {
      const loan = loans.find(l => l.id === creditCot.loanId);
      if (!loan) return 0;
      const contrib = (loan.contributions||[]).find(x => x.memberId===mbId);
      return Math.max(0, creditCot.montant - (contrib?.montantContrib || 0));
    };
    const getEmpr = (loan) => loan ? (members.find(m => m.id===loan.emprunteurId)?.name || "?") : "?";
    const getMbPct = (loan, mbId) => {
      const c = (loan?.contributions||[]).find(x => x.memberId===mbId);
      return c ? (c.pct*100).toFixed(1)+"%" : "\u2014";
    };
    const getPeriod = (loan, date) => {
      if (!loan) return 1;
      return calcMontantActuel(loan, date).periods;
    };

    const sections = members.map((mb, mIdx) => {
      const cots = cotisations.filter(c => c.memberId===mb.id);
      const cotisC = cots.filter(c => c.type==="caisse" && !c.auto);
      const cotisR = cots.filter(c => c.type==="roulement" && !c.auto);
      const autoD  = cots.filter(c => c.auto && c.direction==="debit");
      const autoC  = cots.filter(c => c.auto && c.direction==="credit");
      const mbSanctions = sanctions.filter(s => s.memberId===mb.id);

      const allDates = [...new Set([
        ...cotisC.map(c=>c.date), ...cotisR.map(c=>c.date),
        ...autoD.map(c=>c.date), ...autoC.map(c=>c.date),
        ...mbSanctions.map(s=>s.date),
      ])].sort((a,b)=>new Date(a)-new Date(b));

      const totEC = cotisC.reduce((s,c)=>s+c.montant,0);
      const totER = cotisR.reduce((s,c)=>s+c.montant,0);
      const totSP = autoD.reduce((s,c)=>s+c.montant,0);
      const totRB = autoC.reduce((s,c)=>s+c.montant,0);
      const totIG = autoC.reduce((s,c)=>s+calcInteretGagne(c, mb.id),0);
      const totE  = totEC + totER + totIG;
      const totSN = mbSanctions.reduce((s,x)=>s+x.montant,0);
      const totS  = totSP + totSN;

      const tbody = allDates.map(date => {
        const cJ = cotisC.filter(c=>c.date===date).reduce((s,c)=>s+c.montant,0);
        const rJ = cotisR.filter(c=>c.date===date).reduce((s,c)=>s+c.montant,0);
        const dJ = autoD.filter(c=>c.date===date);
        const crJ= autoC.filter(c=>c.date===date);
        const sJ = mbSanctions.filter(s=>s.date===date);
        const fC = (v) => v>0 ? fmt(v) : '\u2014';
        const pretD = dJ.map(c=>{ const l=loans.find(x=>x.id===c.loanId); return `<small>${getEmpr(l)} \u2014 ${fmt(l?.montant||0)} \u2014 ${getMbPct(l,mb.id)}</small><br/><strong>${fmt(c.montant)}</strong>`; }).join('<br/>') || '\u2014';
        const entD  = crJ.map(c=>{ const l=loans.find(x=>x.id===c.loanId); return `<small>${getEmpr(l)} \u2014 ${fmt(l?.montantDu||0)} \u2014 P\u00e9r. ${getPeriod(l,date)}</small><br/><strong>${fmt(c.montant)}</strong>`; }).join('<br/>') || '\u2014';
        const gainD = crJ.map(c=>{ const l=loans.find(x=>x.id===c.loanId); const g=calcInteretGagne(c,mb.id); return g>0?`<small>${getEmpr(l)} \u2014 P\u00e9r. ${getPeriod(l,date)}</small><br/><strong style="color:#f5a623">${fmt(g)}</strong>`:''; }).filter(Boolean).join('<br/>') || '\u2014';
        const sanctD= sJ.map(s=>`${fmt(s.montant)} <span class="${s.status==="payee"?"ok":"wa"}">${s.status==="payee"?"Pay\u00e9e":"En attente"}</span>`).join('<br/>') || '\u2014';
        return `<tr><td>${date}</td><td>${fC(cJ)}</td><td>${fC(rJ)}</td><td>${pretD}</td><td>${entD}</td><td>${gainD}</td><td>${sanctD}</td></tr>`;
      }).join('');

      const totRow = `<tr style="font-weight:800;background:#f2f2f8"><td>Totaux</td><td>${fmt(totEC)}</td><td>${fmt(totER)}</td><td>${fmt(totSP)}</td><td>${fmt(totRB)}</td><td>${fmt(totIG)}</td><td>${fmt(totSN)}</td></tr>`;
      const summary = `<p style="margin-top:8px;font-size:12px"><strong>Entr\u00e9es :</strong> ${fmt(totE)} (Caisse: ${fmt(totEC)} \u00b7 Roulement: ${fmt(totER)} \u00b7 Gains: ${fmt(totIG)}) &nbsp;|&nbsp; <strong>Sorties :</strong> ${fmt(totS)} (Pr\u00eats: ${fmt(totSP)} \u00b7 Sanctions: ${fmt(totSN)})</p>`;

      return `${mIdx>0?'<div style="page-break-before:always"></div>':''}<h2>${mb.name}${mb.telephone ? ` \u2014 ${mb.telephone}` : ''}</h2><table><thead>${thead}</thead><tbody>${tbody}${totRow}</tbody></table>${summary}`;
    }).join('');

    doPrint('Rapports Individuels — Tous les membres', sections);
  };

  const prtFilteredMembers = (filterLabel) => {
    const title = `Liste des Membres — ${filterLabel}`;
    const thead = `<thead><tr><th>Membre</th><th>Ville</th><th>Téléphone</th><th style="text-align:right">Fonds Caisse</th><th style="text-align:right">Fonds Roulement</th><th style="text-align:right">Part%</th><th>Statut</th><th style="text-align:right">Prêt actif</th></tr></thead>`;
    const tbody = filteredMembers.map(m => `
      <tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.ville || "—"}</td>
        <td>${m.telephone || "—"}</td>
        <td style="text-align:right">${fmt(m.fondsCaisse)}</td>
        <td style="text-align:right">${fmt(m.fondsRoulement)}</td>
        <td style="text-align:right">${m.prorata.toFixed(2)}%</td>
        <td><span class="${m.aJour ? 'ok' : 'ko'}">${m.aJour ? 'À jour' : 'Non à jour'}</span></td>
        <td style="text-align:right">${m.loanActif ? fmt(m.loanActif.montantDu) : "—"}</td>
      </tr>
    `).join("");

    const tC = filteredMembers.reduce((s, m) => s + m.fondsCaisse, 0);
    const tR = filteredMembers.reduce((s, m) => s + m.fondsRoulement, 0);
    const tP = filteredMembers.reduce((s, m) => s + m.prorata, 0);
    const tL = filteredMembers.reduce((s, m) => s + (m.loanActif ? m.loanActif.montantDu : 0), 0);

    const tfoot = `<tfoot style="background:#f2f2f8; font-weight:800">
      <tr>
        <td>TOTAUX</td><td></td><td></td>
        <td style="text-align:right">${fmt(tC)}</td>
        <td style="text-align:right">${fmt(tR)}</td>
        <td style="text-align:right">${tP.toFixed(2)}%</td>
        <td></td>
        <td style="text-align:right">${fmt(tL)}</td>
      </tr>
    </tfoot>`;

    doPrint(title, `<table>${thead}<tbody>${tbody}${tfoot}</tbody></table>`);
  };

  const setAppTab = (newTab) => setTab(newTab);
  
  const value = {
    authed, loginU, loginP, loginErr, authCreds, setAuthed, setLoginU, setLoginP, setLoginErr, setAuthCreds,
    doLogin, doLogout, doChangeCredentials,
    ready, tab, setTab: setAppTab, cotisSubTab, setCotisSubTab,
    members, loans, assist, history, fondsAsso, cotisations, dismissed, sanctions, sorties,
    modal, setModal, parentModal, form, setForm, sf,
    editFA, setEditFA, editFAV, setEditFAV,
    fMbr, setFMbr, fLoan, setFLoan, fSanc, setFSanc, fSancMember, setFSancMember, fCotisName, setFCotisName,
    histGroup, setHistGroup,
    totFR, totFC, actLoans, totDette, totGains, membersX,
    filteredMembers, filteredLoans, filteredSanctions, alerts, visibleAlerts, histGrouped,
    pushH, openSub, openM, closeM, closeAll, dismissAlert,
    doAddMember, doEditMember, doDeleteMember,
    doAddCotisation, doEditCotisation, doDeleteCotisation,
    doAddLoan, doEditLoan, doDeleteLoan, doRepay,
    doAddSanction, doEditSanction, doDeleteSanction, doPaySanction,
    sessions, dailyContributions, doAddSession, doAddDailyCotis, doDeleteDailyCotis,
    doSaveDailyMetadata, doUpdateDailyRow,
    doAddSortie, doDeleteSortie,
    doClearData, doExport, onFileChange, importData, setImportData, importConf, importStep, setImportStep, doImportReplace, doImportMerge,
    prtMember, prtAllRapports, prtFilteredMembers, doPrintReceptionReport, prtLoanReport, prtAllLoanReports, prtCotisationsReport
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
