import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { sha1, uid, tod, SK, DEFAULT_USER, DEFAULT_PASS_HASH, SEUIL, calcMontantActuel, add3M, dLeft, nowLbl, doPrint, fmt } from '../utils';

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

  /* ── Filtres ── */
  const [fMbr,  setFMbr]  = useState("tous");
  const [fLoan, setFLoan] = useState("tous");
  const [fSanc, setFSanc] = useState("tous");
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
      const [m,l,a,h,f,c,d,s,so,ac] = await Promise.all([
        load(SK.members), load(SK.loans), load(SK.assist), load(SK.history),
        load(SK.fondsAsso), load(SK.cotisations), load(SK.dismissed),
        load(SK.sanctions), load(SK.sorties), load(SK.authCreds),
      ]);
      if (m)  setMembers(m);       if (l)  setLoans(l);        if (a)  setAssist(a);
      if (h)  setHistory(h);       if (f != null) setFondsAsso(f);
      if (c)  setCotisations(c);   if (d)  setDismissed(d);
      if (s)  setSanctions(s);     if (so) setSorties(so);
      if (ac) setAuthCreds(ac);
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
  useEffect(() => { if (ready) save(SK.fondsAsso,   fondsAsso);   }, [fondsAsso,   ready, save]);
  useEffect(() => { if (ready) save(SK.cotisations, cotisations); }, [cotisations, ready, save]);
  useEffect(() => { if (ready) save(SK.dismissed,   dismissed);   }, [dismissed,   ready, save]);
  useEffect(() => { if (ready) save(SK.sanctions,   sanctions);   }, [sanctions,   ready, save]);
  useEffect(() => { if (ready) save(SK.sorties,     sorties);     }, [sorties,     ready, save]);
  useEffect(() => { if (ready) save(SK.authCreds,   authCreds);   }, [authCreds,   ready, save]);

  /* ── Dérivés ────────────────────────────────────────────────────────────── */
  const totFR    = useMemo(() => members.reduce((s,m) => s+m.fondsRoulement, 0), [members]);
  const totFC    = useMemo(() => members.reduce((s,m) => s+m.fondsCaisse, 0), [members]);
  const actLoans = useMemo(() => loans.filter(l => l.status==="actif"), [loans]);
  const totDette = useMemo(() => actLoans.reduce((s,l) => s+l.montantDu, 0), [actLoans]);
  const totGains = useMemo(() => loans.filter(l=>l.status==="rembourse").reduce((s,l)=>s+l.interets,0), [loans]);

  const membersX = useMemo(() => members.map(m => ({
    ...m,
    prorata:   totFR > 0 ? (m.fondsRoulement / totFR) * 100 : 0,
    aJour:     m.fondsCaisse >= SEUIL,
    droitPret: !assist.some(a => a.assistantId===m.id && loans.some(l=>l.id===a.loanId && l.status==="actif")),
    loanActif: actLoans.find(l => l.emprunteurId===m.id),
  })), [members, totFR, assist, actLoans, loans]);

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
    const base = [...sanctions].sort((a,b) => new Date(b.date)-new Date(a.date));
    if (fSanc === "en_attente") return base.filter(s => s.status==="en_attente");
    if (fSanc === "payee")      return base.filter(s => s.status==="payee");
    return base;
  }, [sanctions, fSanc]);

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
    setFondsAsso(f => f+fraisAsso);
    setLoans(ls => ls.map(l => l.id===loanId ? { ...l, status:"rembourse", dateRembours:date, montantRembourse:montantDu, interetsRembourse:interets } : l));
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
    setFondsAsso(f => f+s.montant);
    pushH("Sanction remboursée", `${mb?.name} — ${s.raison} → Fonds Asso +${s.montant}`, s.montant);
    setDismissed(d => d.includes(`sanction-${id}`) ? d : [...d, `sanction-${id}`]);
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
      setFondsAsso(f => f-montant);
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
    } else { setFondsAsso(f => f+s.montant); }
    setSorties(ss => ss.filter(x => x.id!==id));
    pushH("Annulation Sortie", s.raison, 0);
  };

  const doClearData = () => {
    if (!window.confirm("⚠️ Effacer TOUTES les données ? Irréversible.")) return;
    setMembers([]); setLoans([]); setAssist([]); setHistory([]); setFondsAsso(0);
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
    setHistory(importData.history||[]); setFondsAsso(importData.fondsAsso||0);
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
    if (importData.fondsAsso > 0) setFondsAsso(f => f+importData.fondsAsso);
    pushH("Import (fusion)", "membres importés");
    setImportData(null); setImportConf([]); setImportStep(0);
  };

  const prtMember = (mb) => {
    const cots = [...cotisations].filter(c=>c.memberId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const lns  = [...loans].filter(l=>l.emprunteurId===mb.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const mX   = membersX.find(m=>m.id===mb.id)||mb;
    const totC = cots.filter(c=>c.type==="caisse"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    const totR = cots.filter(c=>c.type==="roulement"&&!c.auto).reduce((s,c)=>s+c.montant,0);
    
    doPrint(`Fiche — ${mb.name}`, `<table><tbody><tr><td><strong>Nom</strong></td><td>${mb.name}</td><td><strong>Ville</strong></td><td>${mb.ville||"—"}</td></tr><tr><td><strong>Téléphone</strong></td><td>${mb.telephone||"—"}</td><td><strong>Part prorata</strong></td><td>${mX.prorata?.toFixed(2)||"0.00"}%</td></tr><tr><td><strong>Fonds Caisse</strong></td><td>${fmt(mb.fondsCaisse)}</td><td><strong>Fonds Roulement</strong></td><td>${fmt(mb.fondsRoulement)}</td></tr></tbody></table><h2>Fonds de Caisse — ${cots.filter(c=>c.type==="caisse"&&!c.auto).length} versements — Total : ${fmt(totC)}</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead><tbody>${cots.filter(c=>c.type==="caisse"&&!c.auto).map(c=>`<tr><td>${c.date}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||'<tr><td colspan="3" style="color:#999">Aucun</td></tr>'}</tbody></table><h2>Fonds de Roulement — ${cots.filter(c=>c.type==="roulement"&&!c.auto).length} versements — Total : ${fmt(totR)}</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Montant</th></tr></thead><tbody>${cots.filter(c=>c.type==="roulement"&&!c.auto).map(c=>`<tr><td>${c.date}</td><td>${c.heure||"—"}</td><td>${fmt(c.montant)}</td></tr>`).join("")||'<tr><td colspan="3" style="color:#999">Aucun</td></tr>'}</tbody></table><h2>Prêts — ${lns.length} au total</h2><table><thead><tr><th>Date</th><th>Montant</th><th>Total Dû</th><th>Échéance</th><th>Statut</th></tr></thead><tbody>${lns.map(l=>`<tr><td>${l.date}</td><td>${fmt(l.montant)}</td><td>${fmt(l.montantDu)}</td><td>${l.echeance}</td><td>${l.status==="actif"?'<span class="wa">En cours</span>':`<span class="ok">Remboursé ${l.dateRembours||""}</span>`}</td></tr>`).join("")||'<tr><td colspan="5" style="color:#999">Aucun</td></tr>'}</tbody></table>`);
  };

  const setAppTab = (newTab) => setTab(newTab);
  
  const value = {
    authed, loginU, loginP, loginErr, authCreds, setAuthed, setLoginU, setLoginP, setLoginErr, setAuthCreds,
    doLogin, doLogout, doChangeCredentials,
    ready, tab, setTab: setAppTab, cotisSubTab, setCotisSubTab,
    members, loans, assist, history, fondsAsso, setFondsAsso, cotisations, dismissed, sanctions, sorties,
    modal, setModal, parentModal, form, setForm, sf,
    editFA, setEditFA, editFAV, setEditFAV,
    fMbr, setFMbr, fLoan, setFLoan, fSanc, setFSanc, fCotisName, setFCotisName,
    histGroup, setHistGroup,
    totFR, totFC, actLoans, totDette, totGains, membersX,
    filteredMembers, filteredLoans, filteredSanctions, alerts, visibleAlerts, histGrouped,
    pushH, openSub, openM, closeM, closeAll, dismissAlert,
    doAddMember, doEditMember, doDeleteMember,
    doAddCotisation, doEditCotisation, doDeleteCotisation,
    doAddLoan, doEditLoan, doDeleteLoan, doRepay,
    doAddSanction, doEditSanction, doDeleteSanction, doPaySanction,
    doAddSortie, doDeleteSortie,
    doClearData, doExport, onFileChange, importData, setImportData, importConf, importStep, setImportStep, doImportReplace, doImportMerge,
    prtMember
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
