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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("Web Developer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"project_manager" | "team_member" | null>(null);

  function onRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      window.alert("Password dan konfirmasi password tidak sama.");
      return;
    }
    if (!agreed) {
      window.alert("Silakan setujui Terms dan Privacy Policies.");
      return;
    }
    setShowRoleModal(true);
  }

  async function onChooseRole(role: "project_manager" | "team_member") {
    setSelectedRole(role);
    setLoading(true);
    const fullName = `${firstName} ${lastName}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone,
          position,
          role,
        },
      },
    });
    setLoading(false);
    if (error) {
      window.alert(error.message);
      return;
    }
    if (data.user?.id) {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.user.id,
          email,
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone,
          position,
          role,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        window.alert(payload.error || "Gagal menyimpan profil.");
        return;
      }
    }
    window.alert("Akun berhasil dibuat, silakan login.");
    router.push("/login");
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
            <div style={styles.illusCard}>
              <Image
                src="/register-illus.svg"
                alt="register illustration"
                width={560}
                height={560}
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

          {/* RIGHT */}
          <div style={styles.right}>
            <h1 style={styles.h1}>Register</h1>
            <p style={styles.sub}>Let&apos;s get you all set up so you can access your personal account.</p>

            <form onSubmit={onRegister} style={styles.form}>
              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>First Name</label>
                  <input
                    style={styles.input}
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={styles.label}>Last Name</label>
                  <input
                    style={styles.input}
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>Email</label>
                  <input
                    style={styles.input}
                    type="email"
                    placeholder="john.doe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={styles.label}>Phone Number</label>
                  <input
                    style={styles.input}
                    type="tel"
                    placeholder="+62 812 3456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Position</label>
                <select
                  style={{ ...styles.input, ...styles.select }}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <option>Web Developer</option>
                  <option>Designer</option>
                  <option>Product Manager</option>
                  <option>Marketing</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <input
                    style={{ ...styles.input, paddingRight: 46 }}
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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

              <div>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.inputWrap}>
                  <input
                    style={{ ...styles.input, paddingRight: 46 }}
                    type={showConfirmPw ? "text" : "password"}
                    placeholder="••••••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((v) => !v)}
                    style={styles.eyeBtn}
                    aria-label="toggle confirm password"
                  >
                    {showConfirmPw ? (
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

              <label style={styles.agreeRow}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                <span style={styles.agreeText}>
                  I agree to all the <span style={styles.link}>Terms</span> and{" "}
                  <span style={styles.link}>Privacy Policies</span>
                </span>
              </label>

              <button type="submit" disabled={!agreed || loading} style={styles.primary}>
                {loading ? "Creating..." : "Create account"}
              </button>

              <div style={styles.signupRow}>
                <span style={{ color: "#6b7280", fontSize: 13 }}>Already have an account?</span>
                <button type="button" onClick={() => router.push("/login")} style={styles.signupLink}>
                  Login
                </button>
              </div>

              <div style={styles.dividerRow}>
                <div style={styles.line} />
                <span style={styles.or}>Or Sign up with</span>
                <div style={styles.line} />
              </div>

              <div style={styles.socialRow}>
                <button type="button" style={styles.socialBtn}>f</button>
                <button type="button" style={styles.socialBtn}>G</button>
                <button type="button" style={styles.socialBtn}>A</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {showRoleModal && (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true">
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Choose Your Role</h2>
            <div style={styles.roleGrid}>
              <button
                type="button"
                style={{
                  ...styles.roleCard,
                  ...(selectedRole === "project_manager" ? styles.roleCardActive : null),
                }}
                onClick={() => onChooseRole("project_manager")}
                disabled={loading}
              >
                <div style={styles.roleIcon}>
                  <div style={styles.roleHead} />
                  <div style={styles.roleBody} />
                </div>
                <div style={styles.roleBtn}>AS PROJECT MANAGER</div>
              </button>
              <button
                type="button"
                style={{
                  ...styles.roleCard,
                  ...(selectedRole === "team_member" ? styles.roleCardActive : null),
                }}
                onClick={() => onChooseRole("team_member")}
                disabled={loading}
              >
                <div style={styles.roleIcon}>
                  <div style={styles.roleHead} />
                  <div style={styles.roleBody} />
                </div>
                <div style={styles.roleBtn}>AS TEAM MEMBER</div>
              </button>
            </div>
            <p style={styles.modalHint}>You must choose one role to continue.</p>
          </div>
        </div>
      )}
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
  left: { display: "grid", maxWidth: 520 },
  right: { padding: "12px 6px 10px 10px" },

  h1: { fontSize: 34, margin: 0, fontWeight: 800, color: "#111827" },
  sub: { margin: "6px 0 22px", color: "#6b7280", fontSize: 13.5 },

  form: { display: "grid", gap: 14, maxWidth: 520 },
  twoCol: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  label: { display: "block", fontSize: 13, color: "#4b5563", marginBottom: 6 },
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    padding: "12px 14px",
    minHeight: 44,
    outline: "none",
    fontSize: 14,
    background: "#fff",
    boxShadow: "0 1px 0 rgba(0,0,0,.02)",
  },
  inputWrap: { position: "relative", width: "100%" },
  select: {
    appearance: "none",
    background:
      "linear-gradient(45deg, transparent 50%, #6b7280 50%), linear-gradient(135deg, #6b7280 50%, transparent 50%), linear-gradient(to right, #fff, #fff)",
    backgroundPosition: "calc(100% - 20px) 50%, calc(100% - 14px) 50%, 0 0",
    backgroundSize: "6px 6px, 6px 6px, 100% 100%",
    backgroundRepeat: "no-repeat",
    paddingRight: 42,
  },
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

  agreeRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#6b7280" },
  agreeText: { lineHeight: 1.4 },
  link: { color: "#ef4444", fontWeight: 600, cursor: "pointer" },

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
    minHeight: 560,
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

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.45)",
    display: "grid",
    placeItems: "center",
    padding: 20,
    zIndex: 50,
  },
  modalCard: {
    width: "min(760px, 92vw)",
    borderRadius: 24,
    background: "#ffffff",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
    padding: "28px 26px 30px",
    textAlign: "center",
  },
  modalTitle: {
    margin: "4px 0 22px",
    fontSize: 28,
    fontWeight: 800,
    color: "#111827",
  },
  roleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 18,
    justifyItems: "center",
  },
  roleCard: {
    width: "100%",
    border: "none",
    borderRadius: 16,
    background: "#e6e9ff",
    padding: "18px 16px 16px",
    display: "grid",
    gap: 14,
    placeItems: "center",
    cursor: "pointer",
  },
  roleCardActive: {
    background: "#d8dcff",
    boxShadow: "0 10px 24px rgba(88,102,255,0.25)",
  },
  roleIcon: {
    width: 70,
    height: 70,
    display: "grid",
    placeItems: "center",
  },
  roleHead: {
    width: 18,
    height: 18,
    border: "3px solid #111827",
    borderRadius: 999,
  },
  roleBody: {
    width: 42,
    height: 18,
    border: "3px solid #111827",
    borderRadius: 999,
    marginTop: 6,
  },
  roleBtn: {
    background: "#111827",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
    borderRadius: 8,
    padding: "8px 10px",
  },
  modalHint: {
    marginTop: 18,
    fontSize: 12,
    color: "#6b7280",
  },
};
