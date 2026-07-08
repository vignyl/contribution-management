import React from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Header } from "./components/Header";
import { Alerts } from "./components/Alerts";
import { Modals } from "./components/Modals";
import { ImportModal } from "./components/ImportModal";
import { Loading } from "./components/screens/Loading";
import { Login } from "./components/screens/Login";

// Tab Components
import { Dashboard } from "./components/tabs/Dashboard";
import { Membres } from "./components/tabs/Membres";
import { Prets } from "./components/tabs/Prets";
import { Cotisations } from "./components/tabs/Cotisations";
import { Sanctions } from "./components/tabs/Sanctions";
import { Sorties } from "./components/tabs/Sorties";
import { Historique } from "./components/tabs/Historique";
import { Notes } from "./components/tabs/Notes";

import { C } from "./utils";

const AppContent = () => {
  const { ready, authed, tab } = useApp();

  if (!ready) return <Loading />;
  if (!authed) return <Login />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        fontFamily: "'Segoe UI',system-ui,sans-serif",
      }}
    >
      <style>{`
        select option{background:#0f1024;color:#dde3f0} 
        input[type=date]::-webkit-calendar-picker-indicator{filter:invert(0.7);cursor:pointer} 
        tr:hover td{background:rgba(255,255,255,0.018)} 
        ::-webkit-scrollbar{width:6px;height:6px} 
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.13);border-radius:3px}
      `}</style>

      <Header />

      <div style={{ padding: "20px 24px" }}>
        <Alerts />

        {tab === "dashboard" && <Dashboard />}
        {tab === "membres" && <Membres />}
        {tab === "prets" && <Prets />}
        {tab === "cotisations" && <Cotisations />}
        {tab === "sanctions" && <Sanctions />}
        {tab === "sorties" && <Sorties />}
        {tab === "historique" && <Historique />}
        {tab === "notes" && <Notes />}
      </div>

      <Modals />
      <ImportModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
