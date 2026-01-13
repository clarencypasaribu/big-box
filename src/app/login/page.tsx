"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Nunito_Sans } from "next/font/google";
import { createSupabaseBrowserClient } from "../../../utils/supabase-browser";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setMsg(error.message);

    router.push("/dashboard");
  }

  async function onForgotPassword() {
    setMsg(null);
    if (!email) return setMsg("Isi email dulu ya.");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    setMsg("Link reset password sudah dikirim (kalau email terdaftar).");
  }

  return (
    <div style={styles.bg} className={nunito.className}>
      <div style={styles.shell}>
        <div style={styles.logoRow}>
          <div style={styles.logoMark}>
            <span style={styles.logoDot} />
            <span style={styles.logoDotSmall} />
          </div>
          <div style={styles.logoText}>LOGO</div>
        </div>

        <div style={styles.grid}>
          {/* LEFT */}
          <div style={styles.left}>
            <h1 style={styles.h1}>Login</h1>
            <p style={styles.sub}>Login to access your accounts</p>

            <form onSubmit={onLogin} style={styles.form}>
              <div>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@gmail.com"
                  type="email"
                  required
                />
              </div>

              <div>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <input
                    style={{ ...styles.input, paddingRight: 46 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    type={showPw ? "text" : "password"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={styles.eyeBtn}
                    aria-label="toggle password"
                  >
                    {showPw ? (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={styles.rowBetween}>
                <label style={styles.rememberRow}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span style={{ marginLeft: 8, fontSize: 13, color: "#4b5563" }}>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={onForgotPassword}
                  disabled={loading}
                  style={styles.forgot}
                >
                  Forgot Password
                </button>
              </div>

              {msg && <div style={styles.msg}>{msg}</div>}

              <button type="submit" disabled={loading} style={styles.primary}>
                {loading ? "Loading..." : "Login"}
              </button>

              <div style={styles.signupRow}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>
                  Don&apos;t have an account?
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  style={styles.signupLink}
                >
                  Sign up
                </button>
              </div>

              <div style={styles.dividerRow}>
                <div style={styles.line} />
                <span style={styles.or}>Or login with</span>
                <div style={styles.line} />
              </div>

              <div style={styles.socialRow}>
                <button type="button" style={styles.socialBtn}>f</button>
                <button type="button" style={styles.socialBtn}>G</button>
                <button type="button" style={styles.socialBtn}>A</button>
              </div>
            </form>
          </div>

          {/* RIGHT */}
          <div style={styles.right}>
            <div style={styles.illusCard}>
              {/* Ganti src ini dengan gambar kamu di /public */}
              <Image
                src="/login-illus.svg"
                alt="illustration"
                width={800}
                height={800}
                style={{ width: "80%", height: "auto" }}
                priority
              />
              <div style={styles.dots}>
                <span style={styles.dotActive} />
                <span style={styles.dot} />
                <span style={styles.dot} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #ffffff 0%, #f7f8fc 100%)",
    padding: "28px 22px 40px",
  },
  shell: {
    width: "min(1200px, 100%)",
    margin: "0 auto",
  },
  logoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 36 },
  logoMark: { position: "relative", width: 24, height: 24 },
  logoDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 999,
    background: "#5a55ff",
    left: 0,
    top: 2,
  },
  logoDotSmall: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 999,
    background: "#b1b8ff",
    right: 0,
    top: 0,
  },
  logoText: { fontWeight: 800, letterSpacing: 0.6, fontSize: 18 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 40,
    alignItems: "stretch",
  },
  left: { padding: "18px 8px 10px 6px", maxWidth: 480 },
  right: { display: "grid", placeItems: "center" },

  h1: { fontSize: 34, margin: 0, fontWeight: 800, color: "#111827" },
  sub: { margin: "6px 0 26px", color: "#6b7280", fontSize: 13.5 },
  form: { display: "grid", gap: 16, maxWidth: 420 },

  label: { display: "block", fontSize: 13, color: "#4b5563", marginBottom: 6 },
  input: {
    width: "100%",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    padding: "12px 14px",
    outline: "none",
    fontSize: 14,
    background: "#fff",
    boxShadow: "0 1px 0 rgba(0,0,0,.02)",
  },
  inputWrap: { position: "relative", width: "100%" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 8,
    height: 34,
    width: 34,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    color: "#6b7280",
  },
  rowBetween: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  rememberRow: { display: "flex", alignItems: "center", gap: 6 },

  forgot: { border: "none", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 },

  msg: { background: "#f3f4f6", border: "1px solid #e5e7eb", padding: 10, borderRadius: 10, fontSize: 13 },

  primary: {
    marginTop: 4,
    width: "100%",
    border: "none",
    borderRadius: 8,
    padding: "12px 14px",
    background: "#5866ff",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(88,102,255,.25)",
  },

  signupRow: { display: "flex", justifyContent: "center", gap: 6, marginTop: 10 },
  signupLink: {
    border: "none",
    background: "transparent",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },

  dividerRow: { display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center", marginTop: 16 },
  line: { height: 1, background: "#e5e7eb" },
  or: { fontSize: 12, color: "#9ca3af" },

  socialRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 },
  socialBtn: {
    height: 46,
    borderRadius: 10,
    border: "1px solid #c7d2fe",
    background: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },

  illusCard: {
    width: "100%",
    height: "100%",
    minHeight: 520,
    borderRadius: 22,
    background: "#f3f4f6",
    border: "1px solid #eef2f7",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: 24,
  },
  dots: { position: "absolute", bottom: 18, display: "flex", gap: 8 },
  dotActive: { width: 26, height: 8, borderRadius: 99, background: "#5866ff" },
  dot: { width: 8, height: 8, borderRadius: 99, background: "#d1d5db" },
};
