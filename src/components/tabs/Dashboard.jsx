import React from "react";
import { useApp } from "../../context/AppContext";
import { Card, SHdr, Btn, TH, TD, Badge } from "../ui";
import { C, fmt, dLeft, tod, calcMontantActuel, doPrint } from "../../utils";

export const Dashboard = () => {
  const {
    totFC,
    totFR,
    totDette,
    fondsAsso,
    totGains,
    actLoans,
    members,
    editFA,
    editFAV,
    setEditFAV,
    setFondsAsso,
    setEditFA,
    pushH,
    openM,
    sanctions,
    membersX,
  } = useApp();

  const prtDash = () =>
    doPrint(
      "Tableau de Bord",
      `<div class="sg"><div class="sb"><div class="sv">${fmt(totFC)}</div><div class="sl">Fonds Caisse</div></div><div class="sb"><div class="sv">${fmt(totFR)}</div><div class="sl">Fonds Roulement</div></div><div class="sb"><div class="sv">${fmt(totDette)}</div><div class="sl">Prêts actifs</div></div><div class="sb"><div class="sv">${fmt(fondsAsso)}</div><div class="sl">Fonds Association</div></div></div><h2>Membres</h2><table><thead><tr><th>Membre</th><th>Ville</th><th>Fonds Caisse</th><th>Fonds Roulement</th><th>Part%</th><th>Statut</th></tr></thead><tbody>${membersX.map((m) => `<tr><td>${m.name}</td><td>${m.ville || "—"}</td><td>${fmt(m.fondsCaisse)}</td><td>${fmt(m.fondsRoulement)}</td><td>${m.prorata.toFixed(2)}%</td><td>${m.aJour ? '<span class="ok">À jour</span>' : '<span class="ko">Non à jour</span>'}</td></tr>`).join("")}</tbody></table>`,
    );

  return (
    <div>
      <SHdr title="📊 Tableau de Bord" printFn={prtDash} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          {
            icon: "🏦",
            label: "Fonds de Caisse",
            val: fmt(totFC),
            color: C.blue,
            desc: "Épargne totale des membres",
          },
          {
            icon: "🔄",
            label: "Fonds de Roulement",
            val: fmt(totFR),
            color: C.green,
            desc: "Capital disponible pour prêts",
          },
          {
            icon: "📉",
            label: "Dette en Cours",
            val: fmt(totDette),
            color: C.danger,
            desc: "Capital + intérêts à percevoir",
          },
          {
            icon: "📈",
            label: "Gains",
            val: fmt(totGains),
            color: C.gold,
            desc: "Total intérêts déjà encaissés",
          },
          {
            icon: "🏛️",
            label: "Fonds Association",
            val: fmt(fondsAsso),
            color: C.purple,
            desc: "Commissions + Sanctions payées",
          },
        ].map((st, i) => (
          <div
            key={i}
            style={{
              background: C.card,
              borderRadius: 14,
              padding: "16px 18px",
              border: `1px solid ${st.color}33`,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 6 }}>{st.icon}</div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: st.color,
                marginBottom: 3,
              }}
            >
              {st.val}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {st.label}
            </div>
            <div
              style={{
                fontSize: 9,
                color: st.color,
                opacity: 0.7,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              {st.desc}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 10,
              borderLeft: `3px solid ${C.purple}`,
              paddingLeft: 10,
            }}
          >
            🏛️ Fonds de l'Association
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: C.purple,
              marginBottom: 6,
            }}
          >
            {fmt(fondsAsso)}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
            Calculé en direct : (Commissions sur prêts + Sanctions payées) -
            Sorties (source: Association).
          </div>
          <div style={{ fontSize: 10, color: C.accent, fontStyle: "italic" }}>
            ✓ Garanti conforme aux transactions
          </div>
        </Card>
        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 10,
              borderLeft: `3px solid ${C.accent}`,
              paddingLeft: 10,
            }}
          >
            💳 Prêts Actifs ({actLoans.length})
          </div>
          {actLoans.length === 0 ? (
            <div
              style={{
                color: C.muted,
                textAlign: "center",
                padding: "18px 0",
                fontSize: 13,
              }}
            >
              ✓ Aucun prêt actif
            </div>
          ) : (
            actLoans.slice(0, 4).map((l) => {
              const m = members.find((x) => x.id === l.emprunteurId),
                d = dLeft(l.echeance);
              const actual = calcMontantActuel(l, tod());
              return (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {m?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: d <= 0 ? C.danger : d <= 30 ? C.warn : C.muted,
                      }}
                    >
                      {d <= 0 ? `🚨 ${Math.abs(d)}j retard` : `${d}j restants`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: d <= 0 ? C.danger : C.accent,
                        fontSize: 12,
                      }}
                    >
                      {fmt(actual.montantDu)}
                    </div>
                    {d <= 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: C.muted,
                          textDecoration: "line-through",
                        }}
                      >
                        {fmt(l.montantDu)}
                      </div>
                    )}
                    <Btn
                      bg={C.green}
                      sm
                      style={{ marginTop: 3 }}
                      onClick={() => openM("repayLoan", { loanId: `${l.id}` })}
                    >
                      ✓ Payer
                    </Btn>
                  </div>
                </div>
              );
            })
          )}
        </Card>
        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 10,
              borderLeft: `3px solid ${C.warn}`,
              paddingLeft: 10,
            }}
          >
            ⚠️ Sanctions (
            {sanctions.filter((s) => s.status === "en_attente").length} en
            attente)
          </div>
          {sanctions.filter((s) => s.status === "en_attente").length === 0 ? (
            <div
              style={{
                color: C.muted,
                textAlign: "center",
                padding: "18px 0",
                fontSize: 13,
              }}
            >
              ✓ Aucune sanction en attente
            </div>
          ) : (
            sanctions
              .filter((s) => s.status === "en_attente")
              .slice(0, 4)
              .map((s) => {
                const m = members.find((x) => x.id === s.memberId);
                return (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {m?.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted }}>
                        {s.raison}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{ fontWeight: 700, color: C.warn, fontSize: 12 }}
                      >
                        {fmt(s.montant)}
                      </div>
                      <Btn
                        bg={C.green}
                        sm
                        style={{ marginTop: 3 }}
                        onClick={() => doPaySanction(s.id)}
                      >
                        ✓ Payer
                      </Btn>
                    </div>
                  </div>
                );
              })
          )}
        </Card>
      </div>
      {members.length > 0 && (
        <Card>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 12,
              borderLeft: `3px solid ${C.blue}`,
              paddingLeft: 10,
            }}
          >
            📊 Prorata Fonds de Roulement
          </div>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr>
                {[
                  "Membre",
                  "Ville",
                  "Fonds Roulement",
                  "Part %",
                  "Statut Caisse",
                  "Droit Prêt",
                ].map((h) => (
                  <TH key={h} ch={h} />
                ))}
              </tr>
            </thead>
            <tbody>
              {membersX.map((m) => (
                <tr key={m.id}>
                  <TD>
                    <strong>{m.name}</strong>
                  </TD>
                  <TD s={{ color: C.muted, fontSize: 12 }}>{m.ville || "—"}</TD>
                  <TD>{fmt(m.fondsRoulement)}</TD>
                  <TD>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: "rgba(255,255,255,0.07)",
                          borderRadius: 3,
                        }}
                      >
                        <div
                          style={{
                            width: `${m.prorata}%`,
                            height: "100%",
                            background: `linear-gradient(90deg,${C.blue},${C.accent})`,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: C.gold,
                          minWidth: 44,
                          textAlign: "right",
                        }}
                      >
                        {m.prorata.toFixed(1)}%
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <Badge color={m.aJour ? C.green : C.danger}>
                      {m.aJour ? "✓ À jour" : "✗ Non à jour"}
                    </Badge>
                  </TD>
                  <TD>
                    <Badge color={m.droitPret ? C.green : C.warn}>
                      {m.droitPret ? "✓ Dispo" : "⏸ Bloqué"}
                    </Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
