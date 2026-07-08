import React, { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { Card, Btn, SHdr } from "../ui";
import { C, INP, LBL, FR } from "../../utils";

export const Notes = () => {
  const { notes, members, doAddNote, doEditNote, doDeleteNote } = useApp();

  // State for form
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterMemberId, setFilterMemberId] = useState("tous");

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || 
                          n.content.toLowerCase().includes(search.toLowerCase());
      const matchMember = filterMemberId === "tous" || n.memberIds.some(id => `${id}` === `${filterMemberId}`);
      return matchSearch && matchMember;
    });
  }, [notes, search, filterMemberId]);

  const handleOpenAdd = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
    setSelectedMemberIds([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (n) => {
    setEditingNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setSelectedMemberIds(n.memberIds || []);
    setIsFormOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return alert("Le titre est requis.");

    if (editingNoteId) {
      doEditNote(editingNoteId, title, content, selectedMemberIds);
    } else {
      doAddNote(title, content, selectedMemberIds);
    }
    setIsFormOpen(false);
    setTitle("");
    setContent("");
    setSelectedMemberIds([]);
    setEditingNoteId(null);
  };

  const toggleMemberTag = (memberId) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <div>
      <SHdr title="📝 Notes & Comptes Rendus" onAdd={handleOpenAdd} addLabel="+ Ajouter une note" />

      {/* Formulaire Note */}
      {isFormOpen && (
        <Card style={{ marginBottom: 20, border: `1px solid ${C.accent}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 15, color: C.gold }}>
            {editingNoteId ? "✏️ Modifier la note" : "📝 Nouvelle note"}
          </div>
          <form onSubmit={handleSave}>
            <div style={FR}>
              <label style={LBL}>Titre de la note</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ex: Suivi du remboursement de Yannick..." 
                style={INP} 
                required 
              />
            </div>
            
            <div style={FR}>
              <label style={LBL}>Contenu / Détail</label>
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Entrez vos remarques, rapports de session, ou notes ici..." 
                style={{ ...INP, minHeight: 120, resize: "vertical", fontFamily: "inherit" }} 
              />
            </div>

            <div style={FR}>
              <label style={LBL}>Membres concernés (taguez-les)</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxHeight: 110, overflowY: "auto", padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8, border: `1px solid ${C.border}` }}>
                {members.map(m => {
                  const selected = selectedMemberIds.includes(m.id);
                  return (
                    <span 
                      key={m.id} 
                      onClick={() => toggleMemberTag(m.id)}
                      style={{ 
                        padding: "4px 10px", 
                        borderRadius: 14, 
                        fontSize: 11, 
                        fontWeight: 600, 
                        cursor: "pointer",
                        background: selected ? C.accent : "rgba(255,255,255,0.05)",
                        color: selected ? "#fff" : C.muted,
                        border: `1px solid ${selected ? C.accent : C.border}`,
                        userSelect: "none"
                      }}
                    >
                      {m.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <Btn type="button" bg={C.muted} onClick={() => setIsFormOpen(false)}>Annuler</Btn>
              <Btn type="submit" bg={C.green}>Enregistrer</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Barre de Filtres */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input 
          type="text" 
          placeholder="🔍 Rechercher dans les notes..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ ...INP, flex: 1, minWidth: 200 }} 
        />
        <select 
          value={filterMemberId} 
          onChange={e => setFilterMemberId(e.target.value)} 
          style={{ ...INP, width: "auto", minWidth: 180 }}
        >
          <option value="tous">👥 Tous les membres</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Liste des Notes */}
      {filteredNotes.length === 0 ? (
        <Card><div style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>Aucune note trouvée.</div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filteredNotes.map(n => (
            <Card key={n.id} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.gold }}>{n.title}</div>
                  <span style={{ fontSize: 10, color: C.muted }}>{n.date} {n.heure}</span>
                </div>
                
                <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-line", marginBottom: 16, lineHeight: "1.4" }}>
                  {n.content}
                </div>
              </div>

              <div>
                {/* Membres tagués */}
                {n.memberIds && n.memberIds.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                    {n.memberIds.map(id => {
                      const m = members.find(x => x.id === id);
                      return m ? (
                        <span key={id} style={{ background: `${C.blue}22`, border: `1px solid ${C.blue}`, color: C.blue, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                          @{m.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Boutons d'actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <Btn xs bg={C.blue} onClick={() => handleOpenEdit(n)}>Modifier</Btn>
                  <Btn xs bg={C.danger} onClick={() => doDeleteNote(n.id)}>Supprimer</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
