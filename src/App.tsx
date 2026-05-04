import React, { useState } from "react";

type Staff = {
  id: string;
  name: string;
  points: number;
};

type Advance = {
  staffId: string;
  amount: number;
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

const initialStaff: Staff[] = [
  { id: "1", name: "Tej", points: 5 },
  { id: "2", name: "Sameer", points: 5 },
  { id: "3", name: "Tarak", points: 3 },
];

export default function App() {
  const [staff] = useState<Staff[]>(initialStaff);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);

  const [form, setForm] = useState({
    staffId: "",
    reason: "",
    amount: "",
    checkedBy: "",
    date: new Date().toISOString().split("T")[0],
  });

  const totalPoints = staff.reduce((a, b) => a + b.points, 0);
  const totalPool = 5000; // example total tips
  const perPoint = totalPool / totalPoints;

  const addPenalty = () => {
    if (!form.staffId || !form.amount) return;

    const selected = staff.find((s) => s.id === form.staffId);

    const newPenalty: Penalty = {
      id: Date.now().toString(),
      staffId: form.staffId,
      staffName: selected?.name || "",
      reason: form.reason,
      amount: Number(form.amount),
      checkedBy: form.checkedBy,
      date: form.date,
    };

    setPenalties([...penalties, newPenalty]);

    setForm({
      staffId: "",
      reason: "",
      amount: "",
      checkedBy: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const getAdvance = (id: string) =>
    advances.filter((a) => a.staffId === id).reduce((s, a) => s + a.amount, 0);

  const getPenalty = (id: string) =>
    penalties.filter((p) => p.staffId === id).reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ padding: 20 }}>
      <h1>Tips Manager (By Everest Developers)</h1>

      {/* PENALTY FORM */}
      <h2>Penalty Entry</h2>

      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <select
        value={form.staffId}
        onChange={(e) => setForm({ ...form, staffId: e.target.value })}
      >
        <option value="">Select Staff</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Reason"
        value={form.reason}
        onChange={(e) => setForm({ ...form, reason: e.target.value })}
      />

      <input
        placeholder="Amount"
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
      />

      <input
        placeholder="Checked By"
        value={form.checkedBy}
        onChange={(e) => setForm({ ...form, checkedBy: e.target.value })}
      />

      <button onClick={addPenalty}>Add Penalty</button>

      {/* PENALTY TABLE */}
      <h2>Penalty Records</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Reason</th>
            <th>Checked By</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {penalties.map((p) => (
            <tr key={p.id}>
              <td>{p.date}</td>
              <td>{p.staffName}</td>
              <td>{p.reason}</td>
              <td>{p.checkedBy}</td>
              <td>{p.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FINAL PAYOUT */}
      <h2>Final Payout</h2>
      <table border={1}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Earned</th>
            <th>Advance</th>
            <th>Penalty</th>
            <th>Final Pay</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => {
            const earned = s.points * perPoint;
            const adv = getAdvance(s.id);
            const pen = getPenalty(s.id);
            const final = earned - (adv + pen);

            return (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{earned.toFixed(0)}</td>
                <td>{adv}</td>
                <td>{pen}</td>
                <td>{final.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}