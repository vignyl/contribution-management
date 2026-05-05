import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Btn, Badge, TH, TD, SectionLabel } from "./ui";
import {
  C,
  INP,
  LBL,
  FR,
  fmt,
  tod,
  add3M,
  calcMontantActuel,
  doPrint,
  nowLbl,
} from "../utils";

export const Modals = () => {
  const {
    modal,
    closeM,
    form,
    sf,
    members,
    membersX,
    cotisations,
    loans,
    doChangeCredentials,
    doAddMember,
    doEditMember,
    doAddCotisation,
    doEditCotisation,
    doAddLoan,
    doEditLoan,
    doRepay,
    doAddSanction,
    doEditSanction,
    doAddSortie,
    doDeleteCotisation,
    doDeleteLoan,
    openSub,
    closeAll,
    totFC,
    fondsAsso,
    prtMember,
    sanctions,
    sorties,
    doAddDailyCotis,
    sessions,
    dailyContributions,
    doAddSession,
    doDeleteDailyCotis,
    doSaveDailyMetadata,
    doUpdateDailyRow,
  } = useApp();

  if (!modal) return null;

  /* ── Données modale détail ───────────────────────────────────────────────── */
  const detailMbId =
    modal?.type === "memberDetail" ? modal.data.memberId : null;
  const detailMb = detailMbId
    ? membersX.find((m) => m.id === detailMbId)
    : null;
  const detailCotis = detailMbId
    ? [...cotisations]
        .filter((c) => c.memberId === detailMbId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  const detailCotisC = detailCotis.filter(
    (c) => c.type === "caisse" && !c.auto,
  );
  const detailCotisR = detailCotis.filter(
    (c) => c.type === "roulement" && !c.auto,
  );
  const detailLoans = detailMbId
    ? [...loans]
        .filter((l) => l.emprunteurId === detailMbId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];
  const editLoanObj =
    modal?.type === "editLoan"
      ? loans.find((l) => l.id === parseInt(form.loanId))
      : null;

  /* ── Label enrichi pour les cotisations auto (détail membre) ── */
  const enrichLabel = (c, viewMemberId) => {
    if (!c.auto) return null;
    const loan = loans.find((l) => l.id === c.loanId);
    if (!loan) return c.label || "Opération auto";
    const emprName =
      members.find((m) => m.id === loan.emprunteurId)?.name || "?";
    const isSelf = loan.emprunteurId === viewMemberId;
    if (c.direction === "debit") {
      if (isSelf)
        return `Contribution prêt — votre prêt ${fmt(loan.montant)} (sortie roulement: ${fmt(c.montant)})`;
      return `Contribution prêt — prêté à ${emprName} ${fmt(loan.montant)} (votre part: ${fmt(c.montant)})`;
    } else {
      if (isSelf)
        return `Retour prêt — votre remboursement ${fmt(loan.montant)} (encaissé: ${fmt(c.montant)})`;
      return `Retour prêt + gains — ${emprName} ${fmt(loan.montant)} (votre retour: ${fmt(c.montant)})`;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.84)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(5px)",
      }}
      onClick={modal.type === "memberDetail" ? undefined : closeM}
    >
      <div
        style={{
          background: C.card,
          borderRadius: 16,
          padding: modal.type === "memberDetail" ? 0 : 28,
          width: modal.type === "memberDetail" ? 800 : 480,
          maxWidth: "96vw",
          border: `1px solid ${C.border}`,
          boxShadow: "0 24px 70px rgba(0,0,0,.8)",
          maxHeight: "94vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Changer identifiants ── */}
        {modal.type === "changeCredentials" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.gold,
              }}
            >
              ⚙️ Modifier les identifiants
            </div>
            <div style={FR}>
              <label style={LBL}>Mot de passe actuel *</label>
              <input
                style={INP}
                type="password"
                value={form.curPass || ""}
                onChange={(e) => sf("curPass")(e.target.value)}
                autoFocus
                placeholder="Mot de passe actuel"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Nouveau nom d'utilisateur *</label>
              <input
                style={INP}
                value={form.newUser || ""}
                onChange={(e) => sf("newUser")(e.target.value)}
                placeholder="Nouveau nom d'utilisateur"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Nouveau mot de passe *</label>
              <input
                style={INP}
                type="password"
                value={form.newPass || ""}
                onChange={(e) => sf("newPass")(e.target.value)}
                placeholder="Nouveau mot de passe (min. 4 caractères)"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Confirmer le nouveau mot de passe *</label>
              <input
                style={INP}
                type="password"
                value={form.confPass || ""}
                onChange={(e) => sf("confPass")(e.target.value)}
                placeholder="Confirmer"
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.gold} onClick={doChangeCredentials}>
                ✓ Enregistrer
              </Btn>
            </div>
          </div>
        )}

        {/* ── Nouveau / Edit membre ── */}
        {modal.type === "addMember" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.gold,
              }}
            >
              👤 Nouveau Membre
            </div>
            <div style={FR}>
              <label style={LBL}>Nom complet *</label>
              <input
                style={INP}
                value={form.name || ""}
                onChange={(e) => sf("name")(e.target.value)}
                autoFocus
                placeholder="Ex: Amadou Diallo"
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={FR}>
                <label style={LBL}>Ville</label>
                <input
                  style={INP}
                  value={form.ville || ""}
                  onChange={(e) => sf("ville")(e.target.value)}
                  placeholder="Ex: Yaoundé"
                />
              </div>
              <div style={FR}>
                <label style={LBL}>Téléphone</label>
                <input
                  style={INP}
                  value={form.telephone || ""}
                  onChange={(e) => sf("telephone")(e.target.value)}
                  placeholder="Ex: 690 00 00 00"
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.accent} onClick={doAddMember}>
                ✓ Créer
              </Btn>
            </div>
          </div>
        )}
        {modal.type === "editMember" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.gold,
              }}
            >
              ✏️ Modifier le Membre
            </div>
            <div style={FR}>
              <label style={LBL}>Nom *</label>
              <input
                style={INP}
                value={form.name || ""}
                onChange={(e) => sf("name")(e.target.value)}
                autoFocus
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={FR}>
                <label style={LBL}>Ville</label>
                <input
                  style={INP}
                  value={form.ville || ""}
                  onChange={(e) => sf("ville")(e.target.value)}
                />
              </div>
              <div style={FR}>
                <label style={LBL}>Téléphone</label>
                <input
                  style={INP}
                  value={form.telephone || ""}
                  onChange={(e) => sf("telephone")(e.target.value)}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.gold} onClick={doEditMember}>
                ✓ Enregistrer
              </Btn>
            </div>
          </div>
        )}

        {/* ── Cotisation ── */}
        {(modal.type === "addCotisation" ||
          modal.type === "editCotisation") && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.gold,
              }}
            >
              {modal.type === "editCotisation" ? "✏️ Modifier" : "💰 Nouvelle"}{" "}
              Cotisation
            </div>
            {modal.type === "addCotisation" && (
              <div style={FR}>
                <label style={LBL}>Membre *</label>
                <select
                  style={INP}
                  value={form.memberId || ""}
                  onChange={(e) => sf("memberId")(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {members.map((m) => (
                    <option key={m.id} value={`${m.id}`}>
                      {m.name}
                      {m.ville ? ` (${m.ville})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={FR}>
              <label style={LBL}>Type *</label>
              <select
                style={INP}
                value={form.type || ""}
                onChange={(e) => sf("type")(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                <option value="caisse">🏦 Fonds de Caisse</option>
                <option value="roulement">🔄 Fonds de Roulement</option>
              </select>
            </div>
            <div style={FR}>
              <label style={LBL}>Montant (FCFA) *</label>
              <input
                style={INP}
                type="number"
                value={form.montant || ""}
                onChange={(e) => sf("montant")(e.target.value)}
                placeholder="Ex: 25 000"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Date</label>
              <input
                style={INP}
                type="date"
                value={form.date || tod()}
                onChange={(e) => sf("date")(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn
                bg={modal.type === "editCotisation" ? C.gold : C.accent}
                onClick={
                  modal.type === "editCotisation"
                    ? doEditCotisation
                    : doAddCotisation
                }
              >
                ✓ {modal.type === "editCotisation" ? "Modifier" : "Enregistrer"}
              </Btn>
            </div>
          </div>
        )}

        {/* ── Nouveau prêt ── */}
        {modal.type === "addLoan" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.gold,
              }}
            >
              💳 Nouveau Prêt
            </div>
            <div style={FR}>
              <label style={LBL}>Emprunteur *</label>
              <select
                style={INP}
                value={form.emprunteurId || ""}
                onChange={(e) => sf("emprunteurId")(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {membersX.map((m) => (
                  <option key={m.id} value={`${m.id}`}>
                    {m.name}
                    {m.ville ? ` (${m.ville})` : ""}
                    {!m.droitPret ? " ⏸" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={FR}>
              <label style={LBL}>Montant (FCFA) *</label>
              <input
                style={INP}
                type="number"
                value={form.montant || ""}
                onChange={(e) => sf("montant")(e.target.value)}
                placeholder="Ex: 50 000"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>
                Date du prêt{" "}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 11,
                    textTransform: "none",
                    color: C.muted,
                    marginLeft: 6,
                  }}
                >
                  (échéance = +3 mois)
                </span>
              </label>
              <input
                style={INP}
                type="date"
                value={form.date || tod()}
                onChange={(e) => sf("date")(e.target.value)}
              />
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 5,
                  padding: "5px 10px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                  display: "flex",
                  gap: 16,
                }}
              >
                <span>
                  📅{" "}
                  <strong style={{ color: C.text }}>
                    {form.date || tod()}
                  </strong>
                </span>
                <span>
                  ⏱️ Échéance :{" "}
                  <strong style={{ color: C.gold }}>
                    {add3M(form.date || tod())}
                  </strong>
                </span>
              </div>
            </div>
            {form.montant && parseFloat(form.montant) > 0 && (
              <div
                style={{
                  background: `${C.gold}0e`,
                  border: `1px solid ${C.gold}28`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 12,
                  lineHeight: 2,
                }}
              >
                <div>
                  📌 Montant : <strong>{fmt(parseFloat(form.montant))}</strong>
                </div>
                <div>
                  💰 Intérêts (10%) :{" "}
                  <strong style={{ color: C.gold }}>
                    {fmt(parseFloat(form.montant) * 0.1)}
                  </strong>
                </div>
                <div style={{ paddingLeft: 12, color: C.muted }}>
                  🏛️ 2% → Fonds Association :{" "}
                  {fmt(parseFloat(form.montant) * 0.02)}
                </div>
                <div style={{ paddingLeft: 12, color: C.muted }}>
                  👥 8% → Redistribués au prorata snapshot :{" "}
                  {fmt(parseFloat(form.montant) * 0.08)}
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: 5,
                    marginTop: 2,
                  }}
                >
                  💳{" "}
                  <strong>
                    Total à rembourser :{" "}
                    <span style={{ color: C.accent }}>
                      {fmt(parseFloat(form.montant) * 1.1)}
                    </span>
                  </strong>
                </div>
              </div>
            )}
            <div style={FR}>
              <label style={LBL}>Assistant (optionnel)</label>
              <select
                style={INP}
                value={form.assistantId || ""}
                onChange={(e) => sf("assistantId")(e.target.value)}
              >
                <option value="">— Aucun —</option>
                {membersX
                  .filter((m) => `${m.id}` !== form.emprunteurId && m.droitPret)
                  .map((m) => (
                    <option key={m.id} value={`${m.id}`}>
                      {m.name}
                    </option>
                  ))}
              </select>
              {form.assistantId && (
                <div
                  style={{
                    fontSize: 11,
                    color: C.warn,
                    marginTop: 5,
                    background: `${C.warn}12`,
                    padding: "5px 10px",
                    borderRadius: 6,
                  }}
                >
                  ⚠️ L'assistant perdra son droit de prêt jusqu'au
                  remboursement.
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.accent} onClick={doAddLoan}>
                ✓ Accorder le prêt
              </Btn>
            </div>
          </div>
        )}

        {/* ── Modifier prêt ── */}
        {modal.type === "editLoan" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 8,
                color: C.gold,
              }}
            >
              ✏️ Modifier le Prêt
            </div>
            {editLoanObj?.status === "actif" && (
              <div
                style={{
                  fontSize: 12,
                  color: C.warn,
                  marginBottom: 16,
                  background: `${C.warn}12`,
                  padding: "8px 12px",
                  borderRadius: 8,
                }}
              >
                ⚠️ Prêt actif — la modification recalcule les contributions et
                réajuste les fonds.
              </div>
            )}
            <div style={FR}>
              <label style={LBL}>Montant (FCFA) *</label>
              <input
                style={INP}
                type="number"
                value={form.montant || ""}
                onChange={(e) => sf("montant")(e.target.value)}
              />
            </div>
            {form.montant && parseFloat(form.montant) > 0 && (
              <div
                style={{
                  background: `${C.gold}0e`,
                  border: `1px solid ${C.gold}28`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  marginBottom: 14,
                  fontSize: 12,
                  lineHeight: 1.9,
                }}
              >
                <div>
                  💰 Intérêts :{" "}
                  <strong style={{ color: C.gold }}>
                    {fmt(parseFloat(form.montant) * 0.1)}
                  </strong>
                </div>
                <div>
                  💳 Total :{" "}
                  <strong style={{ color: C.accent }}>
                    {fmt(parseFloat(form.montant) * 1.1)}
                  </strong>
                </div>
              </div>
            )}
            <div style={FR}>
              <label style={LBL}>Date du prêt</label>
              <input
                style={INP}
                type="date"
                value={form.date || tod()}
                onChange={(e) => sf("date")(e.target.value)}
              />
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  marginTop: 5,
                  padding: "5px 10px",
                  background: "rgba(255,255,255,0.04)",
                  borderRadius: 6,
                }}
              >
                ⏱️{" "}
                <strong style={{ color: C.gold }}>
                  {add3M(form.date || tod())}
                </strong>
              </div>
            </div>
            {editLoanObj?.status === "actif" && (
              <div style={FR}>
                <label style={LBL}>Assistant</label>
                <select
                  style={INP}
                  value={form.assistantId || ""}
                  onChange={(e) => sf("assistantId")(e.target.value)}
                >
                  <option value="">— Aucun —</option>
                  {membersX
                    .filter(
                      (m) =>
                        `${m.id}` !== form.emprunteurId &&
                        (m.droitPret || m.id === editLoanObj?.assistantId),
                    )
                    .map((m) => (
                      <option key={m.id} value={`${m.id}`}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.gold} onClick={doEditLoan}>
                ✓ Enregistrer
              </Btn>
            </div>
          </div>
        )}

        {/* ── Remboursement prêt ── */}
        {modal.type === "repayLoan" &&
          (() => {
            const loan = loans.find((l) => `${l.id}` === `${form.loanId}`);
            const empr = loan
              ? members.find((m) => m.id === loan.emprunteurId)
              : null;
            const repDate = form.repayDate || tod();
            const actual = loan ? calcMontantActuel(loan, repDate) : null;
            return loan && actual ? (
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 6,
                    color: C.green,
                  }}
                >
                  💳 Remboursement de Prêt
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>
                  {empr?.name} — Prêt accordé le{" "}
                  <strong style={{ color: C.text }}>{loan.date}</strong>
                </div>
                <div style={FR}>
                  <label style={LBL}>📅 Date de remboursement *</label>
                  <input
                    style={INP}
                    type="date"
                    value={repDate}
                    onChange={(e) => sf("repayDate")(e.target.value)}
                    min={loan.date}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 5,
                      padding: "5px 10px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                    }}
                  >
                    Délai :{" "}
                    <strong style={{ color: C.text }}>
                      {Math.max(
                        0,
                        Math.round(
                          (new Date(repDate) - new Date(loan.date)) / 864e5,
                        ),
                      )}{" "}
                      jours depuis le prêt
                    </strong>
                  </div>
                </div>
                <div
                  style={{
                    background: `${actual.periods > 1 ? C.danger : C.gold}10`,
                    border: `1px solid ${actual.periods > 1 ? C.danger : C.gold}30`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: actual.periods > 1 ? C.danger : C.gold,
                      marginBottom: 10,
                    }}
                  >
                    {actual.periods > 1
                      ? `⚠️ Période ${actual.periods} — Intérêts composés`
                      : `✓ Période 1 — Dans les délais`}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    {[
                      {
                        l: "Capital emprunté",
                        v: fmt(loan.montant),
                        c: C.text,
                      },
                      {
                        l: `Intérêts (${actual.periods}×10%)`,
                        v: `+${fmt(actual.interets)}`,
                        c: C.gold,
                      },
                      {
                        l: "→ Fonds Asso (20% int.)",
                        v: `+${fmt(actual.fraisAsso)}`,
                        c: C.purple,
                      },
                      {
                        l: "→ Membres (80% int.)",
                        v: `+${fmt(actual.gainMbr)}`,
                        c: C.green,
                      },
                    ].map((x, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "8px 10px",
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            color: C.muted,
                            fontSize: 10,
                            textTransform: "uppercase",
                            marginBottom: 3,
                          }}
                        >
                          {x.l}
                        </div>
                        <div style={{ fontWeight: 700, color: x.c }}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${C.border}`,
                      marginTop: 12,
                      paddingTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      💳 Total à encaisser
                    </span>
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: 18,
                        color: actual.periods > 1 ? C.danger : C.green,
                      }}
                    >
                      {fmt(actual.montantDu)}
                    </span>
                  </div>
                  {actual.periods > 1 && (
                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 11,
                        color: C.muted,
                        borderTop: `1px solid ${C.border}`,
                        paddingTop: 8,
                      }}
                    >
                      {Array.from({ length: actual.periods }).map((_, i) => (
                        <span key={i} style={{ marginRight: 8 }}>
                          Pér.{i + 1}:{" "}
                          {fmt(loan.montant * Math.pow(1.1, i + 1))}
                          {i < actual.periods - 1 ? " →" : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 4,
                  }}
                >
                  <Btn bg={C.muted} onClick={closeM}>
                    Annuler
                  </Btn>
                  <Btn bg={C.green} onClick={() => doRepay(loan.id, repDate)}>
                    ✓ Confirmer le remboursement
                  </Btn>
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: C.muted,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                Prêt introuvable.
              </div>
            );
          })()}

        {/* ── Sanction ── */}
        {(modal.type === "addSanction" || modal.type === "editSanction") && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.warn,
              }}
            >
              {modal.type === "editSanction"
                ? "✏️ Modifier la Sanction"
                : "⚠️ Nouvelle Sanction"}
            </div>
            <div style={FR}>
              <label style={LBL}>Membre sanctionné *</label>
              <select
                style={INP}
                value={form.memberId || ""}
                onChange={(e) => sf("memberId")(e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {members.map((m) => (
                  <option key={m.id} value={`${m.id}`}>
                    {m.name}
                    {m.ville ? ` (${m.ville})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div style={FR}>
              <label style={LBL}>Raison de la sanction *</label>
              <input
                style={INP}
                value={form.raison || ""}
                onChange={(e) => sf("raison")(e.target.value)}
                placeholder="Ex: Absence non justifiée à la réunion du 15/01"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Montant (FCFA) *</label>
              <input
                style={INP}
                type="number"
                value={form.montant || ""}
                onChange={(e) => sf("montant")(e.target.value)}
                placeholder="Ex: 5 000"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Date</label>
              <input
                style={INP}
                type="date"
                value={form.date || tod()}
                onChange={(e) => sf("date")(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn
                bg={C.warn}
                onClick={
                  modal.type === "editSanction" ? doEditSanction : doAddSanction
                }
              >
                ✓ {modal.type === "editSanction" ? "Modifier" : "Enregistrer"}
              </Btn>
            </div>
          </div>
        )}

        {/* ── Sortie de fonds ── */}
        {modal.type === "addSortie" && (
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                color: C.danger,
              }}
            >
              📤 Nouvelle Sortie de Fonds
            </div>
            <div style={FR}>
              <label style={LBL}>D'où sort l'argent ? (Source) *</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div 
                  onClick={() => sf("source")("caisse")}
                  style={{ 
                    padding:12, borderRadius:12, cursor:"pointer", textAlign:"center",
                    border:`2px solid ${form.source==="caisse" ? C.blue : C.border}`,
                    background:form.source==="caisse" ? `${C.blue}22` : "transparent",
                    transition:"all 0.2s"
                  }}
                >
                  <div style={{ fontSize:22, marginBottom:4 }}>🏦</div>
                  <div style={{ fontWeight:700, color:form.source==="caisse"?C.blue:C.muted, fontSize:12 }}>Fonds de Caisse</div>
                  <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>Total membres : {fmt(totFC)}</div>
                </div>
                <div 
                  onClick={() => sf("source")("asso")}
                  style={{ 
                    padding:12, borderRadius:12, cursor:"pointer", textAlign:"center",
                    border:`2px solid ${form.source==="asso" ? C.purple : C.border}`,
                    background:form.source==="asso" ? `${C.purple}22` : "transparent",
                    transition:"all 0.2s"
                  }}
                >
                  <div style={{ fontSize:22, marginBottom:4 }}>🏛️</div>
                  <div style={{ fontWeight:700, color:form.source==="asso"?C.purple:C.muted, fontSize:12 }}>Fonds Association</div>
                  <div style={{ fontSize:9, color:C.muted, marginTop:2 }}>Disponible : {fmt(fondsAsso)}</div>
                </div>
              </div>
            </div>
            {form.source === "caisse" && members.length > 0 && (
              <div style={FR}>
                <label style={LBL}>
                  Membres concernés *{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      fontSize: 11,
                      textTransform: "none",
                      color: C.muted,
                    }}
                  >
                    (débit = montant ÷ nb membres sélectionnés)
                  </span>
                </label>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <Btn
                    bg="rgba(255,255,255,0.08)"
                    xs
                    onClick={() =>
                      sf("sortieMembers")(members.map((m) => m.id))
                    }
                  >
                    ✓ Tous
                  </Btn>
                  <Btn
                    bg="rgba(255,255,255,0.08)"
                    xs
                    onClick={() => sf("sortieMembers")([])}
                  >
                    ✗ Aucun
                  </Btn>
                </div>
                <div
                  style={{
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {members.map((m, i) => {
                    const selIds = form.sortieMembers || [],
                      checked = selIds.some((id) => `${id}` === `${m.id}`);
                    const n = selIds.length,
                      part =
                        n > 0 && form.montant && parseFloat(form.montant) > 0
                          ? parseFloat(form.montant) / n
                          : null;
                    const après =
                      checked && part != null
                        ? (m.fondsCaisse || 0) - part
                        : null;
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (checked)
                            sf("sortieMembers")(
                              selIds.filter((id) => `${id}` !== `${m.id}`),
                            );
                          else sf("sortieMembers")([...selIds, m.id]);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "9px 14px",
                          borderBottom:
                            i < members.length - 1
                              ? `1px solid ${C.border}`
                              : "none",
                          cursor: "pointer",
                          background: checked
                            ? "rgba(233,69,96,0.07)"
                            : "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            border: `2px solid ${checked ? C.accent : C.muted}`,
                            background: checked ? C.accent : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {checked && (
                            <span
                              style={{
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {m.name}
                          </span>
                          {m.ville && (
                            <span
                              style={{
                                fontSize: 11,
                                color: C.muted,
                                marginLeft: 6,
                              }}
                            >
                              {m.ville}
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: "right", minWidth: 140 }}>
                          <span style={{ fontSize: 12, color: C.muted }}>
                            Solde :{" "}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color:
                                (m.fondsCaisse || 0) >= 0 ? C.text : C.danger,
                            }}
                          >
                            {fmt(m.fondsCaisse || 0)}
                          </span>
                          {checked && part != null && (
                            <div
                              style={{
                                fontSize: 11,
                                color:
                                  après != null && après < 0
                                    ? C.danger
                                    : C.gold,
                                marginTop: 2,
                              }}
                            >
                              − {fmt(part)} →{" "}
                              <strong
                                style={{
                                  color:
                                    après != null && après < 0
                                      ? C.danger
                                      : C.green,
                                }}
                              >
                                {fmt(après)}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(form.sortieMembers || []).length > 0 &&
                  form.montant &&
                  parseFloat(form.montant) > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        background: `${C.accent}12`,
                        borderRadius: 8,
                        border: `1px solid ${C.accent}22`,
                        fontSize: 12,
                        display: "flex",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        👥 <strong>{(form.sortieMembers || []).length}</strong>{" "}
                        membre(s)
                      </span>
                      <span>÷</span>
                      <span>
                        💸{" "}
                        <strong style={{ color: C.gold }}>
                          {fmt(parseFloat(form.montant))}
                        </strong>
                      </span>
                      <span>=</span>
                      <span>
                        📌{" "}
                        <strong style={{ color: C.accent }}>
                          {fmt(
                            parseFloat(form.montant) /
                              (form.sortieMembers || [1]).length,
                          )}
                        </strong>{" "}
                        / membre
                      </span>
                    </div>
                  )}
              </div>
            )}
            <div style={FR}>
              <label style={LBL}>Raison / Justification *</label>
              <input
                style={INP}
                value={form.raison || ""}
                onChange={(e) => sf("raison")(e.target.value)}
                placeholder="Ex: Achat de fournitures pour la réunion annuelle"
              />
            </div>
            <div style={FR}>
              <label style={LBL}>Montant total (FCFA) *</label>
              <input
                style={INP}
                type="number"
                value={form.montant || ""}
                onChange={(e) => sf("montant")(e.target.value)}
                placeholder="Ex: 33 000"
              />
              {form.source === "asso" &&
                form.montant &&
                parseFloat(form.montant) > 0 && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      marginTop: 5,
                      padding: "5px 10px",
                      background: "rgba(255,255,255,0.04)",
                      borderRadius: 6,
                    }}
                  >
                    Solde Fonds Asso après sortie :{" "}
                    <strong
                      style={{
                        color:
                          parseFloat(form.montant) <= fondsAsso
                            ? C.green
                            : C.danger,
                      }}
                    >
                      {fmt(fondsAsso - parseFloat(form.montant))}
                    </strong>
                  </div>
                )}
            </div>
            <div style={FR}>
              <label style={LBL}>Date</label>
              <input
                style={INP}
                type="date"
                value={form.date || tod()}
                onChange={(e) => sf("date")(e.target.value)}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 18,
              }}
            >
              <Btn bg={C.muted} onClick={closeM}>
                Annuler
              </Btn>
              <Btn bg={C.danger} onClick={doAddSortie}>
                ✓ Enregistrer la sortie
              </Btn>
            </div>
          </div>
        )}

        {/* ── Cotisation du Jour ── */}
        {modal.type === "addDailyCotis" &&
          (() => {
            const rows = form.rows || [];
            const updateRow = (idx, key, val) => {
              if (form.editId) {
                doUpdateDailyRow(rows[idx].memberId, key, val);
              } else {
                const nr = [...rows];
                nr[idx] = { ...nr[idx], [key]: val };
                sf("rows")(nr);
              }
            };
            const totB = rows.reduce(
              (s, r) => s + (parseFloat(r.beneficiaryAmt) || 0),
              0,
            );
            const totP = rows.reduce(
              (s, r) => s + (parseFloat(r.presenceAmt) || 0),
              0,
            );
            const totQ = rows.reduce(
              (s, r) => s + (parseFloat(r.packetAmt) || 0),
              0,
            );
            const totS = rows.reduce(
              (s, r) => s + (parseFloat(r.sanctionAmt) || 0),
              0,
            );
            const totR = rows.reduce(
              (s, r) => s + (parseFloat(r.receptionAmt) || 0),
              0,
            );

            // Auto-save metadata when fields are filled
            const canSaveMeta =
              form.date && form.sessionId && form.hostId && form.beneficiaryId;
            const isDraft = !form.editId;

            return (
              <div style={{ width: 1180, maxWidth: "100%" }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    marginBottom: 10,
                    color: C.accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span>
                      📅{" "}
                      {form.editId
                        ? "Séance du " + form.date
                        : "Nouvelle Cotisation du Jour"}
                    </span>
                    <Badge color={isDraft ? C.warn : C.green}>
                      {isDraft ? "Brouillon" : "Enregistré ✓"}
                    </Badge>
                  </div>
                  {form.editId && (
                    <Btn
                      bg={C.danger}
                      xs
                      onClick={() => {
                        doDeleteDailyCotis(form.editId);
                        closeM();
                      }}
                    >
                      🗑️ Supprimer
                    </Btn>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 12,
                    background: "rgba(255,255,255,0.02)",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <label style={{ ...LBL, fontSize: 10, marginBottom: 2 }}>
                      Session *
                    </label>
                    <div style={{ display: "flex", gap: 5 }}>
                      <select
                        style={{
                          ...INP,
                          flex: 1,
                          padding: "6px 10px",
                          fontSize: 12,
                          width: "auto",
                        }}
                        value={form.sessionId || ""}
                        onChange={(e) => {
                          sf("sessionId")(e.target.value);
                          if (canSaveMeta) setTimeout(doSaveDailyMetadata, 10);
                        }}
                      >
                        <option value="">— Sélectionner —</option>
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <Btn
                        bg={C.blue}
                        xs
                        onClick={() =>
                          sf("showAddSession")(!form.showAddSession)
                        }
                      >
                        {form.showAddSession ? "✕" : "+"}
                      </Btn>
                    </div>
                    {form.showAddSession && (
                      <div
                        style={{
                          marginTop: 5,
                          padding: 6,
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: 6,
                          border: `1px solid ${C.blue}44`,
                        }}
                      >
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            style={{ ...INP, padding: "4px 8px", fontSize: 11 }}
                            value={form.sessionName || ""}
                            onChange={(e) => sf("sessionName")(e.target.value)}
                            placeholder="Nom session..."
                          />
                          <Btn bg={C.blue} xs onClick={doAddSession}>
                            OK
                          </Btn>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ ...LBL, fontSize: 10, marginBottom: 2 }}>
                      Date *
                    </label>
                    <input
                      style={{ ...INP, padding: "6px 10px", fontSize: 12 }}
                      type="date"
                      value={form.date || tod()}
                      onChange={(e) => {
                        sf("date")(e.target.value);
                        if (canSaveMeta) setTimeout(doSaveDailyMetadata, 10);
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ ...LBL, fontSize: 10, marginBottom: 2 }}>
                      Lieu *
                    </label>
                    <select
                      style={{ ...INP, padding: "6px 10px", fontSize: 12 }}
                      value={form.hostId || ""}
                      onChange={(e) => {
                        sf("hostId")(e.target.value);
                        if (canSaveMeta) setTimeout(doSaveDailyMetadata, 10);
                      }}
                    >
                      <option value="">— Sélectionner —</option>
                      {members.map((m) => (
                        <option key={m.id} value={`${m.id}`}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...LBL, fontSize: 10, marginBottom: 2 }}>
                      Bénéficiaire *
                    </label>
                    <select
                      style={{ ...INP, padding: "6px 10px", fontSize: 12 }}
                      value={form.beneficiaryId || ""}
                      onChange={(e) => {
                        sf("beneficiaryId")(e.target.value);
                        if (canSaveMeta) setTimeout(doSaveDailyMetadata, 10);
                      }}
                    >
                      <option value="">— Sélectionner —</option>
                      {members.map((m) => (
                        <option key={m.id} value={`${m.id}`}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isDraft && canSaveMeta && (
                  <div style={{ marginBottom: 12, textAlign: "center" }}>
                    <Btn bg={C.accent} sm onClick={doSaveDailyMetadata}>
                      🚀 Initialiser la séance
                    </Btn>
                  </div>
                )}

                <div
                  style={{
                    opacity: isDraft ? 0.4 : 1,
                    pointerEvents: isDraft ? "none" : "auto",
                    transition: "all 0.3s",
                  }}
                >
                  <div
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    <div style={{ overflowX: "auto", maxHeight: "62vh" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 11,
                        }}
                      >
                        <thead
                          style={{ position: "sticky", top: 0, zIndex: 10 }}
                        >
                          <tr>
                            <TH ch="Membre" />
                            <TH ch="Bénéficiaire" />
                            <TH ch="Présence" />
                            <TH ch="Réception" />
                            <TH ch="Paquet" />
                            <TH ch="Sanction" />
                            <TH ch="Raison Sanction" />
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={row.memberId}>
                              <TD
                                s={{
                                  fontWeight: 600,
                                  minWidth: 130,
                                  padding: "4px 10px",
                                }}
                              >
                                {row.name}
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    width: 100,
                                    fontSize: 11,
                                  }}
                                  type="number"
                                  placeholder="0"
                                  value={row.beneficiaryAmt || ""}
                                  onChange={(e) =>
                                    updateRow(
                                      i,
                                      "beneficiaryAmt",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    width: 100,
                                    fontSize: 11,
                                  }}
                                  type="number"
                                  placeholder="0"
                                  value={row.presenceAmt || ""}
                                  onChange={(e) =>
                                    updateRow(i, "presenceAmt", e.target.value)
                                  }
                                />
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    width: 100,
                                    fontSize: 11,
                                  }}
                                  type="number"
                                  placeholder="0"
                                  value={row.receptionAmt || ""}
                                  onChange={(e) =>
                                    updateRow(i, "receptionAmt", e.target.value)
                                  }
                                />
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    width: 100,
                                    fontSize: 11,
                                  }}
                                  type="number"
                                  placeholder="0"
                                  value={row.packetAmt || ""}
                                  onChange={(e) =>
                                    updateRow(i, "packetAmt", e.target.value)
                                  }
                                />
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    width: 100,
                                    fontSize: 11,
                                  }}
                                  type="number"
                                  placeholder="0"
                                  value={row.sanctionAmt || ""}
                                  onChange={(e) =>
                                    updateRow(i, "sanctionAmt", e.target.value)
                                  }
                                />
                              </TD>
                              <TD s={{ padding: 2 }}>
                                <input
                                  style={{
                                    ...INP,
                                    padding: "4px 8px",
                                    minWidth: 160,
                                    fontSize: 11,
                                  }}
                                  placeholder="Ex: Retard"
                                  value={row.sanctionReason || ""}
                                  onChange={(e) =>
                                    updateRow(
                                      i,
                                      "sanctionReason",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        padding: "10px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: C.muted }}>TOTAL</span>
                      <div style={{ display: "flex", gap: 25 }}>
                        <span style={{ color: C.gold }} title="Bénéficiaire">
                          {fmt(totB)}
                        </span>
                        <span style={{ color: C.purple }} title="Présence">
                          {fmt(totP)}
                        </span>
                        <span style={{ color: C.green }} title="Réception">
                          {fmt(totR)}
                        </span>
                        <span style={{ color: C.accent }} title="Paquet">
                          {fmt(totQ)}
                        </span>
                        <span style={{ color: C.warn }} title="Sanctions">
                          {fmt(totS)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 15,
                  }}
                >
                  <Btn bg={C.muted} sm onClick={closeM}>
                    {isDraft ? "Annuler" : "Fermer"}
                  </Btn>
                  {!isDraft && (
                    <Btn bg={C.accent} sm onClick={doAddDailyCotis}>
                      ✓ Terminer
                    </Btn>
                  )}
                </div>
              </div>
            );
          })()}

        {/* ── Détail Membre ── */}
        {modal.type === "memberDetail" &&
          detailMb &&
          (() => {
            /* Données pour le rapport individuel */
            const detailSanctions = detailMbId
              ? sanctions.filter((s) => s.memberId === detailMbId)
              : [];
            /* Cotisations AUTO du membre : debit = contribution à un prêt, credit = retour d'un remboursement */
            const autoDebits = detailCotis.filter(
              (c) => c.auto && c.direction === "debit",
            );
            const autoCredits = detailCotis.filter(
              (c) => c.auto && c.direction === "credit",
            );

            /* Dates uniques : cotis manuelles + auto debits/credits + sanctions */
            const allDates = [
              ...new Set([
                ...detailCotis.filter((c) => !c.auto).map((c) => c.date),
                ...autoDebits.map((c) => c.date),
                ...autoCredits.map((c) => c.date),
                ...detailSanctions.map((s) => s.date),
              ]),
            ].sort((a, b) => new Date(a) - new Date(b));

            /* Calcul intérêts gagnés par le membre sur chaque crédit auto */
            const calcInteretGagne = (creditCot) => {
              const loan = loans.find((l) => l.id === creditCot.loanId);
              if (!loan) return 0;
              const contrib = (loan.contributions || []).find(
                (x) => x.memberId === detailMbId,
              );
              const origContrib = contrib?.montantContrib || 0;
              return Math.max(0, creditCot.montant - origContrib);
            };

            /* Totaux globaux rapport */
            const totEntreesCaisse = detailCotisC.reduce(
              (s, c) => s + c.montant,
              0,
            );
            const totEntreesRoulement = detailCotisR.reduce(
              (s, c) => s + c.montant,
              0,
            );
            const totSortiesPrets = autoDebits.reduce(
              (s, c) => s + c.montant,
              0,
            );
            const totRembours = autoCredits.reduce((s, c) => s + c.montant, 0);
            const totInterets = autoCredits.reduce(
              (s, c) => s + calcInteretGagne(c),
              0,
            );
            const totEntrees =
              totEntreesCaisse + totEntreesRoulement + totInterets;
            const totSanctions = detailSanctions.reduce(
              (s, x) => s + x.montant,
              0,
            );
            const totSorties = totSortiesPrets + totSanctions;

            return (
              <MemberDetailTabs
                detailMb={detailMb}
                detailCotis={detailCotis}
                detailCotisC={detailCotisC}
                detailCotisR={detailCotisR}
                detailLoans={detailLoans}
                detailSanctions={detailSanctions}
                autoDebits={autoDebits}
                autoCredits={autoCredits}
                calcInteretGagne={calcInteretGagne}
                allDates={allDates}
                totEntrees={totEntrees}
                totEntreesCaisse={totEntreesCaisse}
                totEntreesRoulement={totEntreesRoulement}
                totSortiesPrets={totSortiesPrets}
                totRembours={totRembours}
                totInterets={totInterets}
                totSanctions={totSanctions}
                totSorties={totSorties}
                enrichLabel={enrichLabel}
                openSub={openSub}
                closeAll={closeAll}
                prtMember={prtMember}
                doDeleteCotisation={doDeleteCotisation}
                doDeleteLoan={doDeleteLoan}
                members={members}
                loans={loans}
                C={C}
                fmt={fmt}
                Btn={Btn}
                Badge={Badge}
                TH={TH}
                TD={TD}
                SectionLabel={SectionLabel}
              />
            );
          })()}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MemberDetailTabs — onglets Historique + Rapport Individuel
═══════════════════════════════════════════════════════════════ */
const MemberDetailTabs = ({
  detailMb,
  detailCotis,
  detailCotisC,
  detailCotisR,
  detailLoans,
  detailSanctions,
  autoDebits,
  autoCredits,
  calcInteretGagne,
  allDates,
  totEntrees,
  totEntreesCaisse,
  totEntreesRoulement,
  totSortiesPrets,
  totRembours,
  totInterets,
  totSanctions,
  totSorties,
  enrichLabel,
  openSub,
  closeAll,
  prtMember,
  doDeleteCotisation,
  doDeleteLoan,
  members,
  loans,
  C,
  fmt,
  Btn,
  Badge,
  TH,
  TD,
  SectionLabel,
}) => {
  const [activeTab, setActiveTab] = useState("historique");

  const tabStyle = (key) => ({
    padding: "9px 20px",
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 12,
    borderBottom: `3px solid ${activeTab === key ? C.accent : "transparent"}`,
    background: "transparent",
    color: activeTab === key ? C.accent : C.muted,
    transition: "all .2s",
  });

  /* ── helpers description ── */
  const getLoan = (loanId) => loans.find((l) => l.id === loanId);
  const getEmpr = (loan) =>
    loan ? members.find((m) => m.id === loan.emprunteurId)?.name || "?" : "?";
  const getMbPct = (loan) => {
    const c = (loan?.contributions || []).find(
      (x) => x.memberId === detailMb.id,
    );
    return c ? (c.pct * 100).toFixed(1) + "%" : "—";
  };
  const getPeriod = (loan, date) => {
    if (!loan) return 1;
    return calcMontantActuel(loan, date).periods;
  };

  /* ── impression rapport individuel ── */
  const printRapport = () => {
    const cols = [
      "Date",
      "Fond de Caisse",
      "Fond de Roulement",
      "Sorties (Prêt)",
      "Entrées (Prêt)",
      "Gains (Prêt)",
      "Sanctions",
    ];
    const thead = `<tr>${cols.map((h) => `<th>${h}</th>`).join("")}</tr>`;
    const tbody = allDates
      .map((date) => {
        const caisseJ = detailCotisC
          .filter((c) => c.date === date)
          .reduce((s, c) => s + c.montant, 0);
        const roulemJ = detailCotisR
          .filter((c) => c.date === date)
          .reduce((s, c) => s + c.montant, 0);
        const debitsJ = autoDebits.filter((c) => c.date === date);
        const creditsJ = autoCredits.filter((c) => c.date === date);
        const sanctJ = detailSanctions.filter((s) => s.date === date);
        const fmtCell = (v) => (v > 0 ? fmt(v) : "—");
        const pretDescr =
          debitsJ
            .map((c) => {
              const l = getLoan(c.loanId);
              return `<small>${getEmpr(l)} — ${fmt(l?.montant || 0)} — ${getMbPct(l)}</small><br/><strong>${fmt(c.montant)}</strong>`;
            })
            .join("<br/>") || "—";
        const entDescr =
          creditsJ
            .map((c) => {
              const l = getLoan(c.loanId);
              return `<small>${getEmpr(l)} — ${fmt(l?.montantDu || 0)} — Pér. ${getPeriod(l, date)}</small><br/><strong>${fmt(c.montant)}</strong>`;
            })
            .join("<br/>") || "—";
        const gainDescr =
          creditsJ
            .map((c) => {
              const l = getLoan(c.loanId);
              const g = calcInteretGagne(c);
              return g > 0
                ? `<small>${getEmpr(l)} — Pér. ${getPeriod(l, date)}</small><br/><strong style="color:#f5a623">${fmt(g)}</strong>`
                : "";
            })
            .filter(Boolean)
            .join("<br/>") || "—";
        const sanctDescr =
          sanctJ
            .map(
              (s) =>
                `${fmt(s.montant)} <span class="${s.status === "payee" ? "ok" : "wa"}">${s.status === "payee" ? "Payée" : "En attente"}</span>`,
            )
            .join("<br/>") || "—";
        return `<tr><td>${date}</td><td>${fmtCell(caisseJ)}</td><td>${fmtCell(roulemJ)}</td><td>${pretDescr}</td><td>${entDescr}</td><td>${gainDescr}</td><td>${sanctDescr}</td></tr>`;
      })
      .join("");
    const totRow = `<tr style="font-weight:800;background:#f2f2f8"><td>Totaux</td><td>${fmt(totEntreesCaisse)}</td><td>${fmt(totEntreesRoulement)}</td><td>${fmt(totSortiesPrets)}</td><td>${fmt(totRembours)}</td><td>${fmt(totInterets)}</td><td>${fmt(totSanctions)}</td></tr>`;
    const summary = `<p style="margin-top:16px"><strong>Montant total des entrées du membre :</strong> ${fmt(totEntrees)}<br/>(Caisse : ${fmt(totEntreesCaisse)} · Roulement : ${fmt(totEntreesRoulement)} · Gains prêts : ${fmt(totInterets)})</p><p><strong>Total des sorties ou redevances du membre :</strong> ${fmt(totSorties)}<br/>(Contributions prêts : ${fmt(totSortiesPrets)} · Sanctions : ${fmt(totSanctions)})</p>`;
    doPrint(
      `Rapport Individuel — ${detailMb.name}`,
      `<h2>Rapport Individuel : ${detailMb.name}${detailMb.telephone ? ` — ${detailMb.telephone}` : ""}</h2>
       <table><thead>${thead}</thead><tbody>${tbody}${totRow}</tbody></table>${summary}`,
    );
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 3 }}>
            {detailMb.name}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            {detailMb.ville && (
              <span style={{ marginRight: 14 }}>📍 {detailMb.ville}</span>
            )}
            {detailMb.telephone && <span>📞 {detailMb.telephone}</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={detailMb.aJour ? C.green : C.danger}>
              {detailMb.aJour ? "✓ À jour" : "✗ Non à jour"}
            </Badge>
            <Badge color={detailMb.droitPret ? C.green : C.warn}>
              {detailMb.droitPret ? "✓ Droit prêt" : "⏸ Bloqué"}
            </Badge>
          </div>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <Btn
            bg={C.blue}
            sm
            onClick={() =>
              openSub("addCotisation", { memberId: `${detailMb.id}` })
            }
          >
            + Cotisation
          </Btn>
          <Btn
            bg={C.accent}
            sm
            onClick={() =>
              openSub("addLoan", { emprunteurId: `${detailMb.id}` })
            }
          >
            + Prêt
          </Btn>
          <Btn
            bg="rgba(255,255,255,0.07)"
            sm
            onClick={() => prtMember(detailMb)}
          >
            🖨️
          </Btn>
          <button
            onClick={closeAll}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              marginLeft: 4,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 10,
          padding: "14px 24px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {[
          {
            l: "Fonds Caisse",
            v: fmt(detailMb.fondsCaisse),
            c: detailMb.aJour ? C.green : C.warn,
          },
          { l: "Fonds Roulement", v: fmt(detailMb.fondsRoulement), c: C.blue },
          {
            l: "Part Prorata",
            v: detailMb.prorata.toFixed(2) + "%",
            c: C.gold,
          },
          {
            l: "Prêt actif",
            v: detailMb.loanActif ? fmt(detailMb.loanActif.montantDu) : "Aucun",
            c: detailMb.loanActif ? C.danger : C.muted,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: C.card2,
              borderRadius: 10,
              padding: "10px 12px",
              border: `1px solid ${s.c}33`,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: s.c,
                marginBottom: 3,
              }}
            >
              {s.v}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${C.border}`,
          paddingLeft: 24,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <button
          style={tabStyle("historique")}
          onClick={() => setActiveTab("historique")}
        >
          📋 Historique
        </button>
        <button
          style={tabStyle("rapport")}
          onClick={() => setActiveTab("rapport")}
        >
          📊 Rapport Individuel
        </button>
      </div>

      {/* ── ONGLET HISTORIQUE ── */}
      {activeTab === "historique" && (
        <div style={{ padding: "0 24px 24px" }}>
          <SectionLabel
            label={`💰 Cotisations — ${detailCotis.filter((c) => !c.auto).length} manuelles + ${detailCotis.filter((c) => c.auto).length} auto`}
          />
          {detailCotis.length === 0 ? (
            <div
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
                padding: "14px 0",
              }}
            >
              Aucune cotisation
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    background: `${C.blue}14`,
                    border: `1px solid ${C.blue}30`,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    🏦 Fonds de Caisse
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>
                    {fmt(detailCotisC.reduce((s, c) => s + c.montant, 0))}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {detailCotisC.length} versement
                    {detailCotisC.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div
                  style={{
                    background: `${C.green}14`,
                    border: `1px solid ${C.green}30`,
                    borderRadius: 10,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    🔄 Fonds de Roulement
                  </div>
                  <div
                    style={{ fontSize: 15, fontWeight: 800, color: C.green }}
                  >
                    {fmt(detailCotisR.reduce((s, c) => s + c.montant, 0))}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {detailCotisR.length} versement
                    {detailCotisR.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Date & Heure",
                      "Type / Opération",
                      "Montant",
                      "Actions",
                    ].map((h) => (
                      <TH key={h} ch={h} />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detailCotis.map((c) => {
                    const isD = c.direction === "debit",
                      isCr = c.direction === "credit" && c.auto;
                    const bColor = isD
                      ? C.warn
                      : isCr
                        ? C.green
                        : c.type === "caisse"
                          ? C.blue
                          : C.green;
                    const enriched = enrichLabel(c, detailMb.id);
                    const labelText =
                      enriched ||
                      (isD
                        ? `📤 ${c.label || "Contribution"}`
                        : isCr
                          ? `📥 ${c.label || "Retour"}`
                          : c.type === "caisse"
                            ? "🏦 Versement Caisse"
                            : "🔄 Versement Roulement");
                    return (
                      <tr key={c.id}>
                        <TD
                          s={{
                            fontSize: 11,
                            color: C.muted,
                            whiteSpace: "nowrap",
                            minWidth: 85,
                          }}
                        >
                          {c.date}
                          <div style={{ fontSize: 10 }}>{c.heure || "—"}</div>
                        </TD>
                        <TD>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 9px",
                              borderRadius: 12,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#fff",
                              background: bColor + "cc",
                              wordBreak: "break-word",
                              maxWidth: 360,
                            }}
                          >
                            {labelText}
                          </span>
                        </TD>
                        <TD>
                          <strong style={{ color: isD ? C.danger : C.gold }}>
                            {isD ? "−" : "+"} {fmt(c.montant)}
                          </strong>
                        </TD>
                        <TD>
                          {c.auto ? (
                            <span
                              style={{
                                fontSize: 10,
                                color: C.muted,
                                fontStyle: "italic",
                              }}
                            >
                              auto
                            </span>
                          ) : (
                            <div style={{ display: "flex", gap: 3 }}>
                              <Btn
                                bg={C.gold}
                                xs
                                onClick={() =>
                                  openSub("editCotisation", {
                                    cotisId: `${c.id}`,
                                    memberId: `${c.memberId}`,
                                    type: c.type,
                                    montant: `${c.montant}`,
                                    date: c.date,
                                  })
                                }
                              >
                                ✏️
                              </Btn>
                              <Btn
                                bg={C.danger}
                                xs
                                onClick={() => doDeleteCotisation(c.id)}
                              >
                                🗑️
                              </Btn>
                            </div>
                          )}
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <SectionLabel label={`💳 Prêts — ${detailLoans.length} au total`} />
          {detailLoans.length === 0 ? (
            <div
              style={{
                color: C.muted,
                fontSize: 13,
                textAlign: "center",
                padding: "14px 0",
              }}
            >
              Aucun prêt
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Date",
                    "Montant",
                    "Intérêts",
                    "Total Dû",
                    "Échéance",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <TH key={h} ch={h} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailLoans.map((l) => {
                  const d = Math.ceil(
                    (new Date(l.echeance) - new Date()) / 864e5,
                  );
                  return (
                    <tr key={l.id}>
                      <TD s={{ fontSize: 11, color: C.muted }}>{l.date}</TD>
                      <TD>{fmt(l.montant)}</TD>
                      <TD s={{ color: C.gold }}>{fmt(l.interets)}</TD>
                      <TD>
                        <strong style={{ color: C.accent }}>
                          {fmt(l.montantDu)}
                        </strong>
                      </TD>
                      <TD>
                        <div style={{ fontSize: 11 }}>{l.echeance}</div>
                        {l.status === "actif" && (
                          <div
                            style={{
                              fontSize: 10,
                              color:
                                d <= 0 ? C.danger : d <= 30 ? C.warn : C.muted,
                            }}
                          >
                            {d <= 0 ? `🚨 ${Math.abs(d)}j` : `${d}j restants`}
                          </div>
                        )}
                      </TD>
                      <TD>
                        <Badge color={l.status === "actif" ? C.warn : C.green}>
                          {l.status === "actif" ? "En cours" : "Remboursé"}
                        </Badge>
                      </TD>
                      <TD>
                        <div style={{ display: "flex", gap: 3 }}>
                          {l.status === "actif" && (
                            <Btn
                              bg={C.green}
                              xs
                              onClick={() =>
                                openSub("repayLoan", { loanId: `${l.id}` })
                              }
                            >
                              ✓ Payer
                            </Btn>
                          )}
                          <Btn
                            bg={C.gold}
                            xs
                            onClick={() =>
                              openSub("editLoan", {
                                loanId: `${l.id}`,
                                montant: `${l.montant}`,
                                date: l.date,
                                assistantId: `${l.assistantId || ""}`,
                                emprunteurId: `${l.emprunteurId}`,
                              })
                            }
                          >
                            ✏️
                          </Btn>
                          <Btn
                            bg={C.danger}
                            xs
                            onClick={() => doDeleteLoan(l.id)}
                          >
                            🗑️
                          </Btn>
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ONGLET RAPPORT INDIVIDUEL ── */}
      {activeTab === "rapport" && (
        <div style={{ padding: "16px 24px 28px" }}>
          {/* Barre titre + bouton imprimer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>
              {detailMb.name}
              {detailMb.telephone ? ` : ${detailMb.telephone}` : ""}
            </div>
            <Btn bg="rgba(255,255,255,0.07)" sm onClick={printRapport}>
              🖨️ Imprimer le rapport
            </Btn>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 700,
              }}
            >
              <thead>
                <tr>
                  {[
                    "Date",
                    "Fond de Caisse",
                    "Fond de Roulement",
                    "Sorties (Prêt)",
                    "Entrées (Prêt)",
                    "Gains (Prêt)",
                    "Sanctions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 10px",
                        background: "rgba(255,255,255,0.05)",
                        color: C.muted,
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom: `2px solid ${C.border}`,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allDates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        color: C.muted,
                        textAlign: "center",
                        padding: "20px",
                        fontStyle: "italic",
                      }}
                    >
                      Aucune opération enregistrée
                    </td>
                  </tr>
                ) : (
                  allDates.map((date, idx) => {
                    /* Cotisations manuelles du jour */
                    const caisseJour = detailCotisC.filter(
                      (c) => c.date === date,
                    );
                    const roulemtJour = detailCotisR.filter(
                      (c) => c.date === date,
                    );
                    /* Contribution du membre à des prêts ce jour (auto debit) */
                    const debitsJour = autoDebits.filter(
                      (c) => c.date === date,
                    );
                    /* Retours reçus par le membre ce jour (auto credit) */
                    const creditsJour = autoCredits.filter(
                      (c) => c.date === date,
                    );
                    /* Sanctions ce jour */
                    const sanctJour = detailSanctions.filter(
                      (s) => s.date === date,
                    );

                    const sCaisse = caisseJour.reduce(
                      (s, c) => s + c.montant,
                      0,
                    );
                    const sRoulem = roulemtJour.reduce(
                      (s, c) => s + c.montant,
                      0,
                    );
                    /* Sortie = montant de roulement du membre prélevé pour financer un prêt */
                    const sPrets = debitsJour.reduce(
                      (s, c) => s + c.montant,
                      0,
                    );
                    /* Remboursement reçu = capital + intérêts gagnés retournés au membre */
                    const sRembou = creditsJour.reduce(
                      (s, c) => s + c.montant,
                      0,
                    );
                    /* Intérêts gagnés = part d'intérêts uniquement (retour − contribution initiale) */
                    const sInter = creditsJour.reduce(
                      (s, c) => s + calcInteretGagne(c),
                      0,
                    );
                    const sSanct = sanctJour.reduce((s, x) => s + x.montant, 0);

                    const rowBg =
                      idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)";
                    const tdBase = {
                      padding: "9px 10px",
                      borderBottom: `1px solid ${C.border}`,
                      textAlign: "center",
                      background: rowBg,
                      verticalAlign: "top",
                    };
                    const cell = (val, color = C.text) => (
                      <td
                        style={{
                          ...tdBase,
                          color: val > 0 ? color : C.muted,
                          fontWeight: val > 0 ? 700 : 400,
                        }}
                      >
                        {val > 0 ? fmt(val) : "—"}
                      </td>
                    );

                    return (
                      <tr key={date}>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.border}`,
                            background: rowBg,
                            fontSize: 11,
                            color: C.muted,
                            whiteSpace: "nowrap",
                            verticalAlign: "top",
                          }}
                        >
                          {date}
                        </td>
                        {cell(sCaisse, C.blue)}
                        {cell(sRoulem, C.green)}

                        {/* ── Sorties (Prêt) : contribution du membre à un prêt ── */}
                        <td style={tdBase}>
                          {debitsJour.length === 0 ? (
                            <span style={{ color: C.muted }}>—</span>
                          ) : (
                            debitsJour.map((c) => {
                              const loan = getLoan(c.loanId);
                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    marginBottom: debitsJour.length > 1 ? 6 : 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: C.muted,
                                      marginBottom: 2,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {getEmpr(loan)} — {fmt(loan?.montant || 0)}{" "}
                                    — {getMbPct(loan)}
                                  </div>
                                  <strong style={{ color: C.danger }}>
                                    {fmt(c.montant)}
                                  </strong>
                                </div>
                              );
                            })
                          )}
                        </td>

                        {/* ── Entrées (Prêt) : retour reçu lors d'un remboursement ── */}
                        <td style={tdBase}>
                          {creditsJour.length === 0 ? (
                            <span style={{ color: C.muted }}>—</span>
                          ) : (
                            creditsJour.map((c) => {
                              const loan = getLoan(c.loanId);
                              const per = getPeriod(loan, date);
                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    marginBottom:
                                      creditsJour.length > 1 ? 6 : 0,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: C.muted,
                                      marginBottom: 2,
                                      lineHeight: 1.4,
                                    }}
                                  >
                                    {getEmpr(loan)} —{" "}
                                    {fmt(loan?.montantDu || 0)} — Pér. {per}
                                  </div>
                                  <strong style={{ color: C.accent }}>
                                    {fmt(c.montant)}
                                  </strong>
                                </div>
                              );
                            })
                          )}
                        </td>

                        {/* ── Gains (Prêt) : part d'intérêts uniquement ── */}
                        <td style={tdBase}>
                          {creditsJour.length === 0 ? (
                            <span style={{ color: C.muted }}>—</span>
                          ) : (
                            (() => {
                              const items = creditsJour
                                .map((c) => ({
                                  c,
                                  g: calcInteretGagne(c),
                                  loan: getLoan(c.loanId),
                                }))
                                .filter((x) => x.g > 0);
                              return items.length === 0 ? (
                                <span style={{ color: C.muted }}>—</span>
                              ) : (
                                items.map(({ c, g, loan }) => {
                                  const per = getPeriod(loan, date);
                                  return (
                                    <div
                                      key={c.id}
                                      style={{
                                        marginBottom: items.length > 1 ? 6 : 0,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 9,
                                          color: C.muted,
                                          marginBottom: 2,
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {getEmpr(loan)} — Pér. {per}
                                      </div>
                                      <strong style={{ color: C.gold }}>
                                        {fmt(g)}
                                      </strong>
                                    </div>
                                  );
                                })
                              );
                            })()
                          )}
                        </td>
                        <td
                          style={{
                            padding: "9px 10px",
                            borderBottom: `1px solid ${C.border}`,
                            textAlign: "center",
                            background: rowBg,
                          }}
                        >
                          {sanctJour.length === 0 ? (
                            <span style={{ color: C.muted }}>—</span>
                          ) : (
                            sanctJour.map((s) => (
                              <div key={s.id} style={{ marginBottom: 2 }}>
                                <span
                                  style={{
                                    color:
                                      s.status === "payee" ? C.green : C.warn,
                                    fontWeight: 700,
                                    fontSize: 11,
                                  }}
                                >
                                  {fmt(s.montant)}
                                </span>
                                <span style={{ marginLeft: 5 }}>
                                  <Badge
                                    color={
                                      s.status === "payee" ? C.green : C.warn
                                    }
                                  >
                                    {s.status === "payee"
                                      ? "✓ Payée"
                                      : "⏳ En attente"}
                                  </Badge>
                                </span>
                              </div>
                            ))
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {/* Ligne Totaux */}
              <tfoot>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  <td
                    style={{
                      padding: "10px",
                      fontWeight: 800,
                      fontSize: 12,
                      color: C.text,
                      borderTop: `2px solid ${C.border}`,
                    }}
                  >
                    Totaux
                  </td>
                  {[
                    { v: totEntreesCaisse, c: C.blue },
                    { v: totEntreesRoulement, c: C.green },
                    { v: totSortiesPrets, c: C.danger },
                    { v: totRembours, c: C.accent },
                    { v: totInterets, c: C.gold },
                    { v: totSanctions, c: C.warn },
                  ].map(({ v, c }, i) => (
                    <td
                      key={i}
                      style={{
                        padding: "10px",
                        fontWeight: 800,
                        fontSize: 12,
                        color: v > 0 ? c : C.muted,
                        borderTop: `2px solid ${C.border}`,
                        textAlign: "center",
                      }}
                    >
                      {v > 0 ? fmt(v) : "—"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Résumé entrées/sorties */}
          <div
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: `${C.green}12`,
                border: `1px solid ${C.green}30`,
                borderRadius: 10,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 6,
                }}
              >
                📥 Montant total des entrées du membre
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.green }}>
                {fmt(totEntrees)}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Caisse : {fmt(totEntreesCaisse)} · Roulement :{" "}
                {fmt(totEntreesRoulement)} · Gains prêts : {fmt(totInterets)}
              </div>
            </div>
            <div
              style={{
                background: `${C.danger}12`,
                border: `1px solid ${C.danger}30`,
                borderRadius: 10,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 6,
                }}
              >
                📤 Total des sorties ou redevances du membre
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.danger }}>
                {fmt(totSorties)}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Contributions prêts : {fmt(totSortiesPrets)} · Sanctions :{" "}
                {fmt(totSanctions)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
