"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api-client";
import { CompanyListItem } from "@/lib/types";
import {
  formatCurrency,
  formatCurrencyFull,
  formatPct,
  getAvatarColor,
  LIFECYCLE_BADGES,
} from "@/lib/format";
import {
  IconBuildingBank,
  IconTrendingUp,
  IconAlertTriangle,
  IconRocket,
  IconChevronRight,
} from "@tabler/icons-react";

const PRIORITY_CONFIG: Record<string, { class: string; label: string }> = {
  ALTA: { class: "badge-red", label: "Alta" },
  MEDIA: { class: "badge-yellow", label: "Media" },
  BAJA: { class: "badge-green", label: "Baja" },
};

const RISK_CONFIG: Record<string, { dotClass: string; label: string }> = {
  HIGH: { dotClass: "red", label: "Alto" },
  MEDIUM: { dotClass: "yellow", label: "Medio" },
  LOW: { dotClass: "green", label: "Bajo" },
};

// Churn shown in the list: AI value once enriched, deterministic signal as
// fallback. Keeps the list consistent with the company detail view.
function effectiveChurn(c: CompanyListItem): "LOW" | "MEDIUM" | "HIGH" {
  return c.churnRisk ?? c.signals.churnRisk;
}

export default function HomePage() {
  const { kam, token, status, logout } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("priority");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (sort !== "priority") params.set("sort", sort);
      if (filter !== "all")
        params.set("filter", filter === "risk" ? "at_risk" : "expansion");
      const qs = params.toString();
      const data = await apiFetch<CompanyListItem[]>(
        `/companies${qs ? `?${qs}` : ""}`,
        token,
      );
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando empresas");
    } finally {
      setLoading(false);
    }
  }, [sort, filter, token]);

  useEffect(() => {
    if (status === "authenticated") fetchCompanies();
  }, [status, fetchCompanies]);

  const kpis = useMemo(() => {
    const total = companies.length;
    const totalVolume = companies.reduce((s, c) => s + c.signals.financedVolume90d, 0);
    const atRisk = companies.filter((c) => effectiveChurn(c) === "HIGH").length;
    const expansion = companies.filter((c) => c.signals.expansion).length;
    return { total, totalVolume, atRisk, expansion };
  }, [companies]);

  if (status === "loading") {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="animate-fade-in">
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
        <h1 className="page-title">Mi Cartera</h1>

        {!loading && companies.length > 0 && (
          <div className="kpi-grid animate-slide-up">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
                <IconBuildingBank size={20} />
              </div>
              <div className="kpi-label">Total empresas</div>
              <div className="kpi-value">{kpis.total}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: "#DCFCE7", color: "#15803D" }}>
                <IconTrendingUp size={20} />
              </div>
              <div className="kpi-label">Volumen financiado 90d</div>
              <div className="kpi-value">{formatCurrency(kpis.totalVolume)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                <IconAlertTriangle size={20} />
              </div>
              <div className="kpi-label">En riesgo</div>
              <div className="kpi-value">{kpis.atRisk}</div>
              {kpis.atRisk > 0 && (
                <span className="kpi-change negative">Requieren atención</span>
              )}
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: "#EDE9FE", color: "#7C3AED" }}>
                <IconRocket size={20} />
              </div>
              <div className="kpi-label">Oportunidades</div>
              <div className="kpi-value">{kpis.expansion}</div>
              {kpis.expansion > 0 && (
                <span className="kpi-change positive">Expansión posible</span>
              )}
            </div>
          </div>
        )}

        <div className="filter-bar">
          <div className="filter-tabs">
            {[
              { value: "all", label: "Todos" },
              { value: "risk", label: "En riesgo" },
              { value: "expansion", label: "Oportunidad" },
            ].map((tab) => (
              <button
                key={tab.value}
                className={`filter-tab ${filter === tab.value ? "active" : ""}`}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="priority">Prioridad</option>
            <option value="risk">Riesgo</option>
            <option value="volume">Volumen</option>
          </select>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">
              No hay empresas con los filtros seleccionados
            </div>
          </div>
        ) : (
          <div className="company-table animate-slide-up">
            <div className="company-table-header">
              <span>Empresa</span>
              <span>País</span>
              <span>Lifecycle</span>
              <span>Prioridad</span>
              <span>Vol. 90d</span>
              <span>SOW</span>
              <span>Riesgo</span>
              <span>Contacto</span>
            </div>
            {companies.map((c, i) => (
              <div
                key={c.id}
                className="company-row"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => router.push(`/companies/${c.id}`)}
              >
                <div className="company-info">
                  <div
                    className="company-avatar"
                    style={{ background: getAvatarColor(c.legalName) }}
                  >
                    {c.legalName.charAt(0)}
                  </div>
                  <div>
                    <div className="company-name">{c.legalName}</div>
                    <div className="company-industry">{c.industry}</div>
                  </div>
                </div>

                <div>
                  <span className="badge badge-gray">{c.country}</span>
                </div>

                <div>
                  <span className={`badge ${LIFECYCLE_BADGES[c.lifecycleStage] || "badge-gray"}`}>
                    {c.lifecycleStage}
                  </span>
                </div>

                <div>
                  <span className={`badge ${PRIORITY_CONFIG[c.signals.priorityLabel]?.class || "badge-gray"}`}>
                    {PRIORITY_CONFIG[c.signals.priorityLabel]?.label || c.signals.priorityLabel}
                  </span>
                </div>

                <div>
                  <div className="cell-value">
                    {formatCurrencyFull(c.signals.financedVolume90d)}
                  </div>
                  <span className={`cell-trend ${c.signals.volumeTrendPct > 0.05 ? "up" : c.signals.volumeTrendPct < -0.05 ? "down" : "flat"}`}>
                    {c.signals.volumeTrendPct > 0.05
                      ? `↑ ${Math.round(c.signals.volumeTrendPct * 100)}%`
                      : c.signals.volumeTrendPct < -0.05
                        ? `↓ ${Math.abs(Math.round(c.signals.volumeTrendPct * 100))}%`
                        : `→ ${Math.round(c.signals.volumeTrendPct * 100)}%`}
                  </span>
                </div>

                <div className="cell-secondary">{formatPct(c.signals.sowPct)}</div>

                <div>
                  <span className="badge badge-gray" style={{ gap: 6 }}>
                    <span className={`badge-dot ${RISK_CONFIG[effectiveChurn(c)]?.dotClass}`} />
                    {RISK_CONFIG[effectiveChurn(c)]?.label || effectiveChurn(c)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="cell-secondary">
                    {c.daysSinceLastInteraction !== null
                      ? `${c.daysSinceLastInteraction}d`
                      : "—"}
                  </span>
                  <IconChevronRight size={16} color="#CBD5E1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
