"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList
} from "recharts";
import { DEFAULT_FORM_OPTIONS, FormOptions, ReasonCategory } from "@/types";

interface PatientRecord {
  _id: string;
  fullName: string;
  mobileNumber: string;
  age?: string;
  gender?: string;
  address?: string;
  visitType?: string;
  leadSource?: string;
  selectedCategory?: string;
  reason?: string;
  otherSourceDetails?: string;
  submittedAt?: string;
}

const SESSION_KEY = "drsunita_admin_session";
const COLORS = ["#008080", "#0ea5a8", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1"];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("password");
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"submissions" | "analytics" | "settings">("submissions");
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [formOptions, setFormOptions] = useState<FormOptions>(DEFAULT_FORM_OPTIONS);
  const [newCategory, setNewCategory] = useState("");
  const [newSource, setNewSource] = useState("");
  const [savingOptions, setSavingOptions] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem(SESSION_KEY) === "true");
  }, []);

  const fetchRecords = async () => {
    setLoadingRecords(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await fetch("/api/options");
      const data = await res.json();
      if (
        Array.isArray(data?.reasons) &&
        Array.isArray(data?.sources) &&
        (data.reasons.length > 0 || data.sources.length > 0)
      ) {
        setFormOptions({ reasons: data.reasons, sources: data.sources });
      } else {
        setFormOptions(DEFAULT_FORM_OPTIONS);
      }
    } catch {
      setFormOptions(DEFAULT_FORM_OPTIONS);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      void fetchRecords();
      void fetchOptions();
    }
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((row) =>
      [
        row.fullName,
        row.mobileNumber,
        row.age,
        row.gender,
        row.address,
        row.visitType,
        row.selectedCategory,
        row.reason,
        row.leadSource,
        row.otherSourceDetails
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q))
    );
  }, [records, search]);

  const login = async () => {
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        localStorage.setItem(SESSION_KEY, "true");
        setIsLoggedIn(true);
      } else if (res.status === 401) {
        alert("Invalid credentials");
      } else {
        alert("Login failed. Please try again.");
      }
    } catch {
      alert("Network error. Please retry.");
    }
  };

  const visitTypeData = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((acc, row) => {
      const key = row.visitType || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const sourceData = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((acc, row) => {
      const key = row.leadSource || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const categoryData = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((acc, row) => {
      const key = row.selectedCategory || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [records]);

  const genderData = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((acc, row) => {
      const raw = (row as { gender?: string }).gender;
      const key = raw?.trim() || "Not Specified";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [records]);

  const ageDistributionData = useMemo(() => {
    const buckets: Record<string, number> = {
      "Under 18": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56-65": 0,
      "65+": 0,
      Unknown: 0
    };

    records.forEach((row) => {
      const rawAge = Number((row as { age?: string }).age);
      if (!Number.isFinite(rawAge) || rawAge <= 0) {
        buckets.Unknown += 1;
        return;
      }
      if (rawAge < 18) buckets["Under 18"] += 1;
      else if (rawAge <= 25) buckets["18-25"] += 1;
      else if (rawAge <= 35) buckets["26-35"] += 1;
      else if (rawAge <= 45) buckets["36-45"] += 1;
      else if (rawAge <= 55) buckets["46-55"] += 1;
      else if (rawAge <= 65) buckets["56-65"] += 1;
      else buckets["65+"] += 1;
    });

    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [records]);

  const topProceduresData = useMemo(() => {
    const counts = records.reduce<Record<string, number>>((acc, row) => {
      const key = row.reason || "Unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [records]);

  const todayCount = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return records.filter((r) => {
      const ts = r.submittedAt ? new Date(r.submittedAt).getTime() : 0;
      return ts >= start;
    }).length;
  }, [records]);

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  };

  const addCategory = () => {
    const name = newCategory.trim();
    if (!name) {
      return;
    }
    const exists = formOptions.reasons.some((r) => r.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      alert("Category already exists.");
      return;
    }
    setFormOptions((prev) => ({
      ...prev,
      reasons: [...prev.reasons, { name, items: [] }]
    }));
    setNewCategory("");
  };

  const removeCategory = (index: number) => {
    setFormOptions((prev) => ({
      ...prev,
      reasons: prev.reasons.filter((_, i) => i !== index)
    }));
  };

  const addReasonToCategory = (index: number, reason: string) => {
    const clean = reason.trim();
    if (!clean) {
      return;
    }
    setFormOptions((prev) => {
      const reasons = [...prev.reasons];
      const category = reasons[index];
      const exists = category.items.some((item) => item.toLowerCase() === clean.toLowerCase());
      if (!exists) {
        reasons[index] = { ...category, items: [...category.items, clean] };
      }
      return { ...prev, reasons };
    });
  };

  const removeReasonFromCategory = (categoryIndex: number, reasonIndex: number) => {
    setFormOptions((prev) => {
      const reasons = [...prev.reasons];
      reasons[categoryIndex] = {
        ...reasons[categoryIndex],
        items: reasons[categoryIndex].items.filter((_, i) => i !== reasonIndex)
      };
      return { ...prev, reasons };
    });
  };

  const addSource = () => {
    const source = newSource.trim();
    if (!source) {
      return;
    }
    const exists = formOptions.sources.some((s) => s.toLowerCase() === source.toLowerCase());
    if (exists) {
      alert("Source already exists.");
      return;
    }
    setFormOptions((prev) => ({ ...prev, sources: [...prev.sources, source] }));
    setNewSource("");
  };

  const removeSource = (index: number) => {
    setFormOptions((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index)
    }));
  };

  const saveSettings = async () => {
    setSavingOptions(true);
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formOptions)
      });
      if (res.ok) {
        alert("Form configuration saved.");
      } else {
        alert("Could not save settings right now.");
      }
    } catch {
      alert("Could not save settings right now.");
    } finally {
      setSavingOptions(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-md p-6">
        <div className="rounded bg-white p-6 shadow">
          <h1 className="mb-4 text-xl font-semibold">Dashboard Login</h1>
          <input
            className="mb-3 w-full rounded border p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            className="mb-4 w-full rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button className="w-full rounded bg-blue-600 p-2 text-white" onClick={login}>
            Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button className="rounded bg-slate-800 px-4 py-2 text-white" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Total Submissions</p>
          <p className="text-2xl font-bold">{records.length}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Today</p>
          <p className="text-2xl font-bold">{todayCount}</p>
        </div>
        <div className="rounded bg-white p-4 shadow">
          <p className="text-sm text-slate-500">Unique Mobile Numbers</p>
          <p className="text-2xl font-bold">{new Set(records.map((r) => r.mobileNumber)).size}</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <button
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "submissions" ? "bg-[#008080] text-white" : "bg-white text-slate-700"
          }`}
          onClick={() => setActiveTab("submissions")}
        >
          Submissions
        </button>
        <button
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "analytics" ? "bg-[#008080] text-white" : "bg-white text-slate-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`rounded px-4 py-2 text-sm font-medium ${
            activeTab === "settings" ? "bg-[#008080] text-white" : "bg-white text-slate-700"
          }`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button className="ml-auto rounded bg-slate-800 px-4 py-2 text-sm text-white" onClick={fetchRecords}>
          {loadingRecords ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {activeTab === "submissions" ? (
        <>
          <div className="mb-4">
            <input
              className="w-full rounded border bg-white p-2"
              placeholder="Search by name, mobile, age, gender, address, category or reason"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto rounded bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Visit</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Procedure</th>
                  <th className="p-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row._id} className="border-t">
                    <td className="p-3 whitespace-nowrap">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : "-"}
                    </td>
                    <td className="p-3">{row.fullName}</td>
                    <td className="p-3">{row.age ?? "-"}</td>
                    <td className="p-3">{row.gender ?? "-"}</td>
                    <td className="p-3">{row.mobileNumber}</td>
                    <td className="p-3">{row.address ?? "-"}</td>
                    <td className="p-3">{row.visitType ?? "-"}</td>
                    <td className="p-3">{row.selectedCategory ?? "-"}</td>
                    <td className="p-3">{row.reason ?? "-"}</td>
                    <td className="p-3">
                      {row.leadSource === "Other" && row.otherSourceDetails?.trim()
                        ? `Other (${row.otherSourceDetails.trim()})`
                        : (row.leadSource ?? row.otherSourceDetails ?? "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : activeTab === "analytics" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Visualizing patient trends and attribution</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded bg-white p-4 shadow">
              <h2 className="mb-3 font-semibold">Lead Sources</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="vertical" margin={{ left: 20, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#008080">
                      <LabelList dataKey="value" position="right" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded bg-white p-4 shadow">
              <h2 className="mb-3 font-semibold">First-Time vs Returning</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={visitTypeData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                      {visitTypeData.map((entry, index) => (
                        <Cell key={entry.name} fill={index % 2 === 0 ? "#14b8a6" : "#008080"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold">Gender Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                    {genderData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={["#008080", "#14b8a6", "#5eead4", "#99f6e4"][index % 4]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold">Age Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5a8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold">Category Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#008080" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h2 className="mb-3 font-semibold">Top Procedures</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProceduresData} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5a8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Form Configuration</h2>
            <p className="text-slate-500">Manage options for the patient check-in form</p>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Manage Visit Reasons (Categorized)</h3>
            <div className="mb-4 flex gap-2">
              <input
                className="w-full rounded border p-2"
                placeholder="Add new category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button className="rounded bg-[#008080] px-4 py-2 text-white" onClick={addCategory}>
                + Add Category
              </button>
            </div>

            <div className="space-y-4">
              {formOptions.reasons.map((category, categoryIndex) => (
                <CategoryCard
                  key={`${category.name}-${categoryIndex}`}
                  category={category}
                  onDeleteCategory={() => removeCategory(categoryIndex)}
                  onAddReason={(reason) => addReasonToCategory(categoryIndex, reason)}
                  onDeleteReason={(reasonIndex) => removeReasonFromCategory(categoryIndex, reasonIndex)}
                />
              ))}
            </div>
          </div>

          <div className="rounded bg-white p-4 shadow">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Manage Lead Sources</h3>
            <div className="mb-4 flex gap-2">
              <input
                className="w-full rounded border p-2"
                placeholder="Add new source..."
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
              />
              <button className="rounded bg-[#008080] px-4 py-2 text-white" onClick={addSource}>
                + Add Source
              </button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {formOptions.sources.map((source, index) => (
                <div key={`${source}-${index}`} className="flex items-center justify-between rounded border p-2">
                  <span>{source}</span>
                  <button
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                    onClick={() => removeSource(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="rounded bg-[#008080] px-5 py-2 font-medium text-white"
              onClick={saveSettings}
              disabled={savingOptions}
            >
              {savingOptions ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function CategoryCard({
  category,
  onDeleteCategory,
  onAddReason,
  onDeleteReason
}: {
  category: ReasonCategory;
  onDeleteCategory: () => void;
  onAddReason: (reason: string) => void;
  onDeleteReason: (reasonIndex: number) => void;
}) {
  const [newReason, setNewReason] = useState("");

  return (
    <div className="rounded border p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold">{category.name}</h4>
        <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-700" onClick={onDeleteCategory}>
          Delete Category
        </button>
      </div>
      <div className="mb-3 flex gap-2">
        <input
          className="w-full rounded border p-2"
          placeholder="+ Add reason to this category"
          value={newReason}
          onChange={(e) => setNewReason(e.target.value)}
        />
        <button
          className="rounded bg-slate-800 px-3 py-2 text-white"
          onClick={() => {
            onAddReason(newReason);
            setNewReason("");
          }}
        >
          Add
        </button>
      </div>

      <div className="space-y-2">
        {category.items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2">
            <span>{item}</span>
            <button className="rounded bg-red-100 px-2 py-1 text-xs text-red-700" onClick={() => onDeleteReason(index)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
