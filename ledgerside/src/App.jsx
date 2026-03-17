import { useState, useRef, useCallback, useEffect, useReducer } from "react";

const BUSINESSES = [
  { id: "airbnb", name: "Airbnb", icon: "🏠", color: "#FF5A5F" },
  { id: "younghorizon", name: "YoungHorizon Chess", icon: "♟️", color: "#4A90D9" },
];

const CATEGORIES = {
  airbnb: ["Cleaning", "Supplies", "Maintenance", "Utilities", "Mortgage/Rent", "Insurance", "Furnishings", "Marketing", "Platform Fees", "Other"],
  younghorizon: ["Equipment", "Venue", "Coaching", "Marketing", "Software", "Travel", "Prizes/Awards", "Admin", "Platform Fees", "Other"],
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const GST_RATE = 0.05;

const fmt = (n) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
const generateId = () => Math.random().toString(36).slice(2, 10);
const calcGST = (amount) => Math.round(parseFloat(amount || 0) * GST_RATE * 100) / 100;

// ── DB helpers ────────────────────────────────────────────────────────────────
async function dbGetExpenses(business, year) {
  const res = await fetch(`/api/expenses-get?business=${business}&year=${year}`);
  if (!res.ok) throw new Error("Failed to load expenses");
  const { expenses } = await res.json();
  return expenses;
}

async function dbSaveExpense(expense) {
  const res = await fetch("/api/expenses-save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error("Failed to save expense");
}

async function dbDeleteExpense(id) {
  const res = await fetch("/api/expenses-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete expense");
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0E0F0F; --surface: #161717; --surface2: #1E1F1F;
    --border: #2A2B2B; --amber: #E8A94B; --amber2: #C8872A;
    --text: #E8E3DC; --muted: #6B6660; --green: #5BB88A; --red: #E8645A;
    --teal: #4ECDC4;
  }
  html, body { background: var(--bg); color: var(--text); font-family: 'Instrument Sans', sans-serif; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 100; gap: 10px; }
  .logo { font-family: 'DM Serif Display', serif; font-size: 19px; color: var(--amber); white-space: nowrap; }
  .logo span { color: var(--muted); font-style: italic; font-size: 13px; margin-left: 8px; }
  .header-pills { display: flex; gap: 8px; flex-shrink: 0; }
  .pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--muted); white-space: nowrap; }
  .pill strong { font-family: 'DM Mono', monospace; }
  .pill.gst strong { color: var(--teal); }
  .pill.total strong { color: var(--amber); }

  .biz-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 20px; display: flex; gap: 2px; overflow-x: auto; }
  .biz-tab { padding: 13px 18px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
  .biz-tab:hover { color: var(--text); }
  .biz-tab.active { color: var(--text); border-bottom-color: var(--amber); }

  .main { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 103px); }
  @media (max-width: 700px) { .main { grid-template-columns: 1fr; } .sidebar { display: none; } }

  .sidebar { background: var(--surface); border-right: 1px solid var(--border); padding: 18px; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
  .sidebar-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 8px; }
  .month-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .month-btn { padding: 7px 2px; font-size: 11px; text-align: center; cursor: pointer; border-radius: 4px; color: var(--muted); transition: all 0.15s; }
  .month-btn:hover { background: var(--surface2); color: var(--text); }
  .month-btn.active { background: var(--amber); color: #0E0F0F; font-weight: 600; }
  .month-btn.has-data { color: var(--text); }
  .year-select { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; outline: none; }

  .stat-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .stat-label { font-size: 11px; color: var(--muted); margin-bottom: 3px; }
  .stat-value { font-family: 'DM Mono', monospace; font-size: 19px; color: var(--amber); margin-bottom: 2px; }
  .stat-value.teal { color: var(--teal); font-size: 16px; }
  .stat-divider { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
  .stat-sub { font-size: 11px; color: var(--muted); }

  .cat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 5px; cursor: pointer; transition: background 0.15s; }
  .cat-row:hover, .cat-row.active { background: var(--surface2); }
  .cat-row-name { font-size: 12px; color: var(--muted); }
  .cat-row.active .cat-row-name { color: var(--text); }
  .cat-bar-wrap { height: 2px; background: var(--border); border-radius: 2px; margin-top: 3px; }
  .cat-bar { height: 2px; background: var(--amber); border-radius: 2px; }
  .cat-amount { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text); }

  .content { padding: 20px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
  .content-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .content-title { font-family: 'DM Serif Display', serif; font-size: 24px; }
  .content-title span { color: var(--muted); font-style: italic; font-size: 16px; }
  .header-actions { display: flex; gap: 8px; align-items: center; }
  .btn { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; font-family: inherit; }
  .btn-primary { background: var(--amber); color: #0E0F0F; }
  .btn-primary:hover { background: var(--amber2); }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-ghost:hover { color: var(--text); border-color: var(--muted); }

  .gst-banner { background: rgba(78,205,196,0.05); border: 1px solid rgba(78,205,196,0.18); border-radius: 8px; padding: 14px 18px; display: flex; gap: 24px; flex-wrap: wrap; }
  .gst-b-item { display: flex; flex-direction: column; gap: 2px; }
  .gst-b-label { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--teal); opacity: 0.75; }
  .gst-b-val { font-family: 'DM Mono', monospace; font-size: 17px; color: var(--teal); font-weight: 500; }
  .gst-b-sub { font-size: 10px; color: var(--muted); }

  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; border: 1px solid var(--border); color: var(--muted); background: transparent; font-family: inherit; transition: all 0.15s; }
  .chip:hover { color: var(--text); }
  .chip.active { color: var(--amber); border-color: var(--amber); background: rgba(232,169,75,0.08); }

  .view-toggle { display: flex; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .view-btn { padding: 6px 14px; font-size: 12px; cursor: pointer; color: var(--muted); border: none; background: transparent; font-family: inherit; transition: all 0.15s; }
  .view-btn.active { background: var(--surface); color: var(--text); }

  .expense-table { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; overflow-x: auto; }
  .table-header { display: grid; grid-template-columns: 1.5fr 0.9fr 0.8fr 0.7fr 0.65fr 36px 66px; padding: 10px 18px; border-bottom: 1px solid var(--border); min-width: 650px; }
  .table-header span { font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); }
  .th-gst { color: var(--teal) !important; opacity: 0.85; }
  .expense-row { display: grid; grid-template-columns: 1.5fr 0.9fr 0.8fr 0.7fr 0.65fr 36px 66px; padding: 13px 18px; border-bottom: 1px solid var(--border); align-items: center; transition: background 0.15s; min-width: 650px; }
  .expense-row:last-child { border-bottom: none; }
  .expense-row:hover { background: var(--surface2); }
  .exp-desc { font-size: 13px; font-weight: 500; }
  .exp-notes { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .exp-cat { display: inline-block; padding: 3px 8px; border-radius: 20px; font-size: 11px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
  .exp-date { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); }
  .exp-amount { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; }
  .exp-gst { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--teal); }
  .exp-gst.none { color: var(--muted); opacity: 0.35; }
  .exp-receipt { font-size: 15px; cursor: pointer; opacity: 0.3; transition: opacity 0.15s; }
  .exp-receipt.has { opacity: 1; }
  .exp-actions { display: flex; gap: 4px; justify-content: flex-end; }
  .btn-sm { padding: 4px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; border: none; font-family: inherit; background: transparent; color: var(--muted); transition: color 0.15s; }
  .btn-sm:hover { color: var(--red); }
  .btn-sm.edit:hover { color: var(--amber); }
  .table-footer { padding: 11px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 20px; min-width: 650px; }
  .foot-gst { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--teal); }
  .foot-total { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--amber); }
  .empty { padding: 56px 20px; text-align: center; color: var(--muted); }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }

  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; } }
  .s-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .s-card.gst-card { background: rgba(78,205,196,0.04); border-color: rgba(78,205,196,0.18); }
  .s-title { font-size: 10px; letter-spacing: 1.3px; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  .s-title.teal { color: var(--teal); }
  .s-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .s-row:last-child { border-bottom: none; }
  .s-row.gst-row { border-bottom-color: rgba(78,205,196,0.12); }
  .s-name { font-size: 13px; }
  .s-count { font-size: 11px; color: var(--muted); }
  .s-amt { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--amber); }
  .s-gst-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--teal); margin-top: 1px; }
  .gst-big { font-family: 'DM Mono', monospace; font-size: 22px; color: var(--teal); }
  .gst-note { font-size: 11px; color: var(--muted); line-height: 1.5; margin-top: 10px; }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(4px); }
  @media (min-width: 600px) { .overlay { align-items: center; } }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 14px 14px 0 0; padding: 24px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; }
  @media (min-width: 600px) { .modal { border-radius: 14px; } }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-full { grid-column: 1 / -1; }
  .field label { display: block; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
  .field label.teal { color: var(--teal); }
  .field input, .field select, .field textarea { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 11px; border-radius: 6px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; -webkit-appearance: none; }
  .field input:focus, .field textarea:focus { border-color: var(--amber); }
  .field input.gst-inp { border-color: rgba(78,205,196,0.25); }
  .field input.gst-inp:focus { border-color: var(--teal); }
  .field select option { background: var(--surface2); }
  .field textarea { resize: vertical; min-height: 60px; }
  .gst-hint { font-size: 11px; color: var(--teal); margin-top: 4px; opacity: 0.75; }

  .scan-btns { display: flex; gap: 8px; margin-bottom: 8px; }
  .scan-btn { flex: 1; padding: 12px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface2); color: var(--text); font-size: 13px; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: all 0.15s; }
  .scan-btn:hover { border-color: var(--amber); color: var(--amber); }
  .scan-btn.scanning { opacity: 0.6; pointer-events: none; }
  .drop-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 16px; text-align: center; cursor: pointer; color: var(--muted); font-size: 13px; transition: all 0.15s; }
  .drop-zone:hover, .drop-zone.drag { border-color: var(--amber); color: var(--amber); }
  .drop-zone.filled { border-color: var(--green); color: var(--green); }
  .drop-zone-icon { font-size: 24px; margin-bottom: 4px; }
  .scan-success { color: var(--green); font-size: 12px; margin-top: 6px; }
  .scan-error { color: var(--red); font-size: 12px; margin-top: 6px; }
  .modal-footer { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }

  .receipt-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 300; display: flex; align-items: center; justify-content: center; }
  .receipt-inner { max-width: 92vw; max-height: 92vh; position: relative; }
  .receipt-inner img { max-width: 100%; max-height: 88vh; border-radius: 8px; }
  .receipt-close { position: absolute; top: -36px; right: 0; cursor: pointer; color: var(--muted); font-size: 13px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { display: inline-block; animation: spin 1s linear infinite; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

export default function App() {
  const today = new Date();
  const [activeBiz, setActiveBiz] = useState("airbnb");
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const [activeYear, setActiveYear] = useState(today.getFullYear());

  // allExpenses: flat array of all expenses loaded for this biz+year
  const [allExpenses, setAllExpenses] = useState([]);
  // receipts stored locally (images stay in browser — too large for DB)
  const [receiptPreviews, setReceiptPreviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ledgerside_receipts") || "{}"); } catch { return {}; }
  });

  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "error"
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [view, setView] = useState("list");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState({ type: "", text: "" });
  const [dragOver, setDragOver] = useState(false);
  const emptyForm = { description: "", amount: "", gst: "", category: "", date: today.toISOString().split("T")[0], notes: "", receipt: null, _gstManual: false };
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef();
  const cameraRef = useRef();

  // ── Load expenses from DB whenever biz or year changes ──────────────────────
  useEffect(() => {
    setLoading(true);
    setAllExpenses([]);
    dbGetExpenses(activeBiz, activeYear)
      .then(rows => setAllExpenses(rows))
      .catch(() => setSaveStatus("error"))
      .finally(() => setLoading(false));
  }, [activeBiz, activeYear]);

  // Persist receipts to localStorage (images stay local — fine, they're per-device)
  useEffect(() => {
    try { localStorage.setItem("ledgerside_receipts", JSON.stringify(receiptPreviews)); } catch {}
  }, [receiptPreviews]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const biz = BUSINESSES.find(b => b.id === activeBiz);
  const cats = ["All", ...CATEGORIES[activeBiz]];

  // expenses for the currently selected month
  const currentExpenses = allExpenses.filter(e => parseInt(e.month) === activeMonth);
  const filtered = filterCat === "All" ? currentExpenses : currentExpenses.filter(e => e.category === filterCat);

  const total         = currentExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const totalGST      = currentExpenses.reduce((s, e) => s + parseFloat(e.gst    || 0), 0);
  const filteredTotal = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const filteredGST   = filtered.reduce((s, e) => s + parseFloat(e.gst    || 0), 0);

  // YTD — all expenses loaded for this year
  const ytd    = allExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const ytdGST = allExpenses.reduce((s, e) => s + parseFloat(e.gst    || 0), 0);

  // allBizTotals needs cross-biz data — we keep a separate cache for the summary card
  const [allBizCache, setAllBizCache] = useState({});
  useEffect(() => {
    // Load YTD totals for all businesses for the summary view
    Promise.all(BUSINESSES.map(b => dbGetExpenses(b.id, activeYear).then(rows => ({ id: b.id, rows }))))
      .then(results => {
        const cache = {};
        results.forEach(({ id, rows }) => {
          cache[id] = {
            total: rows.reduce((s, e) => s + parseFloat(e.amount || 0), 0),
            gst:   rows.reduce((s, e) => s + parseFloat(e.gst    || 0), 0),
          };
        });
        setAllBizCache(cache);
      }).catch(() => {});
  }, [activeYear, allExpenses]); // refresh cache when expenses change

  const allBizTotals = BUSINESSES.map(b => ({
    ...b,
    total: allBizCache[b.id]?.total || 0,
    gst:   allBizCache[b.id]?.gst   || 0,
  }));
  const ytdAllBiz    = allBizTotals.reduce((s, b) => s + b.total, 0);
  const ytdGSTAllBiz = allBizTotals.reduce((s, b) => s + b.gst,   0);
  const bizYTDGST    = ytdGST; // already filtered to this biz

  const catTotals = CATEGORIES[activeBiz].map(cat => ({
    cat,
    total: currentExpenses.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.amount || 0), 0),
    gst:   currentExpenses.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.gst    || 0), 0),
    count: currentExpenses.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);

  // months that have data
  const monthsWithData = new Set(allExpenses.map(e => parseInt(e.month)));

  const yearsAvailable = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  const storeReceipt = (file) => new Promise(res => {
    const r = new FileReader();
    r.onload = (e) => res({ name: file.name, data: e.target.result, type: file.type });
    r.readAsDataURL(file);
  });

  const scanReceipt = async (file) => {
    if (!file?.type.startsWith("image/")) return;
    setScanning(true); setScanMsg({ type: "", text: "" });
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const resp = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type, categories: CATEGORIES[activeBiz].join(", ") }),
      });
      if (!resp.ok) throw new Error();
      const p = await resp.json();
      setForm(f => ({
        ...f,
        description: p.description || f.description,
        amount:      p.amount && p.amount !== "0" ? p.amount : f.amount,
        gst:         p.gst    && p.gst    !== "0" ? p.gst    : f.gst,
        date:        p.date   || f.date,
        category:    p.category || f.category,
        notes:       p.notes    || f.notes,
        _gstManual:  !!(p.gst && p.gst !== "0"),
      }));
      const gstNote = p.gst && p.gst !== "0" ? ` · GST ${fmt(p.gst)} detected ✓` : " · GST not printed — estimate applied";
      setScanMsg({ type: "success", text: "✅ Scanned" + gstNote });
    } catch {
      setScanMsg({ type: "error", text: "⚠️ Couldn't read receipt — fill in manually" });
    } finally { setScanning(false); }
  };

  const handleFileWithScan = async (file) => {
    if (!file) return;
    const receipt = await storeReceipt(file);
    setForm(f => ({ ...f, receipt }));
    if (file.type.startsWith("image/")) scanReceipt(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFileWithScan(e.dataTransfer.files[0]);
  }, [activeBiz]);

  const handleAmountChange = (val) => {
    setForm(f => ({ ...f, amount: val, gst: f._gstManual ? f.gst : String(calcGST(val) || "") }));
  };

  const saveExpense = async () => {
    if (!form.description || !form.amount || !form.category) return;
    const entry = {
      id:          editingId || generateId(),
      business:    activeBiz,
      year:        activeYear,
      month:       activeMonth,
      date:        form.date,
      description: form.description,
      amount:      parseFloat(form.amount),
      gst:         parseFloat(form.gst || 0),
      category:    form.category,
      notes:       form.notes || "",
    };
    setSaveStatus("saving");
    try {
      await dbSaveExpense(entry);
      // Optimistically update local state
      setAllExpenses(prev => {
        const without = prev.filter(e => e.id !== entry.id);
        return [entry, ...without];
      });
      if (form.receipt) setReceiptPreviews(p => ({ ...p, [entry.id]: form.receipt }));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
      resetForm();
    } catch {
      setSaveStatus("error");
    }
  };

  const deleteExpense = async (id) => {
    setSaveStatus("saving");
    try {
      await dbDeleteExpense(id);
      setAllExpenses(prev => prev.filter(e => e.id !== id));
      setReceiptPreviews(p => { const n = { ...p }; delete n[id]; return n; });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch {
      setSaveStatus("error");
    }
  };

  const startEdit = (expense) => {
    setForm({ ...expense, _gstManual: expense.gst > 0, receipt: receiptPreviews[expense.id] || null });
    setEditingId(expense.id); setScanMsg({ type: "", text: "" }); setShowForm(true);
  };

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setScanMsg({ type: "", text: "" }); setShowForm(false); };

  const exportCSV = () => {
    const rows = [["Date","Description","Category","Total Amount (CAD)","GST Paid (CAD)","Pre-tax Amount","Notes","Business"]];
    allExpenses.forEach(e => {
      const bName = BUSINESSES.find(b => b.id === e.business)?.name || e.business;
      rows.push([e.date, e.description, e.category, e.amount, e.gst || 0,
        (parseFloat(e.amount) - parseFloat(e.gst || 0)).toFixed(2), e.notes || "", bName]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ledgerside-${activeBiz}-${activeYear}.csv`; a.click();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        <header className="header">
          <div className="logo">LedgerSide <span>expense tracker</span></div>
          <div className="header-pills">
            {saveStatus === "saving" && <div className="pill" style={{ color: "var(--amber)" }}>💾 Saving…</div>}
            {saveStatus === "saved"  && <div className="pill" style={{ color: "var(--green)" }}>✓ Saved</div>}
            {saveStatus === "error"  && <div className="pill" style={{ color: "var(--red)" }}>⚠ Save failed</div>}
            <div className="pill total">YTD: <strong>{fmt(ytdAllBiz)}</strong></div>
            <div className="pill gst">GST Claimable: <strong>{fmt(ytdGSTAllBiz)}</strong></div>
          </div>
        </header>

        <div className="biz-bar">
          {BUSINESSES.map(b => (
            <div key={b.id} className={`biz-tab ${activeBiz === b.id ? "active" : ""}`}
              onClick={() => { setActiveBiz(b.id); setFilterCat("All"); }}>
              {b.icon} {b.name}
            </div>
          ))}
        </div>

        <div className="main">
          <aside className="sidebar">
            <div>
              <span className="sidebar-label">Year</span>
              <select className="year-select" value={activeYear} onChange={e => setActiveYear(+e.target.value)}>
                {yearsAvailable.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <span className="sidebar-label">Month</span>
              <div className="month-grid">
                {MONTHS.map((m, i) => (
                  <div key={m} className={`month-btn ${activeMonth === i ? "active" : ""} ${monthsWithData.has(i) ? "has-data" : ""}`}
                    onClick={() => setActiveMonth(i)}>{m.slice(0, 3)}</div>
                ))}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">{MONTHS[activeMonth]} {activeYear} — Expenses</div>
              <div className="stat-value">{fmt(total)}</div>
              <div className="stat-sub">{currentExpenses.length} item{currentExpenses.length !== 1 ? "s" : ""}</div>
              <hr className="stat-divider" />
              <div className="stat-label">GST This Month</div>
              <div className="stat-value teal">{fmt(totalGST)}</div>
              <hr className="stat-divider" />
              <div className="stat-label">GST YTD — {biz.name}</div>
              <div className="stat-value teal">{fmt(bizYTDGST)}</div>
            </div>
            {catTotals.length > 0 && (
              <div>
                <span className="sidebar-label">Categories</span>
                {catTotals.map(c => (
                  <div key={c.cat} className={`cat-row ${filterCat === c.cat ? "active" : ""}`}
                    onClick={() => setFilterCat(filterCat === c.cat ? "All" : c.cat)}>
                    <div style={{ flex: 1 }}>
                      <div className="cat-row-name">{c.cat}</div>
                      <div className="cat-bar-wrap"><div className="cat-bar" style={{ width: `${(c.total / total) * 100}%` }} /></div>
                    </div>
                    <div className="cat-amount">{fmt(c.total)}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost" style={{ fontSize: "12px", marginTop: "auto" }} onClick={exportCSV}>
              ↓ Export CSV (with GST)
            </button>
          </aside>

          <main className="content">
            <div className="content-header">
              <div className="content-title">{biz.icon} {biz.name} <span>/ {MONTHS[activeMonth]} {activeYear}</span></div>
              <div className="header-actions">
                <div className="view-toggle">
                  <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
                  <button className={`view-btn ${view === "summary" ? "active" : ""}`} onClick={() => setView("summary")}>Summary</button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add</button>
              </div>
            </div>

            {/* GST Banner */}
            {currentExpenses.length > 0 && (
              <div className="gst-banner">
                <div className="gst-b-item">
                  <div className="gst-b-label">Total Spent</div>
                  <div className="gst-b-val" style={{ color: "var(--amber)" }}>{fmt(total)}</div>
                </div>
                <div className="gst-b-item">
                  <div className="gst-b-label">GST Paid This Month</div>
                  <div className="gst-b-val">{fmt(totalGST)}</div>
                  <div className="gst-b-sub">input tax credit</div>
                </div>
                <div className="gst-b-item">
                  <div className="gst-b-label">Pre-tax Total</div>
                  <div className="gst-b-val" style={{ color: "var(--text)", fontSize: "14px" }}>{fmt(total - totalGST)}</div>
                </div>
                <div className="gst-b-item">
                  <div className="gst-b-label">GST YTD {activeYear}</div>
                  <div className="gst-b-val">{fmt(bizYTDGST)}</div>
                </div>
              </div>
            )}

            {currentExpenses.length > 0 && (
              <div className="chips">
                {cats.map(cat => (
                  <button key={cat} className={`chip ${filterCat === cat ? "active" : ""}`} onClick={() => setFilterCat(cat)}>{cat}</button>
                ))}
              </div>
            )}

            {view === "list" ? (
              <div className="expense-table">
                {loading ? (
                  <div className="empty">
                    <div className="empty-icon"><span className="spin">⏳</span></div>
                    <div>Loading expenses…</div>
                  </div>
                ) : filtered.length > 0 ? (
                  <>
                    <div className="table-header">
                      <span>Description</span><span>Category</span><span>Date</span>
                      <span>Amount</span><span className="th-gst">GST</span>
                      <span></span><span style={{ textAlign: "right" }}>Actions</span>
                    </div>
                    {filtered.map(e => (
                      <div key={e.id} className="expense-row">
                        <div>
                          <div className="exp-desc">{e.description}</div>
                          {e.notes && <div className="exp-notes">{e.notes}</div>}
                        </div>
                        <div><span className="exp-cat">{e.category}</span></div>
                        <div className="exp-date">{e.date}</div>
                        <div className="exp-amount">{fmt(e.amount)}</div>
                        <div className={`exp-gst ${!e.gst || e.gst === 0 ? "none" : ""}`}>
                          {e.gst > 0 ? fmt(e.gst) : "—"}
                        </div>
                        <div>
                          <span className={`exp-receipt ${receiptPreviews[e.id] ? "has" : ""}`}
                            onClick={() => receiptPreviews[e.id] && setActiveReceipt(receiptPreviews[e.id])}>
                            {receiptPreviews[e.id] ? "🧾" : "·"}
                          </span>
                        </div>
                        <div className="exp-actions">
                          <button className="btn-sm edit" onClick={() => startEdit(e)}>Edit</button>
                          <button className="btn-sm" onClick={() => deleteExpense(e.id)}>✕</button>
                        </div>
                      </div>
                    ))}
                    <div className="table-footer">
                      <span className="foot-gst">GST: {fmt(filteredGST)}</span>
                      <span className="foot-total">Total: {fmt(filteredTotal)} · {filtered.length} items</span>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <div className="empty-icon">📋</div>
                    <div>No expenses for {MONTHS[activeMonth]} {activeYear}</div>
                    <div style={{ fontSize: "12px", marginTop: "6px" }}>Tap <strong>+ Add</strong> or snap a receipt photo</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="summary-grid">
                <div className="s-card">
                  <div className="s-title">Category Breakdown</div>
                  {catTotals.length === 0
                    ? <div style={{ color: "var(--muted)", fontSize: "13px" }}>No data yet</div>
                    : catTotals.map(c => (
                      <div key={c.cat} className="s-row">
                        <div><div className="s-name">{c.cat}</div><div className="s-count">{c.count} item{c.count !== 1 ? "s" : ""}</div></div>
                        <div style={{ textAlign: "right" }}>
                          <div className="s-amt">{fmt(c.total)}</div>
                          {c.gst > 0 && <div className="s-gst-sub">GST {fmt(c.gst)}</div>}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="s-card gst-card">
                  <div className="s-title teal">GST / ITC Summary — {activeYear}</div>
                  {BUSINESSES.map(b => {
                    const bGST = Object.keys(expenses).filter(k => k.startsWith(b.id + "-" + activeYear))
                      .reduce((s, k) => s + (expenses[k] || []).reduce((ss, e) => ss + parseFloat(e.gst || 0), 0), 0);
                    return (
                      <div key={b.id} className="s-row gst-row">
                        <div className="s-name">{b.icon} {b.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "14px", color: "var(--teal)" }}>{fmt(bGST)}</div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "11px", color: "var(--teal)", opacity: 0.7, marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Total GST Claimable</div>
                    <div className="gst-big">{fmt(ytdGSTAllBiz)}</div>
                  </div>
                  <div className="gst-note">These are your Input Tax Credits (ITCs). Claim this on your GST/HST return or give this figure to your accountant.</div>
                </div>

                <div className="s-card">
                  <div className="s-title">Monthly — {activeYear}</div>
                  {MONTHS.map((m, i) => {
                    const mRows  = allExpenses.filter(e => parseInt(e.month) === i);
                    const mTotal = mRows.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                    const mGST   = mRows.reduce((s, e) => s + parseFloat(e.gst    || 0), 0);
                    const maxM   = Math.max(...MONTHS.map((_, ii) => allExpenses.filter(e => parseInt(e.month) === ii).reduce((s, e) => s + parseFloat(e.amount || 0), 0)), 1);
                    return (
                      <div key={m} className="s-row" style={{ cursor: "pointer" }} onClick={() => { setActiveMonth(i); setView("list"); }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ fontSize: "12px", color: i === activeMonth ? "var(--amber)" : "var(--text)" }}>{m.slice(0, 3)}</span>
                            <div>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--muted)" }}>{mTotal > 0 ? fmt(mTotal) : "—"}</span>
                              {mGST > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--teal)", marginLeft: "6px" }}>+{fmt(mGST)}</span>}
                            </div>
                          </div>
                          <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                            <div style={{ height: "3px", width: `${(mTotal / maxM) * 100}%`, background: i === activeMonth ? "var(--amber)" : "var(--muted)", borderRadius: "2px" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="s-card">
                  <div className="s-title">All Businesses — YTD {activeYear}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {allBizTotals.map(b => (
                      <div key={b.id} style={{ padding: "14px", background: "var(--surface2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "22px", marginBottom: "4px" }}>{b.icon}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "2px" }}>{b.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "18px", color: b.color }}>{fmt(b.total)}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--teal)", marginTop: "3px" }}>GST {fmt(b.gst)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {showForm && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && resetForm()}>
            <div className="modal">
              <div className="modal-title">{editingId ? "Edit" : "New"} Expense — {biz.icon} {biz.name}</div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                  📸 Snap Receipt — AI fills amount, date & GST automatically
                </div>
                <div className="scan-btns">
                  <button className={`scan-btn ${scanning ? "scanning" : ""}`} onClick={() => cameraRef.current?.click()}>
                    {scanning ? <span className="spin">🔍</span> : "📷"} {scanning ? "Scanning…" : "Take Photo"}
                  </button>
                  <button className={`scan-btn ${scanning ? "scanning" : ""}`} onClick={() => fileRef.current?.click()}>
                    📁 Upload File
                  </button>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleFileWithScan(e.target.files[0])} />
                  <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => handleFileWithScan(e.target.files[0])} />
                </div>
                <div className={`drop-zone ${dragOver ? "drag" : ""} ${form.receipt ? "filled" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}>
                  <div className="drop-zone-icon">{form.receipt ? "✅" : "📎"}</div>
                  <div>{form.receipt ? form.receipt.name : "or drop a receipt here"}</div>
                </div>
                {scanMsg.text && <div className={scanMsg.type === "success" ? "scan-success" : "scan-error"}>{scanMsg.text}</div>}
              </div>

              <div className="form-grid">
                <div className="field form-full">
                  <label>Description *</label>
                  <input placeholder="e.g. Costco cleaning supplies" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Total Amount (CAD) *</label>
                  <input type="number" placeholder="0.00" step="0.01" inputMode="decimal" value={form.amount}
                    onChange={e => handleAmountChange(e.target.value)} />
                </div>
                <div className="field">
                  <label className="teal">GST Paid (CAD)</label>
                  <input type="number" placeholder={form.amount ? `est. ${calcGST(form.amount)}` : "0.00"}
                    step="0.01" inputMode="decimal" value={form.gst} className="gst-inp"
                    onChange={e => setForm(f => ({ ...f, gst: e.target.value, _gstManual: true }))} />
                  <div className="gst-hint">
                    {form.gst && form.amount
                      ? `Pre-tax: ${fmt(parseFloat(form.amount) - parseFloat(form.gst || 0))}`
                      : "Auto-estimated at 5% · override if receipt shows different"}
                  </div>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field form-full">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select…</option>
                    {CATEGORIES[activeBiz].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field form-full">
                  <label>Notes</label>
                  <textarea placeholder="Business purpose, HST number, client name…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button className="btn btn-primary" onClick={saveExpense} disabled={!form.description || !form.amount || !form.category}>
                  {editingId ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeReceipt && (
          <div className="receipt-overlay" onClick={() => setActiveReceipt(null)}>
            <div className="receipt-inner" onClick={e => e.stopPropagation()}>
              <div className="receipt-close" onClick={() => setActiveReceipt(null)}>✕ Close</div>
              {activeReceipt.type === "application/pdf"
                ? <iframe src={activeReceipt.data} style={{ width: "80vw", height: "85vh", border: "none", borderRadius: "8px" }} />
                : <img src={activeReceipt.data} alt="Receipt" />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
