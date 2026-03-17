import { useState, useRef, useCallback, useEffect } from "react";

const BUSINESSES = [
  { id: "airbnb", name: "Airbnb", icon: "🏠", color: "#FF5A5F" },
  { id: "younghorizon", name: "YoungHorizon Chess", icon: "♟️", color: "#4A90D9" },
];

const CATEGORIES = {
  airbnb: ["Cleaning", "Supplies", "Maintenance", "Utilities", "Mortgage/Rent", "Insurance", "Furnishings", "Marketing", "Platform Fees", "Other"],
  younghorizon: ["Equipment", "Venue", "Coaching", "Marketing", "Software", "Travel", "Prizes/Awards", "Admin", "Platform Fees", "Other"],
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const STORAGE_KEY = "ledgerside_expenses";

const fmt = (n) => new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n || 0);
const generateId = () => Math.random().toString(36).slice(2, 10);

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0E0F0F; --surface: #161717; --surface2: #1E1F1F;
    --border: #2A2B2B; --amber: #E8A94B; --amber2: #C8872A;
    --text: #E8E3DC; --muted: #6B6660; --green: #5BB88A; --red: #E8645A;
  }
  html, body { background: var(--bg); color: var(--text); font-family: 'Instrument Sans', sans-serif; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* Header */
  .header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 20px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 100; }
  .logo { font-family: 'DM Serif Display', serif; font-size: 19px; color: var(--amber); }
  .logo span { color: var(--muted); font-style: italic; font-size: 13px; margin-left: 8px; }
  .ytd-pill { background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--muted); }
  .ytd-pill strong { color: var(--amber); font-family: 'DM Mono', monospace; }

  /* Biz tabs */
  .biz-bar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 0 20px; display: flex; gap: 2px; overflow-x: auto; }
  .biz-tab { padding: 13px 18px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 7px; }
  .biz-tab:hover { color: var(--text); }
  .biz-tab.active { color: var(--text); border-bottom-color: var(--amber); }

  /* Layout */
  .main { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 103px); }
  @media (max-width: 700px) { .main { grid-template-columns: 1fr; } .sidebar { display: none; } }

  /* Sidebar */
  .sidebar { background: var(--surface); border-right: 1px solid var(--border); padding: 18px; display: flex; flex-direction: column; gap: 22px; overflow-y: auto; }
  .sidebar-label { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 8px; }
  .month-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .month-btn { padding: 7px 2px; font-size: 11px; text-align: center; cursor: pointer; border-radius: 4px; color: var(--muted); transition: all 0.15s; border: 1px solid transparent; }
  .month-btn:hover { background: var(--surface2); color: var(--text); }
  .month-btn.active { background: var(--amber); color: #0E0F0F; font-weight: 600; }
  .month-btn.has-data { color: var(--text); }
  .year-select { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 13px; cursor: pointer; outline: none; }
  .stat-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
  .stat-label { font-size: 11px; color: var(--muted); margin-bottom: 4px; }
  .stat-value { font-family: 'DM Mono', monospace; font-size: 22px; color: var(--amber); }
  .stat-sub { font-size: 11px; color: var(--muted); margin-top: 3px; }
  .cat-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; border-radius: 5px; cursor: pointer; transition: background 0.15s; }
  .cat-row:hover, .cat-row.active { background: var(--surface2); }
  .cat-row-name { font-size: 12px; color: var(--muted); }
  .cat-row.active .cat-row-name { color: var(--text); }
  .cat-bar-wrap { height: 2px; background: var(--border); border-radius: 2px; margin-top: 3px; }
  .cat-bar { height: 2px; background: var(--amber); border-radius: 2px; }
  .cat-amount { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--text); }

  /* Content */
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
  .btn-ghost.active { color: var(--amber); border-color: var(--amber); }

  /* Filter chips */
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; cursor: pointer; border: 1px solid var(--border); color: var(--muted); background: transparent; font-family: inherit; transition: all 0.15s; }
  .chip:hover { color: var(--text); }
  .chip.active { color: var(--amber); border-color: var(--amber); background: rgba(232,169,75,0.08); }

  /* View toggle */
  .view-toggle { display: flex; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .view-btn { padding: 6px 14px; font-size: 12px; cursor: pointer; color: var(--muted); border: none; background: transparent; font-family: inherit; transition: all 0.15s; }
  .view-btn.active { background: var(--surface); color: var(--text); }

  /* Table */
  .expense-table { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .table-header { display: grid; grid-template-columns: 1.6fr 1fr 0.9fr 0.7fr 40px 70px; padding: 10px 18px; border-bottom: 1px solid var(--border); }
  .table-header span { font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: var(--muted); }
  .expense-row { display: grid; grid-template-columns: 1.6fr 1fr 0.9fr 0.7fr 40px 70px; padding: 13px 18px; border-bottom: 1px solid var(--border); align-items: center; transition: background 0.15s; }
  .expense-row:last-child { border-bottom: none; }
  .expense-row:hover { background: var(--surface2); }
  .exp-desc { font-size: 14px; font-weight: 500; }
  .exp-notes { font-size: 11px; color: var(--muted); margin-top: 1px; }
  .exp-cat { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 11px; background: var(--surface2); border: 1px solid var(--border); color: var(--muted); }
  .exp-date { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--muted); }
  .exp-amount { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; }
  .exp-receipt { font-size: 16px; cursor: pointer; opacity: 0.35; transition: opacity 0.15s; }
  .exp-receipt.has { opacity: 1; }
  .exp-actions { display: flex; gap: 4px; justify-content: flex-end; }
  .btn-sm { padding: 4px 8px; font-size: 11px; border-radius: 4px; cursor: pointer; border: none; font-family: inherit; background: transparent; color: var(--muted); transition: color 0.15s; }
  .btn-sm:hover { color: var(--red); }
  .btn-sm.edit:hover { color: var(--amber); }
  .table-footer { padding: 11px 18px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }
  .empty { padding: 56px 20px; text-align: center; color: var(--muted); }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }

  /* Summary */
  .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 600px) { .summary-grid { grid-template-columns: 1fr; } }
  .s-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px; }
  .s-title { font-size: 10px; letter-spacing: 1.3px; text-transform: uppercase; color: var(--muted); margin-bottom: 14px; }
  .s-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .s-row:last-child { border-bottom: none; }
  .s-name { font-size: 13px; }
  .s-count { font-size: 11px; color: var(--muted); }
  .s-amt { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--amber); }

  /* Modal */
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; display: flex; align-items: flex-end; justify-content: center; backdrop-filter: blur(4px); }
  @media (min-width: 600px) { .overlay { align-items: center; } }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 14px 14px 0 0; padding: 24px; width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; }
  @media (min-width: 600px) { .modal { border-radius: 14px; } }
  .modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 20px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-full { grid-column: 1 / -1; }
  .field label { display: block; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
  .field input, .field select, .field textarea { width: 100%; background: var(--surface2); border: 1px solid var(--border); color: var(--text); padding: 10px 11px; border-radius: 6px; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; -webkit-appearance: none; }
  .field input:focus, .field textarea:focus { border-color: var(--amber); }
  .field select option { background: var(--surface2); }
  .field textarea { resize: vertical; min-height: 60px; }

  /* Scan zone */
  .scan-btns { display: flex; gap: 8px; margin-bottom: 8px; }
  .scan-btn { flex: 1; padding: 12px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface2); color: var(--text); font-size: 13px; font-family: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 7px; transition: all 0.15s; }
  .scan-btn:hover { border-color: var(--amber); color: var(--amber); }
  .scan-btn.scanning { border-color: var(--amber); color: var(--amber); opacity: 0.7; pointer-events: none; }
  .drop-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 20px; text-align: center; cursor: pointer; color: var(--muted); font-size: 13px; transition: all 0.15s; }
  .drop-zone:hover, .drop-zone.drag { border-color: var(--amber); color: var(--amber); background: rgba(232,169,75,0.04); }
  .drop-zone.filled { border-color: var(--green); color: var(--green); background: rgba(91,184,138,0.04); }
  .drop-zone-icon { font-size: 26px; margin-bottom: 5px; }
  .scan-note { font-size: 11px; color: var(--muted); margin-top: 6px; }
  .scan-error { color: var(--red); font-size: 12px; margin-top: 6px; }
  .scan-success { color: var(--green); font-size: 12px; margin-top: 6px; }

  .modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }

  /* Receipt viewer */
  .receipt-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 300; display: flex; align-items: center; justify-content: center; }
  .receipt-inner { max-width: 92vw; max-height: 92vh; position: relative; }
  .receipt-inner img { max-width: 100%; max-height: 88vh; border-radius: 8px; }
  .receipt-close { position: absolute; top: -36px; right: 0; cursor: pointer; color: var(--muted); font-size: 13px; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .spin { display: inline-block; animation: spin 1s linear infinite; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

export default function App() {
  const today = new Date();
  const [activeBiz, setActiveBiz] = useState("airbnb");
  const [activeMonth, setActiveMonth] = useState(today.getMonth());
  const [activeYear, setActiveYear] = useState(today.getFullYear());
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  });
  const [receiptPreviews, setReceiptPreviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY + "_receipts") || "{}"); } catch { return {}; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [filterCat, setFilterCat] = useState("All");
  const [view, setView] = useState("list");
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState({ type: "", text: "" });
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", category: "",
    date: today.toISOString().split("T")[0], notes: "", receipt: null
  });
  const fileRef = useRef();
  const cameraRef = useRef();

  // Persist expenses to localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); } catch {}
  }, [expenses]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY + "_receipts", JSON.stringify(receiptPreviews)); } catch {}
  }, [receiptPreviews]);

  const bizKey = (biz, month, year) => `${biz}-${year}-${month}`;
  const currentKey = bizKey(activeBiz, activeMonth, activeYear);
  const currentExpenses = expenses[currentKey] || [];
  const biz = BUSINESSES.find(b => b.id === activeBiz);
  const cats = ["All", ...CATEGORIES[activeBiz]];
  const filtered = filterCat === "All" ? currentExpenses : currentExpenses.filter(e => e.category === filterCat);
  const total = currentExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const filteredTotal = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const catTotals = CATEGORIES[activeBiz].map(cat => ({
    cat,
    total: currentExpenses.filter(e => e.category === cat).reduce((s, e) => s + parseFloat(e.amount || 0), 0),
    count: currentExpenses.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0).sort((a, b) => b.total - a.total);
  const allBizTotals = BUSINESSES.map(b => ({
    ...b,
    total: Object.keys(expenses).filter(k => k.startsWith(b.id + "-" + activeYear))
      .reduce((s, k) => s + (expenses[k] || []).reduce((ss, e) => ss + parseFloat(e.amount || 0), 0), 0),
  }));
  const ytd = allBizTotals.reduce((s, b) => s + b.total, 0);
  const yearsAvailable = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);

  // Store receipt image as base64
  const storeReceipt = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, data: e.target.result, type: file.type });
    reader.readAsDataURL(file);
  });

  // Call serverless function to scan receipt
  const scanReceipt = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setScanning(true);
    setScanMsg({ type: "", text: "" });
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
          categories: CATEGORIES[activeBiz].join(", "),
        }),
      });
      if (!response.ok) throw new Error("Server error");
      const parsed = await response.json();
      setForm(f => ({
        ...f,
        description: parsed.description || f.description,
        amount: parsed.amount && parsed.amount !== "0" ? parsed.amount : f.amount,
        date: parsed.date || f.date,
        category: parsed.category || f.category,
        notes: parsed.notes || f.notes,
      }));
      setScanMsg({ type: "success", text: "✅ Receipt scanned — review and confirm below" });
    } catch {
      setScanMsg({ type: "error", text: "⚠️ Couldn't read receipt automatically — fill in manually" });
    } finally {
      setScanning(false);
    }
  };

  const handleFileWithScan = async (file) => {
    if (!file) return;
    const receipt = await storeReceipt(file);
    setForm(f => ({ ...f, receipt }));
    if (file.type.startsWith("image/")) scanReceipt(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileWithScan(file);
  }, [activeBiz]);

  const saveExpense = () => {
    if (!form.description || !form.amount || !form.category) return;
    const entry = { ...form, id: editingId || generateId(), amount: parseFloat(form.amount) };
    setExpenses(prev => {
      const existing = prev[currentKey] || [];
      const updated = editingId
        ? existing.map(e => e.id === editingId ? entry : e)
        : [entry, ...existing];
      return { ...prev, [currentKey]: updated };
    });
    if (form.receipt) setReceiptPreviews(p => ({ ...p, [entry.id]: form.receipt }));
    resetForm();
  };

  const deleteExpense = (id) => {
    setExpenses(prev => ({ ...prev, [currentKey]: (prev[currentKey] || []).filter(e => e.id !== id) }));
    setReceiptPreviews(p => { const n = { ...p }; delete n[id]; return n; });
  };

  const startEdit = (expense) => {
    setForm({ ...expense, receipt: receiptPreviews[expense.id] || null });
    setEditingId(expense.id);
    setScanMsg({ type: "", text: "" });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ description: "", amount: "", category: "", date: today.toISOString().split("T")[0], notes: "", receipt: null });
    setEditingId(null);
    setScanMsg({ type: "", text: "" });
    setShowForm(false);
  };

  const exportCSV = () => {
    const rows = [["Date", "Description", "Category", "Amount (CAD)", "Notes", "Business"]];
    Object.keys(expenses).forEach(key => {
      const [bizId, year, month] = key.split("-");
      const bName = BUSINESSES.find(b => b.id === bizId)?.name || bizId;
      (expenses[key] || []).forEach(e => {
        rows.push([e.date, e.description, e.category, e.amount, e.notes || "", bName]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ledgerside-${activeYear}.csv`; a.click();
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <div className="logo">LedgerSide <span>expense tracker</span></div>
          <div className="ytd-pill">YTD {activeYear}: <strong>{fmt(ytd)}</strong></div>
        </header>

        {/* Business tabs */}
        <div className="biz-bar">
          {BUSINESSES.map(b => (
            <div key={b.id} className={`biz-tab ${activeBiz === b.id ? "active" : ""}`}
              onClick={() => { setActiveBiz(b.id); setFilterCat("All"); }}>
              {b.icon} {b.name}
            </div>
          ))}
        </div>

        <div className="main">

          {/* Sidebar */}
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
                {MONTHS.map((m, i) => {
                  const k = bizKey(activeBiz, i, activeYear);
                  const hasData = (expenses[k] || []).length > 0;
                  return (
                    <div key={m} className={`month-btn ${activeMonth === i ? "active" : ""} ${hasData ? "has-data" : ""}`}
                      onClick={() => setActiveMonth(i)}>
                      {m.slice(0, 3)}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">{MONTHS[activeMonth]} {activeYear}</div>
              <div className="stat-value">{fmt(total)}</div>
              <div className="stat-sub">{currentExpenses.length} expense{currentExpenses.length !== 1 ? "s" : ""}</div>
            </div>
            {catTotals.length > 0 && (
              <div>
                <span className="sidebar-label">Categories</span>
                {catTotals.map(c => (
                  <div key={c.cat} className={`cat-row ${filterCat === c.cat ? "active" : ""}`}
                    onClick={() => setFilterCat(filterCat === c.cat ? "All" : c.cat)}>
                    <div>
                      <div className="cat-row-name">{c.cat}</div>
                      <div className="cat-bar-wrap"><div className="cat-bar" style={{ width: `${(c.total / total) * 100}%` }} /></div>
                    </div>
                    <div className="cat-amount">{fmt(c.total)}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-ghost" style={{ fontSize: "12px", marginTop: "auto" }} onClick={exportCSV}>
              ↓ Export All as CSV
            </button>
          </aside>

          {/* Main content */}
          <main className="content">
            <div className="content-header">
              <div className="content-title">
                {biz.icon} {biz.name} <span>/ {MONTHS[activeMonth]} {activeYear}</span>
              </div>
              <div className="header-actions">
                <div className="view-toggle">
                  <button className={`view-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
                  <button className={`view-btn ${view === "summary" ? "active" : ""}`} onClick={() => setView("summary")}>Summary</button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add</button>
              </div>
            </div>

            {/* Filter chips */}
            {currentExpenses.length > 0 && (
              <div className="chips">
                {cats.map(cat => (
                  <button key={cat} className={`chip ${filterCat === cat ? "active" : ""}`} onClick={() => setFilterCat(cat)}>{cat}</button>
                ))}
              </div>
            )}

            {view === "list" ? (
              <div className="expense-table">
                {filtered.length > 0 ? (
                  <>
                    <div className="table-header">
                      <span>Description</span><span>Category</span><span>Date</span>
                      <span>Amount</span><span></span><span style={{ textAlign: "right" }}>Actions</span>
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
                        <div>
                          <span className={`exp-receipt ${receiptPreviews[e.id] ? "has" : ""}`}
                            title={receiptPreviews[e.id] ? "View receipt" : "No receipt"}
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
                    {filterCat !== "All" && (
                      <div className="table-footer">
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", color: "var(--amber)" }}>
                          {fmt(filteredTotal)} · {filtered.length} items
                        </span>
                      </div>
                    )}
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
                        <div className="s-amt">{fmt(c.total)}</div>
                      </div>
                    ))}
                </div>
                <div className="s-card">
                  <div className="s-title">Monthly — {activeYear}</div>
                  {MONTHS.map((m, i) => {
                    const k = bizKey(activeBiz, i, activeYear);
                    const mTotal = (expenses[k] || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                    const maxMonth = Math.max(...MONTHS.map((_, ii) => (expenses[bizKey(activeBiz, ii, activeYear)] || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0)), 1);
                    return (
                      <div key={m} className="s-row" style={{ cursor: "pointer" }} onClick={() => { setActiveMonth(i); setView("list"); }}>
                        <div style={{ flex: 1, marginRight: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                            <span style={{ fontSize: "12px", color: i === activeMonth ? "var(--amber)" : "var(--text)" }}>{m.slice(0, 3)}</span>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--muted)" }}>{mTotal > 0 ? fmt(mTotal) : "—"}</span>
                          </div>
                          <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                            <div style={{ height: "3px", width: `${(mTotal / maxMonth) * 100}%`, background: i === activeMonth ? "var(--amber)" : "var(--muted)", borderRadius: "2px" }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="s-card" style={{ gridColumn: "1 / -1" }}>
                  <div className="s-title">All Businesses — YTD {activeYear}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    {allBizTotals.map(b => (
                      <div key={b.id} style={{ padding: "14px", background: "var(--surface2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "22px", marginBottom: "5px" }}>{b.icon}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "3px" }}>{b.name}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "20px", color: b.color }}>{fmt(b.total)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="overlay" onClick={e => e.target === e.currentTarget && resetForm()}>
            <div className="modal">
              <div className="modal-title">{editingId ? "Edit" : "New"} Expense — {biz.icon} {biz.name}</div>

              {/* Receipt scan first — most important for mobile */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                  📸 Snap Receipt to Auto-Fill
                </div>
                <div className="scan-btns">
                  <button className={`scan-btn ${scanning ? "scanning" : ""}`} onClick={() => cameraRef.current?.click()}>
                    {scanning ? <span className="spin">🔍</span> : "📷"} {scanning ? "Scanning…" : "Take Photo"}
                  </button>
                  <button className={`scan-btn ${scanning ? "scanning" : ""}`} onClick={() => fileRef.current?.click()}>
                    📁 Upload File
                  </button>
                  <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                    onChange={e => handleFileWithScan(e.target.files[0])} />
                  <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }}
                    onChange={e => handleFileWithScan(e.target.files[0])} />
                </div>
                <div className={`drop-zone ${dragOver ? "drag" : ""} ${form.receipt ? "filled" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{ padding: "14px" }}>
                  <div className="drop-zone-icon">{form.receipt ? "✅" : "📎"}</div>
                  <div>{form.receipt ? form.receipt.name : "or drop a receipt here"}</div>
                </div>
                {scanMsg.text && (
                  <div className={scanMsg.type === "success" ? "scan-success" : "scan-error"}>{scanMsg.text}</div>
                )}
              </div>

              <div className="form-grid">
                <div className="field form-full">
                  <label>Description *</label>
                  <input placeholder="e.g. Costco cleaning supplies" value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Amount (CAD) *</label>
                  <input type="number" placeholder="0.00" step="0.01" inputMode="decimal" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="field form-full">
                  <label>Category *</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="">Select…</option>
                    {CATEGORIES[activeBiz].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field form-full">
                  <label>Notes (optional)</label>
                  <textarea placeholder="GST amount, business purpose, client name…" value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                <button className="btn btn-primary" onClick={saveExpense}
                  disabled={!form.description || !form.amount || !form.category}>
                  {editingId ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt viewer */}
        {activeReceipt && (
          <div className="receipt-overlay" onClick={() => setActiveReceipt(null)}>
            <div className="receipt-inner" onClick={e => e.stopPropagation()}>
              <div className="receipt-close" onClick={() => setActiveReceipt(null)}>✕ Close</div>
              {activeReceipt.type === "application/pdf"
                ? <iframe src={activeReceipt.data} style={{ width: "80vw", height: "85vh", border: "none", borderRadius: "8px" }} />
                : <img src={activeReceipt.data} alt="Receipt" />
              }
            </div>
          </div>
        )}

      </div>
    </>
  );
}
