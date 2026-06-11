"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { IconLock, IconMail } from "@tabler/icons-react";

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === "authenticated") {
    router.replace("/");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        margin: "0 16px",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56,
            background: "#4F46E5",
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 16,
          }}>X</div>
          <h1 style={{
            fontSize: 28, fontWeight: 700,
            color: "#0F172A", letterSpacing: -0.5,
            margin: 0,
          }}>Xepelin CRM</h1>
          <p style={{
            fontSize: 15, color: "#64748B",
            marginTop: 8,
          }}>Gestión inteligente de cartera</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} style={{
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{
            fontSize: 20, fontWeight: 600,
            color: "#0F172A", margin: "0 0 24px",
          }}>Iniciar sesión</h2>

          {error && (
            <div style={{
              background: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: 10,
              padding: "10px 14px",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
            }}>{error}</div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 13,
              fontWeight: 500, color: "#374151",
              marginBottom: 6,
            }}>Email</label>
            <div style={{ position: "relative" }}>
              <IconMail size={18} style={{
                position: "absolute", left: 14, top: 13,
                color: "#94A3B8",
              }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@xepelin.com"
                required
                style={{
                  width: "100%",
                  height: 44,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "0 14px 0 42px",
                  fontSize: 14,
                  color: "#0F172A",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 200ms",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4F46E5";
                  e.target.style.boxShadow = "0 0 0 3px #EEF2FF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 13,
              fontWeight: 500, color: "#374151",
              marginBottom: 6,
            }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <IconLock size={18} style={{
                position: "absolute", left: 14, top: 13,
                color: "#94A3B8",
              }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                style={{
                  width: "100%",
                  height: 44,
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "0 14px 0 42px",
                  fontSize: 14,
                  color: "#0F172A",
                  fontFamily: "'Inter', sans-serif",
                  transition: "all 200ms",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#4F46E5";
                  e.target.style.boxShadow = "0 0 0 3px #EEF2FF";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 44,
              background: loading ? "#818CF8" : "#4F46E5",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 200ms",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {/* Demo credentials */}
          <div style={{
            marginTop: 24,
            padding: "16px",
            background: "#F8FAFC",
            borderRadius: 10,
            border: "1px solid #E2E8F0",
          }}>
            <p style={{
              fontSize: 12, fontWeight: 600,
              color: "#64748B", margin: "0 0 8px",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>Cuentas de demo</p>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
              <div><strong>María:</strong> maria@xepelin.com / maria123</div>
              <div><strong>Carlos:</strong> carlos@xepelin.com / carlos123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
