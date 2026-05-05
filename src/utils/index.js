export const fmt    = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0)) + " FCFA";
export const tod    = () => new Date().toISOString().split("T")[0];
export const nowLbl = () => {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
export const fmtDate = (d) => {
  if (!d) return "—";
  if (d.includes("-") && d.split("-")[0].length === 4) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  return d;
};
export const add3M  = (d) => { const x = new Date(d); x.setMonth(x.getMonth()+3); return x.toISOString().split("T")[0]; };
export const dLeft  = (d) => Math.ceil((new Date(d) - new Date()) / 864e5);
export const uid    = () => Date.now() + Math.floor(Math.random()*9999);
export const SEUIL  = 40000;

export const calcMontantActuel = (loan, dateStr) => {
  const start   = new Date(loan.date);
  const end     = new Date(dateStr || tod());
  const days    = Math.max(0, Math.round((end - start) / 864e5));
  const periods = Math.floor(days / 90) + 1;
  const montantDu  = loan.montant * Math.pow(1.1, periods);
  const interets   = montantDu - loan.montant;
  const fraisAsso  = interets * 0.2;
  const gainMbr    = interets * 0.8;
  return { montantDu, interets, fraisAsso, gainMbr, periods };
};

export const sha1 = (str) => {
  function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const cc = str.charCodeAt(i);
    if (cc < 128) bytes.push(cc);
    else if (cc < 2048) bytes.push(192|(cc>>6), 128|(cc&63));
    else bytes.push(224|(cc>>12), 128|((cc>>6)&63), 128|(cc&63));
  }
  const L = bytes.length;
  const words = new Array(((L + 8 >> 6) + 1) * 16).fill(0);
  for (let i = 0; i < L; i++) words[i>>2] |= bytes[i] << (24 - (i%4)*8);
  words[L>>2] |= 0x80 << (24 - (L%4)*8);
  words[words.length - 2] = 0;
  words[words.length - 1] = L * 8;
  let [H0,H1,H2,H3,H4] = [0x67452301,0xEFCDAB89,0x98BADCFE,0x10325476,0xC3D2E1F0];
  for (let b = 0; b < words.length; b += 16) {
    const W = words.slice(b, b+16);
    for (let i = 16; i < 80; i++) W[i] = rl(W[i-3]^W[i-8]^W[i-14]^W[i-16], 1);
    let [a,e,c,d,ee] = [H0,H1,H2,H3,H4];
    for (let i = 0; i < 80; i++) {
      let f, k;
      if      (i < 20) { f = (e&c)|(~e&d);         k = 0x5A827999; }
      else if (i < 40) { f = e^c^d;                 k = 0x6ED9EBA1; }
      else if (i < 60) { f = (e&c)|(e&d)|(c&d);    k = 0x8F1BBCDC; }
      else             { f = e^c^d;                 k = 0xCA62C1D6; }
      const tmp = (rl(a,5) + (f>>>0) + ee + k + W[i]) >>> 0;
      ee = d; d = c; c = rl(e,30); e = a; a = tmp;
    }
    H0=(H0+a)>>>0; H1=(H1+e)>>>0; H2=(H2+c)>>>0; H3=(H3+d)>>>0; H4=(H4+ee)>>>0;
  }
  return [H0,H1,H2,H3,H4].map(n => n.toString(16).padStart(8,"0")).join("");
};

export const C = {
  bg:"#080918", card:"#0f1024", card2:"#151630",
  accent:"#e94560", gold:"#f5a623", green:"#27ae60",
  blue:"#2980b9", danger:"#c0392b", warn:"#e67e22",
  purple:"#8e44ad", teal:"#16a085",
  muted:"#5a6478", text:"#dde3f0", border:"rgba(255,255,255,0.08)",
};

export const INP = { background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 14px", color:C.text, fontSize:13, width:"100%", outline:"none", boxSizing:"border-box" };
export const LBL = { fontSize:11, color:C.muted, display:"block", marginBottom:5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.6 };
export const FR  = { marginBottom:15 };

export const doPrint = (title, body) => {
  const w = window.open("", "_blank");
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

export const SK = {
  members:"afay:members", loans:"afay:loans", assist:"afay:assist",
  history:"afay:history", fondsAsso:"afay:fondsAsso",
  cotisations:"afay:cotisations", dismissed:"afay:dismissed",
  sanctions:"afay:sanctions", sorties:"afay:sorties",
  authCreds:"afay:authCreds",
  sessions:"afay:sessions", dailyContributions:"afay:dailyContributions",
};

export const DEFAULT_USER = "afay-username";
export const DEFAULT_PASS_HASH = sha1("afay-password");
