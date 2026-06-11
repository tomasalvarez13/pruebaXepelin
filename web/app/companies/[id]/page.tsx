"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { apiFetch } from "@/lib/api-client";
import { CompanyDetail } from "@/lib/types";
import {
  IconArrowLeft,
  IconCreditCard,
  IconChartBar,
  IconCoin,
  IconPercentage,
  IconAlertTriangle,
  IconShieldCheck,
  IconTarget,
  IconTrendingUp,
  IconMessageCircle,
  IconPhone,
  IconMail,
  IconUsers,
  IconSparkles,
} from "@tabler/icons-react";

const avatarColors = [
  "#4F46E5", "#0891B2", "#7C3AED", "#059669",
  "#D97706", "#DC2626", "#2563EB", "#9333EA",
  "#0D9488", "#C026D3",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPct(n: number | null): string {
  if (n === null) return "—";
  return `${Math.round(n * 100)}%`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysSince(d: string): number {
  return Math.floor((Date.now() - new Date(d).getTime()) / (24 * 60 * 60 * 1000));
}

const channelIcons: Record<string, React.ReactNode> = {
  WHATSAPP: <IconMessageCircle size={14} />,
  CALL: <IconPhone size={14} />,
  EMAIL: <IconMail size={14} />,
  MEETING: <IconUsers size={14} />,
};

const channelLabels: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  CALL: "Llamada",
  EMAIL: "Email",
  MEETING: "Reunión",
};

const lifecycleConfig: Record<string, string> = {
  ENROLADO: "badge-blue",
  ACTIVO: "badge-green",
  RECURRENTE: "badge-violet",
};

function buildVolumeChart(operations: CompanyDetail["operations"]): { month: string; volumen: number }[] {
  const monthMap = new Map<string, number>();
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleDateString("es-CL", { month: "short", year: "2-digit" });
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(sortKey + "|" + key, 0);
  }
  for (const op of operations) {
    if (op.type === "FACTORING" || op.type === "CONFIRMING") {
      const d = new Date(op.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const keys = Array.from(monthMap.keys());
      for (const k of keys) {
        if (k.startsWith(key + "|")) {
          monthMap.set(k, (monthMap.get(k) || 0) + op.amount);
        }
      }
    }
  }
  return Array.from(monthMap.entries()).map((entry) => ({
    month: entry[0].split("|")[1],
    volumen: entry[1],
  }));
}

function generateAISummary(company: CompanyDetail): string {
  const s = company.signals;

  if (s.churnRisk === "HIGH") {
    const reasons: string[] = [];
    if (s.daysSinceLastOp !== null && s.daysSinceLastOp > 30) reasons.push(`sin operaciones hace ${s.daysSinceLastOp} días`);
    if (s.volumeTrendPct < -0.2) reasons.push(`caída de volumen del ${Math.abs(Math.round(s.volumeTrendPct * 100))}%`);
    if (s.hasOverdue) reasons.push(`mora activa de ${formatCurrency(s.overdueAmount)}`);
    return `${company.legalName} presenta riesgo alto de churn${reasons.length ? ": " + reasons.join(", ") : ""}. Se recomienda contacto inmediato para evaluar la situación y ofrecer alternativas de retención. Priorizar una reunión esta semana.`;
  }

  if (s.expansion) {
    const reasons = s.expansionReasons;
    const growthNote = s.volumeTrendPct > 0.5
      ? `El volumen financiado creció ${Math.round(s.volumeTrendPct * 100)}% en los últimos 90 días`
      : `La empresa mantiene operaciones activas`;
    return `${company.legalName} presenta una oportunidad de expansión. ${growthNote} mientras mantiene riesgo ${s.churnRisk === "LOW" ? "bajo" : "medio"} y ${s.hasOverdue ? "mora controlada" : "cero mora"}. ${reasons.length ? `Señales: ${reasons.join(", ")}. ` : ""}Se recomienda contactar durante los próximos 7 días para evaluar aumento de línea o cross-sell.`;
  }

  if (s.churnRisk === "LOW") {
    return `${company.legalName} es una cuenta saludable con buen historial. Volumen estable, sin señales de riesgo. Mantener seguimiento regular y explorar oportunidades de profundización comercial.`;
  }

  return `${company.legalName} requiere monitoreo. Se recomienda mantener contacto periódico para asegurar retención y evaluar potencial de crecimiento.`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0F172A",
      color: "white",
      padding: "10px 14px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    }}>
      <div style={{ color: "#94A3B8", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div>{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

export default function CompanyDetailPage() {
  const { kam, token, status, logout } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [statusVal, setStatusVal] = useState("active");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<CompanyDetail>(`/companies/${id}`, token);
      setCompany(data);
      setNotes(data.notes || "");
      setStatusVal(data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando empresa");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompany();
    }
  }, [status, fetchCompany]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiFetch(`/companies/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify({ notes, status: statusVal }),
      });
      setSaveMsg("Guardado");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <nav className="nav-bar">
          <div className="nav-logo">
            <div className="nav-logo-icon">X</div>
            Xepelin CRM
          </div>
          <div className="nav-right">
            <span className="nav-user">{kam?.name}</span>
          </div>
        </nav>
        <div className="loading-container">
          <div className="spinner" />
        </div>
      </>
    );
  }

  if (error || !company) {
    return (
      <>
        <nav className="nav-bar">
          <div className="nav-logo">
            <div className="nav-logo-icon">X</div>
            Xepelin CRM
          </div>
        </nav>
        <div className="page-container">
          <div className="error-alert">{error || "Empresa no encontrada"}</div>
          <button className="detail-back" onClick={() => router.push("/")}>
            <IconArrowLeft size={16} /> Volver al listado
          </button>
        </div>
      </>
    );
  }

  const s = company.signals;
  const volumeData = buildVolumeChart(company.operations);
  const aiSummary = generateAISummary(company);

  return (
    <div className="animate-fade-in">
      {/* Nav */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <div className="nav-logo-icon">X</div>
          Xepelin CRM
        </div>
        <div className="nav-right">
          <span className="nav-user">{kam?.name}</span>
          <button className="nav-logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="page-container">
        {/* Back */}
        <button className="detail-back" onClick={() => router.push("/")}>
          <IconArrowLeft size={16} /> Volver al listado
        </button>

        {/* Hero */}
        <div className="detail-hero animate-slide-up">
          <div className="detail-hero-top">
            <div className="detail-hero-left">
              <div
                className="detail-avatar"
                style={{ background: getAvatarColor(company.legalName) }}
              >
                {company.legalName.charAt(0)}
              </div>
              <div>
                <div className="detail-title">{company.legalName}</div>
                <div className="detail-subtitle">
                  {company.taxId} · {company.industry} · {company.country}
                </div>
                <div className="detail-badges">
                  <span className={`badge ${lifecycleConfig[company.lifecycleStage] || "badge-gray"}`}>
                    {company.lifecycleStage}
                  </span>
                  <span className="badge badge-gray">{company.segment}</span>
                  <span className="badge badge-gray">
                    {daysSince(company.onboardedAt)} días como cliente
                  </span>
                  <span className={`badge ${s.priorityLabel === "ALTA" ? "badge-red" : s.priorityLabel === "MEDIA" ? "badge-yellow" : "badge-green"}`}>
                    Prioridad {s.priorityLabel.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="detail-actions">
              <select
                className="status-select"
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Copilot */}
        <div className="ai-card animate-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="ai-header">
            <div className="ai-icon">
              <IconSparkles size={16} />
            </div>
            <span className="ai-title">Análisis inteligente</span>
            <span className="ai-badge">Auto-generado</span>
          </div>
          <div className="ai-text">{aiSummary}</div>
        </div>

        {/* Metrics */}
        <div className="metrics-grid animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#4F46E5" }}>
              <IconCreditCard size={22} />
            </div>
            <div className="metric-label">Línea aprobada</div>
            <div className="metric-value">{formatCurrency(company.creditLineApproved)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#0891B2" }}>
              <IconChartBar size={22} />
            </div>
            <div className="metric-label">Línea usada</div>
            <div className="metric-value">{formatCurrency(company.creditLineUsed)}</div>
            <div className="metric-sub">{formatPct(s.lineUtilization)} utilización</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#15803D" }}>
              <IconTrendingUp size={22} />
            </div>
            <div className="metric-label">Volumen 90d</div>
            <div className="metric-value">{formatCurrency(s.financedVolume90d)}</div>
            <div className="metric-sub">
              <span style={{
                color: s.volumeTrendPct > 0.05 ? "#15803D" : s.volumeTrendPct < -0.05 ? "#DC2626" : "#64748B",
                fontWeight: 600,
              }}>
                {s.volumeTrendPct > 0 ? "↑" : s.volumeTrendPct < 0 ? "↓" : "→"} {Math.abs(Math.round(s.volumeTrendPct * 100))}%
              </span>
              {" "}vs periodo anterior
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#7C3AED" }}>
              <IconCoin size={22} />
            </div>
            <div className="metric-label">Profit estimado 90d</div>
            <div className="metric-value">{formatCurrency(s.estGrossProfit90d)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#D97706" }}>
              <IconPercentage size={22} />
            </div>
            <div className="metric-label">SOW</div>
            <div className="metric-value">{formatPct(s.sowPct)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: s.churnRisk === "HIGH" ? "#DC2626" : s.churnRisk === "MEDIUM" ? "#D97706" : "#15803D" }}>
              <IconShieldCheck size={22} />
            </div>
            <div className="metric-label">Riesgo churn</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span className={`badge ${s.churnRisk === "HIGH" ? "badge-red" : s.churnRisk === "MEDIUM" ? "badge-yellow" : "badge-green"}`}>
                {s.churnRisk === "HIGH" ? "Alto" : s.churnRisk === "MEDIUM" ? "Medio" : "Bajo"}
              </span>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: s.hasOverdue ? "#DC2626" : "#15803D" }}>
              <IconAlertTriangle size={22} />
            </div>
            <div className="metric-label">Mora</div>
            <div className="metric-value" style={{ color: s.hasOverdue ? "#DC2626" : undefined }}>
              {s.hasOverdue ? formatCurrency(s.overdueAmount) : "Sin mora"}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ color: "#4F46E5" }}>
              <IconTarget size={22} />
            </div>
            <div className="metric-label">Productos</div>
            <div className="metric-value">{s.productsUsed.length}</div>
            <div className="metric-sub">{s.productsUsed.join(", ")}</div>
          </div>
        </div>

        {/* Volume Chart */}
        <div className="chart-card animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="chart-title">Volumen financiado por mes</div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={volumeData}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="month"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94A3B8" }}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94A3B8" }}
                tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volumen"
                stroke="#4F46E5"
                strokeWidth={2.5}
                fill="url(#volumeGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#4F46E5", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Operations */}
        <div className="section-card animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="section-title">Historial de operaciones</div>
          {company.operations.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-text">Sin operaciones registradas</div>
            </div>
          ) : (
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Mora (días)</th>
                </tr>
              </thead>
              <tbody>
                {company.operations.map((op) => (
                  <tr key={op.id}>
                    <td>
                      <span className="badge badge-blue">{op.type}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(op.amount)}</td>
                    <td style={{ color: "#64748B" }}>{formatDate(op.date)}</td>
                    <td>
                      <span className={`badge ${op.status === "VENCIDA" ? "badge-red" : op.status === "PENDIENTE" ? "badge-yellow" : "badge-green"}`}>
                        {op.status}
                      </span>
                    </td>
                    <td>
                      {op.daysPastDue > 0 ? (
                        <span style={{ color: "#DC2626", fontWeight: 600 }}>{op.daysPastDue}</span>
                      ) : (
                        <span style={{ color: "#94A3B8" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Timeline */}
        <div className="section-card animate-slide-up" style={{ animationDelay: "250ms" }}>
          <div className="section-title">Timeline de interacciones</div>
          {company.interactions.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-text">Sin interacciones registradas</div>
            </div>
          ) : (
            <div>
              {company.interactions.map((inter) => (
                <div key={inter.id} className="timeline-item">
                  <div className="timeline-dot">
                    {channelIcons[inter.channel] || <IconMessageCircle size={14} />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-channel">
                      {channelLabels[inter.channel] || inter.channel}
                    </div>
                    <div className="timeline-date">{formatDate(inter.date)}</div>
                    <div className="timeline-summary">{inter.summary}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="section-card animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="section-title">Notas</div>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Agregar notas sobre esta empresa..."
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {saveMsg && (
              <span className={`save-msg ${saveMsg === "Guardado" ? "success" : "error"}`}>
                {saveMsg === "Guardado" ? "✓" : "✕"} {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
