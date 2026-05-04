import React, { useState } from "react";

type Staff = {
  id: string;
  name: string;
  points: number;
};

type Penalty = {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  reason: string;
  amount: number;
  checkedBy: string;
};

const staffList: Staff[] = [
  { id: "1", name: "Tej", points: 5 },
  { id: "2", name: "Sameer", points: 5 },
  { id: "3", name: "Tarak", points: 3 },
];

export default function App() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [form, setForm] = useState({
    staffId: "",
    reason: "",
    amount: "",
    checkedBy: "",
    date: new Date().toISOString().split("T")[0],
  });

  const totalPool = 5000; // total tips (you can make dynamic later)
  const totalPoints = staffList.reduce((sum, s) => sum + s.points, 0);
  const perPoint = totalPool / totalPoints;

  const addPenalty = () => {
    if (!form.staffId || !form.amount) return;

    const selected = staffList.find((s) => s.id === form.staffId);

    const newPenalty: Penalty = {
      id: Date.now().toString(),
      staffId: form.staffId,
      staffName: selected?.name || "",
      date: form.date,
      reason: form.reason,
      amount: Number(form.amount),
      checkedBy: form.checkedBy,
    };

    setPenalties((prev) => [...prev, newPenalty]);

    setForm({
      staffId: "",
      reason: "",
      amount: "",
      checkedBy: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const getPenalty = (staffId: string) =>
    penalties
      .filter((p) => p.staffId === staffId)
      .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "#f4f6f8",
        minHeight: "100vh",
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 500, margin: "auto" }}>
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2>Tips Manager</h2>
          <p style={{ color: "#666" }}>By Everest Developers</p>
        </div>

        {/* PENALTY FORM */}
        <div
          style={{
            background: "#fff",
            padding: 15,
            borderRadius: 10,
            marginBottom: 20,
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Penalty Entry</h3>

          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <select
            value={form.staffId}
            onChange={(e) => setForm({ ...form, staffId: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          >
            <option value="">Select Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Reason"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <input
            placeholder="Amount ₹"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <input
            placeholder="Checked By"
            value={form.checkedBy}
            onChange={(e) => setForm({ ...form, checkedBy: e.target.value })}
            style={{ width: "100%", marginBottom: 10, padding: 8 }}
          />

          <button
            onClick={addPenalty}
            style={{
              width: "100%",
              padding: 10,
              background: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: "bold",
            }}
          >
            Add Penalty
          </button>
        </div>

        {/* PENALTY LIST */}
        <div style={{ marginBottom: 20 }}>
          <h3>Penalty Records</h3>

          {penalties.length === 0 && <p>No penalties added</p>}

          {penalties.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#fff",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            >
              <strong>{p.staffName}</strong> — ₹{p.amount}
              <br />
              {p.reason}
              <br />
              <small>
                {p.date} | Checked by: {p.checkedBy}
              </small>
            </div>
          ))}
        </div>

        {/* FINAL PAYOUT */}
        <div>
          <h3>Final Payout</h3>

          {staffList.map((s) => {
            const earned = s.points * perPoint;
            const penalty = getPenalty(s.id);
            const final = earned - penalty;

            return (
              <div
                key={s.id}
                style={{
                  background: "#e3f2fd",
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <strong>{s.name}</strong>
                <br />
                Earned: ₹{earned.toFixed(0)}
                <br />
                Penalty: ₹{penalty}
                <br />
                <strong>Final Pay: ₹{final.toFixed(0)}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}