import React from "react";
import { useApp } from "../context/AppContext";
import { Btn, Badge, TH, TD, SectionLabel } from "./ui";
import { C, INP, LBL, FR, fmt, tod, add3M, calcMontantActuel } from "../utils";

export const Modals = () => {
  const {
    modal, closeM, form, sf, members, membersX, cotisations, loans,
    doChangeCredentials, doAddMember, doEditMember, doAddCotisation, doEditCotisation,
    doAddLoan, doEditLoan, doRepay, doAddSanction, doEditSanction, doAddSortie,
    doDeleteCotisation, doDeleteLoan, openSub, closeAll, totFC, fondsAsso, prtMember
  } = useApp();

  if (!modal) return null;

  /* ── Données modale détail ───────────────────────────────────────────────── */
  const detailMbId   = modal?.type==="memberDetail" ? modal.data.memberId : null;
  const detailMb     = detailMbId ? membersX.find(m => m.id===detailMbId) : null;
  const detailCotis  = detailMbId ? [...cotisations].filter(c=>c.memberId===detailMbId).sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
  const detailCotisC = detailCotis.filter(c => c.type==="caisse" && !c.auto);
  const detailCotisR = detailCotis.filter(c => c.type==="roulement" && !c.auto);
  const detailLoans  = detailMbId ? [...loans].filter(l=>l.emprunteurId===detailMbId).sort((a,b)=>new Date(b.date)-new Date(a.date)) : [];
  const editLoanObj  = modal?.type==="editLoan" ? loans.find(l=>l.id===parseInt(form.loanId)) : null;

  /* ── Label enrichi pour les cotisations auto (détail membre) ── */
  const enrichLabel = (c, viewMemberId) => {
    if (!c.auto) return null;
    const loan = loans.find(l => l.id === c.loanId);
    if (!loan) return c.label || "Opération auto";
    const emprName = members.find(m => m.id===loan.emprunteurId)?.name || "?";
    const isSelf = loan.emprunteurId === viewMemberId;
    if (c.direction === "debit") {
      if (isSelf) return `Contribution prêt — votre prêt ${fmt(loan.montant)} (sortie roulement: ${fmt(c.montant)})`;
      return `Contribution prêt — prêté à ${emprName} ${fmt(loan.montant)} (votre part: ${fmt(c.montant)})`;
    } else {
      if (isSelf) return `Retour prêt — votre remboursement ${fmt(loan.montant)} (encaissé: ${fmt(c.montant)})`;
      return `Retour prêt + gains — ${emprName} ${fmt(loan.montant)} (votre retour: ${fmt(c.montant)})`;
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.84)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(5px)" }}
      onClick={modal.type==="memberDetail" ? undefined : closeM}>
      <div style={{ background:C.card, borderRadius:16, padding:modal.type==="memberDetail"?0:28, width:modal.type==="memberDetail"?800:480, maxWidth:"96vw", border:`1px solid ${C.border}`, boxShadow:"0 24px 70px rgba(0,0,0,.8)", maxHeight:"94vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>

        {/* ── Changer identifiants ── */}
        {modal.type==="changeCredentials" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.gold }}>⚙️ Modifier les identifiants</div>
            <div style={FR}><label style={LBL}>Mot de passe actuel *</label><input style={INP} type="password" value={form.curPass||""} onChange={e=>sf("curPass")(e.target.value)} autoFocus placeholder="Mot de passe actuel"/></div>
            <div style={FR}><label style={LBL}>Nouveau nom d'utilisateur *</label><input style={INP} value={form.newUser||""} onChange={e=>sf("newUser")(e.target.value)} placeholder="Nouveau nom d'utilisateur"/></div>
            <div style={FR}><label style={LBL}>Nouveau mot de passe *</label><input style={INP} type="password" value={form.newPass||""} onChange={e=>sf("newPass")(e.target.value)} placeholder="Nouveau mot de passe (min. 4 caractères)"/></div>
            <div style={FR}><label style={LBL}>Confirmer le nouveau mot de passe *</label><input style={INP} type="password" value={form.confPass||""} onChange={e=>sf("confPass")(e.target.value)} placeholder="Confirmer"/></div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.gold} onClick={doChangeCredentials}>✓ Enregistrer</Btn></div>
          </div>
        )}

        {/* ── Nouveau / Edit membre ── */}
        {modal.type==="addMember" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.gold }}>👤 Nouveau Membre</div>
            <div style={FR}><label style={LBL}>Nom complet *</label><input style={INP} value={form.name||""} onChange={e=>sf("name")(e.target.value)} autoFocus placeholder="Ex: Amadou Diallo"/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={FR}><label style={LBL}>Ville</label><input style={INP} value={form.ville||""} onChange={e=>sf("ville")(e.target.value)} placeholder="Ex: Yaoundé"/></div>
              <div style={FR}><label style={LBL}>Téléphone</label><input style={INP} value={form.telephone||""} onChange={e=>sf("telephone")(e.target.value)} placeholder="Ex: 690 00 00 00"/></div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.accent} onClick={doAddMember}>✓ Créer</Btn></div>
          </div>
        )}
        {modal.type==="editMember" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.gold }}>✏️ Modifier le Membre</div>
            <div style={FR}><label style={LBL}>Nom *</label><input style={INP} value={form.name||""} onChange={e=>sf("name")(e.target.value)} autoFocus/></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={FR}><label style={LBL}>Ville</label><input style={INP} value={form.ville||""} onChange={e=>sf("ville")(e.target.value)}/></div>
              <div style={FR}><label style={LBL}>Téléphone</label><input style={INP} value={form.telephone||""} onChange={e=>sf("telephone")(e.target.value)}/></div>
            </div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.gold} onClick={doEditMember}>✓ Enregistrer</Btn></div>
          </div>
        )}

        {/* ── Cotisation ── */}
        {(modal.type==="addCotisation"||modal.type==="editCotisation") && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.gold }}>{modal.type==="editCotisation"?"✏️ Modifier":"💰 Nouvelle"} Cotisation</div>
            {modal.type==="addCotisation" && <div style={FR}><label style={LBL}>Membre *</label><select style={INP} value={form.memberId||""} onChange={e=>sf("memberId")(e.target.value)}><option value="">— Sélectionner —</option>{members.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}</option>)}</select></div>}
            <div style={FR}><label style={LBL}>Type *</label><select style={INP} value={form.type||""} onChange={e=>sf("type")(e.target.value)}><option value="">— Sélectionner —</option><option value="caisse">🏦 Fonds de Caisse</option><option value="roulement">🔄 Fonds de Roulement</option></select></div>
            <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 25 000"/></div>
            <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={modal.type==="editCotisation"?C.gold:C.accent} onClick={modal.type==="editCotisation"?doEditCotisation:doAddCotisation}>✓ {modal.type==="editCotisation"?"Modifier":"Enregistrer"}</Btn></div>
          </div>
        )}

        {/* ── Nouveau prêt ── */}
        {modal.type==="addLoan" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.gold }}>💳 Nouveau Prêt</div>
            <div style={FR}><label style={LBL}>Emprunteur *</label><select style={INP} value={form.emprunteurId||""} onChange={e=>sf("emprunteurId")(e.target.value)}><option value="">— Sélectionner —</option>{membersX.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}{!m.droitPret?" ⏸":""}</option>)}</select></div>
            <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 50 000"/></div>
            <div style={FR}>
              <label style={LBL}>Date du prêt <span style={{ fontWeight:400, fontSize:11, textTransform:"none", color:C.muted, marginLeft:6 }}>(échéance = +3 mois)</span></label>
              <input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/>
              <div style={{ fontSize:11, color:C.muted, marginTop:5, padding:"5px 10px", background:"rgba(255,255,255,0.04)", borderRadius:6, display:"flex", gap:16 }}>
                <span>📅 <strong style={{ color:C.text }}>{form.date||tod()}</strong></span>
                <span>⏱️ Échéance : <strong style={{ color:C.gold }}>{add3M(form.date||tod())}</strong></span>
              </div>
            </div>
            {form.montant && parseFloat(form.montant)>0 && (
              <div style={{ background:`${C.gold}0e`, border:`1px solid ${C.gold}28`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, lineHeight:2 }}>
                <div>📌 Montant : <strong>{fmt(parseFloat(form.montant))}</strong></div>
                <div>💰 Intérêts (10%) : <strong style={{ color:C.gold }}>{fmt(parseFloat(form.montant)*0.1)}</strong></div>
                <div style={{ paddingLeft:12, color:C.muted }}>🏛️ 2% → Fonds Association : {fmt(parseFloat(form.montant)*0.02)}</div>
                <div style={{ paddingLeft:12, color:C.muted }}>👥 8% → Redistribués au prorata snapshot : {fmt(parseFloat(form.montant)*0.08)}</div>
                <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:5, marginTop:2 }}>💳 <strong>Total à rembourser : <span style={{ color:C.accent }}>{fmt(parseFloat(form.montant)*1.1)}</span></strong></div>
              </div>
            )}
            <div style={FR}><label style={LBL}>Assistant (optionnel)</label><select style={INP} value={form.assistantId||""} onChange={e=>sf("assistantId")(e.target.value)}><option value="">— Aucun —</option>{membersX.filter(m=>`${m.id}`!==form.emprunteurId&&m.droitPret).map(m=><option key={m.id} value={`${m.id}`}>{m.name}</option>)}</select>{form.assistantId&&<div style={{ fontSize:11, color:C.warn, marginTop:5, background:`${C.warn}12`, padding:"5px 10px", borderRadius:6 }}>⚠️ L'assistant perdra son droit de prêt jusqu'au remboursement.</div>}</div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.accent} onClick={doAddLoan}>✓ Accorder le prêt</Btn></div>
          </div>
        )}

        {/* ── Modifier prêt ── */}
        {modal.type==="editLoan" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:C.gold }}>✏️ Modifier le Prêt</div>
            {editLoanObj?.status==="actif" && <div style={{ fontSize:12, color:C.warn, marginBottom:16, background:`${C.warn}12`, padding:"8px 12px", borderRadius:8 }}>⚠️ Prêt actif — la modification recalcule les contributions et réajuste les fonds.</div>}
            <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)}/></div>
            {form.montant && parseFloat(form.montant)>0 && <div style={{ background:`${C.gold}0e`, border:`1px solid ${C.gold}28`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, lineHeight:1.9 }}><div>💰 Intérêts : <strong style={{ color:C.gold }}>{fmt(parseFloat(form.montant)*0.1)}</strong></div><div>💳 Total : <strong style={{ color:C.accent }}>{fmt(parseFloat(form.montant)*1.1)}</strong></div></div>}
            <div style={FR}><label style={LBL}>Date du prêt</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/><div style={{ fontSize:11, color:C.muted, marginTop:5, padding:"5px 10px", background:"rgba(255,255,255,0.04)", borderRadius:6 }}>⏱️ <strong style={{ color:C.gold }}>{add3M(form.date||tod())}</strong></div></div>
            {editLoanObj?.status==="actif" && <div style={FR}><label style={LBL}>Assistant</label><select style={INP} value={form.assistantId||""} onChange={e=>sf("assistantId")(e.target.value)}><option value="">— Aucun —</option>{membersX.filter(m=>`${m.id}`!==form.emprunteurId&&(m.droitPret||m.id===editLoanObj?.assistantId)).map(m=><option key={m.id} value={`${m.id}`}>{m.name}</option>)}</select></div>}
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.gold} onClick={doEditLoan}>✓ Enregistrer</Btn></div>
          </div>
        )}

        {/* ── Remboursement prêt ── */}
        {modal.type==="repayLoan" && (() => {
          const loan = loans.find(l => `${l.id}`===`${form.loanId}`);
          const empr = loan ? members.find(m => m.id===loan.emprunteurId) : null;
          const actual = loan ? calcMontantActuel(loan, repDate) : null;
          return loan && actual ? (
            <div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:6, color:C.green }}>💳 Remboursement de Prêt</div>
              <div style={{ fontSize:13, color:C.muted, marginBottom:18 }}>{empr?.name} — Prêt accordé le <strong style={{ color:C.text }}>{loan.date}</strong></div>
              <div style={FR}>
                <label style={LBL}>📅 Date de remboursement *</label>
                <input style={INP} type="date" value={repDate} onChange={e=>sf("repayDate")(e.target.value)} min={loan.date}/>
                <div style={{ fontSize:11, color:C.muted, marginTop:5, padding:"5px 10px", background:"rgba(255,255,255,0.04)", borderRadius:6 }}>Délai : <strong style={{ color:C.text }}>{Math.max(0,Math.round((new Date(repDate)-new Date(loan.date))/864e5))} jours depuis le prêt</strong></div>
              </div>
              <div style={{ background:`${actual.periods>1?C.danger:C.gold}10`, border:`1px solid ${actual.periods>1?C.danger:C.gold}30`, borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:actual.periods>1?C.danger:C.gold, marginBottom:10 }}>{actual.periods>1?`⚠️ Période ${actual.periods} — Intérêts composés`:`✓ Période 1 — Dans les délais`}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:13 }}>
                  {[{l:"Capital emprunté",v:fmt(loan.montant),c:C.text},{l:`Intérêts (${actual.periods}×10%)`,v:`+${fmt(actual.interets)}`,c:C.gold},{l:"→ Fonds Asso (20% int.)",v:`+${fmt(actual.fraisAsso)}`,c:C.purple},{l:"→ Membres (80% int.)",v:`+${fmt(actual.gainMbr)}`,c:C.green}].map((x,i) => (
                    <div key={i} style={{ padding:"8px 10px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
                      <div style={{ color:C.muted, fontSize:10, textTransform:"uppercase", marginBottom:3 }}>{x.l}</div>
                      <div style={{ fontWeight:700, color:x.c }}>{x.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop:`1px solid ${C.border}`, marginTop:12, paddingTop:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontWeight:700, fontSize:14 }}>💳 Total à encaisser</span>
                  <span style={{ fontWeight:900, fontSize:18, color:actual.periods>1?C.danger:C.green }}>{fmt(actual.montantDu)}</span>
                </div>
                {actual.periods>1 && <div style={{ marginTop:10, fontSize:11, color:C.muted, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>{Array.from({length:actual.periods}).map((_,i) => <span key={i} style={{ marginRight:8 }}>Pér.{i+1}: {fmt(loan.montant*Math.pow(1.1,i+1))}{i<actual.periods-1?" →":""}</span>)}</div>}
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.green} onClick={() => doRepay(loan.id, repDate)}>✓ Confirmer le remboursement</Btn></div>
            </div>
          ) : <div style={{ color:C.muted, padding:"20px 0", textAlign:"center" }}>Prêt introuvable.</div>;
        })()}

        {/* ── Sanction ── */}
        {(modal.type==="addSanction"||modal.type==="editSanction") && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.warn }}>{modal.type==="editSanction"?"✏️ Modifier la Sanction":"⚠️ Nouvelle Sanction"}</div>
            <div style={FR}><label style={LBL}>Membre sanctionné *</label><select style={INP} value={form.memberId||""} onChange={e=>sf("memberId")(e.target.value)}><option value="">— Sélectionner —</option>{members.map(m=><option key={m.id} value={`${m.id}`}>{m.name}{m.ville?` (${m.ville})`:""}</option>)}</select></div>
            <div style={FR}><label style={LBL}>Raison de la sanction *</label><input style={INP} value={form.raison||""} onChange={e=>sf("raison")(e.target.value)} placeholder="Ex: Absence non justifiée à la réunion du 15/01"/></div>
            <div style={FR}><label style={LBL}>Montant (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 5 000"/></div>
            <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.warn} onClick={modal.type==="editSanction"?doEditSanction:doAddSanction}>✓ {modal.type==="editSanction"?"Modifier":"Enregistrer"}</Btn></div>
          </div>
        )}

        {/* ── Sortie de fonds ── */}
        {modal.type==="addSortie" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:20, color:C.danger }}>📤 Nouvelle Sortie de Fonds</div>
            <div style={FR}><label style={LBL}>Source *</label><select style={INP} value={form.source||""} onChange={e=>sf("source")(e.target.value)}><option value="">— Sélectionner —</option><option value="caisse">🏦 Fonds de Caisse (total membres : {fmt(totFC)})</option><option value="asso">🏛️ Fonds de l'Association ({fmt(fondsAsso)})</option></select></div>
            {form.source==="caisse" && members.length>0 && (
              <div style={FR}>
                <label style={LBL}>Membres concernés * <span style={{ fontWeight:400, fontSize:11, textTransform:"none", color:C.muted }}>(débit = montant ÷ nb membres sélectionnés)</span></label>
                <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                  <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>sf("sortieMembers")(members.map(m=>m.id))}>✓ Tous</Btn>
                  <Btn bg="rgba(255,255,255,0.08)" xs onClick={()=>sf("sortieMembers")([])}>✗ Aucun</Btn>
                </div>
                <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
                  {members.map((m,i) => {
                    const selIds=form.sortieMembers||[], checked=selIds.some(id=>`${id}`===`${m.id}`);
                    const n=selIds.length, part=n>0&&form.montant&&parseFloat(form.montant)>0?parseFloat(form.montant)/n:null;
                    const après=checked&&part!=null?(m.fondsCaisse||0)-part:null;
                    return (
                      <div key={m.id} onClick={()=>{if(checked)sf("sortieMembers")(selIds.filter(id=>`${id}`!==`${m.id}`));else sf("sortieMembers")([...selIds,m.id]);}} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:i<members.length-1?`1px solid ${C.border}`:"none", cursor:"pointer", background:checked?"rgba(233,69,96,0.07)":"transparent" }}>
                        <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${checked?C.accent:C.muted}`, background:checked?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{checked&&<span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}</div>
                        <div style={{ flex:1 }}><span style={{ fontWeight:600, fontSize:13 }}>{m.name}</span>{m.ville&&<span style={{ fontSize:11, color:C.muted, marginLeft:6 }}>{m.ville}</span>}</div>
                        <div style={{ textAlign:"right", minWidth:140 }}>
                          <span style={{ fontSize:12, color:C.muted }}>Solde : </span><span style={{ fontSize:12, fontWeight:700, color:(m.fondsCaisse||0)>=0?C.text:C.danger }}>{fmt(m.fondsCaisse||0)}</span>
                          {checked&&part!=null&&<div style={{ fontSize:11, color:après!=null&&après<0?C.danger:C.gold, marginTop:2 }}>− {fmt(part)} → <strong style={{ color:après!=null&&après<0?C.danger:C.green }}>{fmt(après)}</strong></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(form.sortieMembers||[]).length>0&&form.montant&&parseFloat(form.montant)>0&&<div style={{ marginTop:8, padding:"8px 12px", background:`${C.accent}12`, borderRadius:8, border:`1px solid ${C.accent}22`, fontSize:12, display:"flex", gap:16, flexWrap:"wrap" }}><span>👥 <strong>{(form.sortieMembers||[]).length}</strong> membre(s)</span><span>÷</span><span>💸 <strong style={{ color:C.gold }}>{fmt(parseFloat(form.montant))}</strong></span><span>=</span><span>📌 <strong style={{ color:C.accent }}>{fmt(parseFloat(form.montant)/(form.sortieMembers||[1]).length)}</strong> / membre</span></div>}
              </div>
            )}
            <div style={FR}><label style={LBL}>Raison / Justification *</label><input style={INP} value={form.raison||""} onChange={e=>sf("raison")(e.target.value)} placeholder="Ex: Achat de fournitures pour la réunion annuelle"/></div>
            <div style={FR}><label style={LBL}>Montant total (FCFA) *</label><input style={INP} type="number" value={form.montant||""} onChange={e=>sf("montant")(e.target.value)} placeholder="Ex: 33 000"/>{form.source==="asso"&&form.montant&&parseFloat(form.montant)>0&&<div style={{ fontSize:11, color:C.muted, marginTop:5, padding:"5px 10px", background:"rgba(255,255,255,0.04)", borderRadius:6 }}>Solde Fonds Asso après sortie : <strong style={{ color:parseFloat(form.montant)<=fondsAsso?C.green:C.danger }}>{fmt(fondsAsso-parseFloat(form.montant))}</strong></div>}</div>
            <div style={FR}><label style={LBL}>Date</label><input style={INP} type="date" value={form.date||tod()} onChange={e=>sf("date")(e.target.value)}/></div>
            <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:18 }}><Btn bg={C.muted} onClick={closeM}>Annuler</Btn><Btn bg={C.danger} onClick={doAddSortie}>✓ Enregistrer la sortie</Btn></div>
          </div>
        )}

        {/* ── Détail Membre ── */}
        {modal.type==="memberDetail" && detailMb && (
          <div>
            <div style={{ padding:"18px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:19, fontWeight:800, marginBottom:3 }}>{detailMb.name}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:8 }}>
                  {detailMb.ville&&<span style={{ marginRight:14 }}>📍 {detailMb.ville}</span>}
                  {detailMb.telephone&&<span>📞 {detailMb.telephone}</span>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Badge color={detailMb.aJour?C.green:C.danger}>{detailMb.aJour?"✓ À jour":"✗ Non à jour"}</Badge>
                  <Badge color={detailMb.droitPret?C.green:C.warn}>{detailMb.droitPret?"✓ Droit prêt":"⏸ Bloqué"}</Badge>
                </div>
              </div>
                <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                  <Btn bg={C.blue}   sm onClick={() => openSub("addCotisation",{memberId:`${detailMb.id}`})}>+ Cotisation</Btn>
                  <Btn bg={C.accent} sm onClick={() => openSub("addLoan",{emprunteurId:`${detailMb.id}`})}>+ Prêt</Btn>
                  <Btn bg="rgba(255,255,255,0.07)" sm onClick={() => prtMember(detailMb)}>🖨️</Btn>
                  <button onClick={closeAll} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:20, lineHeight:1, marginLeft:4 }}>✕</button>
                </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, padding:"14px 24px", borderBottom:`1px solid ${C.border}` }}>
              {[{l:"Fonds Caisse",v:fmt(detailMb.fondsCaisse),c:detailMb.aJour?C.green:C.warn},{l:"Fonds Roulement",v:fmt(detailMb.fondsRoulement),c:C.blue},{l:"Part Prorata",v:detailMb.prorata.toFixed(2)+"%",c:C.gold},{l:"Prêt actif",v:detailMb.loanActif?fmt(detailMb.loanActif.montantDu):"Aucun",c:detailMb.loanActif?C.danger:C.muted}].map((s,i) => (
                <div key={i} style={{ background:C.card2, borderRadius:10, padding:"10px 12px", border:`1px solid ${s.c}33` }}>
                  <div style={{ fontSize:13, fontWeight:800, color:s.c, marginBottom:3 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:0.6 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:"0 24px 24px" }}>
              <SectionLabel label={`💰 Cotisations — ${detailCotis.filter(c=>!c.auto).length} manuelles + ${detailCotis.filter(c=>c.auto).length} auto`}/>
              {detailCotis.length===0 ? <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"14px 0" }}>Aucune cotisation</div> : (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                    <div style={{ background:`${C.blue}14`, border:`1px solid ${C.blue}30`, borderRadius:10, padding:"10px 14px" }}><div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:3 }}>🏦 Fonds de Caisse</div><div style={{ fontSize:15, fontWeight:800, color:C.blue }}>{fmt(detailCotisC.reduce((s,c)=>s+c.montant,0))}</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{detailCotisC.length} versement{detailCotisC.length!==1?"s":""}</div></div>
                    <div style={{ background:`${C.green}14`, border:`1px solid ${C.green}30`, borderRadius:10, padding:"10px 14px" }}><div style={{ fontSize:11, color:C.muted, textTransform:"uppercase", marginBottom:3 }}>🔄 Fonds de Roulement</div><div style={{ fontSize:15, fontWeight:800, color:C.green }}>{fmt(detailCotisR.reduce((s,c)=>s+c.montant,0))}</div><div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{detailCotisR.length} versement{detailCotisR.length!==1?"s":""}</div></div>
                  </div>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead><tr>{["Date & Heure","Type / Opération","Montant","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                    <tbody>{detailCotis.map(c => {
                      const isD=c.direction==="debit", isCr=c.direction==="credit"&&c.auto;
                      const bColor = isD?C.warn:isCr?C.green:c.type==="caisse"?C.blue:C.green;
                      const enriched = enrichLabel(c, detailMb.id);
                      const labelText = enriched || (isD?`📤 ${c.label||"Contribution"}`:isCr?`📥 ${c.label||"Retour"}`:c.type==="caisse"?"🏦 Versement Caisse":"🔄 Versement Roulement");
                      return (<tr key={c.id}>
                        <TD s={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", minWidth:85 }}>
                          {c.date}
                          <div style={{ fontSize:10 }}>{c.heure||"—"}</div>
                        </TD>
                        <TD>
                          <span style={{ display:"inline-block", padding:"3px 9px", borderRadius:12, fontSize:11, fontWeight:700, color:"#fff", background:bColor+"cc", wordBreak:"break-word", maxWidth:380 }}>
                            {labelText}
                          </span>
                        </TD>
                        <TD><strong style={{ color:isD?C.danger:C.gold }}>{isD?"−":"+"} {fmt(c.montant)}</strong></TD>
                        <TD>{c.auto ? <span style={{ fontSize:10, color:C.muted, fontStyle:"italic" }}>auto</span> : (
                          <div style={{ display:"flex", gap:3 }}>
                            <Btn bg={C.gold}   xs onClick={() => openSub("editCotisation",{cotisId:`${c.id}`,memberId:`${c.memberId}`,type:c.type,montant:`${c.montant}`,date:c.date})}>✏️</Btn>
                            <Btn bg={C.danger} xs onClick={() => doDeleteCotisation(c.id)}>🗑️</Btn>
                          </div>
                        )}</TD>
                      </tr>);
                    })}</tbody>
                  </table>
                </div>
              )}

              <SectionLabel label={`💳 Prêts — ${detailLoans.length} au total`}/>
              {detailLoans.length===0 ? <div style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"14px 0" }}>Aucun prêt</div> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead><tr>{["Date","Montant","Intérêts","Total Dû","Échéance","Statut","Actions"].map(h=><TH key={h} ch={h}/>)}</tr></thead>
                  <tbody>{detailLoans.map(l => {
                    const d=Math.ceil((new Date(l.echeance) - new Date()) / 864e5);
                    return (<tr key={l.id}>
                      <TD s={{ fontSize:11, color:C.muted }}>{l.date}</TD>
                      <TD>{fmt(l.montant)}</TD>
                      <TD s={{ color:C.gold }}>{fmt(l.interets)}</TD>
                      <TD><strong style={{ color:C.accent }}>{fmt(l.montantDu)}</strong></TD>
                      <TD><div style={{ fontSize:11 }}>{l.echeance}</div>{l.status==="actif"&&<div style={{ fontSize:10, color:d<=0?C.danger:d<=30?C.warn:C.muted }}>{d<=0?`🚨 ${Math.abs(d)}j`:`${d}j restants`}</div>}</TD>
                      <TD><Badge color={l.status==="actif"?C.warn:C.green}>{l.status==="actif"?"En cours":"Remboursé"}</Badge></TD>
                      <TD><div style={{ display:"flex", gap:3 }}>
                        {l.status==="actif"&&<Btn bg={C.green} xs onClick={() => openSub("repayLoan",{loanId:`${l.id}`})}>✓ Payer</Btn>}
                        <Btn bg={C.gold}   xs onClick={() => openSub("editLoan",{loanId:`${l.id}`,montant:`${l.montant}`,date:l.date,assistantId:`${l.assistantId||""}`,emprunteurId:`${l.emprunteurId}`})}>✏️</Btn>
                        <Btn bg={C.danger} xs onClick={() => doDeleteLoan(l.id)}>🗑️</Btn>
                      </div></TD>
                    </tr>);
                  })}</tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
