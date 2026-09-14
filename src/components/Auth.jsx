import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Auth({ supabase }) {
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: window.location.origin,
    });
    setBusy(false);
    setMessage(error
      ? error.message
      : "If an account exists for this email, a password reset link has been sent.");
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const result = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <div className="auth-visual">
          <div className="auth-brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            <span>StockBase</span>
          </div>
          <div className="auth-visual-copy">
            <span className="auth-eyebrow">INVENTORY, SIMPLIFIED</span>
            <h1>Know your stock.<br /><em>Grow your business.</em></h1>
            <p>One clean workspace for products, stock movements, and every category you manage.</p>
          </div>
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-mobile-brand">
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
              <span>StockBase</span>
            </div>
            <div className="auth-heading">
              <span className="auth-form-kicker">{mode === "forgot-password" ? "ACCOUNT RECOVERY" : "WELCOME ADMIN"}</span>
              <h2>{mode === "forgot-password" ? "Reset your password" : "Sign in to StockBase"}</h2>
              <p>{mode === "forgot-password" ? "Enter your email to receive a reset link." : "Enter your admin credentials to continue."}</p>
            </div>
            <form className="auth-form" onSubmit={mode === "forgot-password" ? requestPasswordReset : submit}>
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" className="auth-input" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              {mode !== "forgot-password" && <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="auth-password">Password</label>
                  <span className="auth-hint">Your admin password</span>
                  </div>
                <div className="auth-password-wrap">
                  <input id="auth-password" className="auth-input" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>}
              {message && <p className="auth-message">{message}</p>}
              <button className="auth-submit" disabled={busy}>
                {busy ? "Please wait..." : mode === "forgot-password" ? "Send reset link" : "Sign in"}
              </button>
            </form>
            {mode === "forgot-password" ? (
              <p className="auth-switch-text">
                Remember your password?
                <button type="button" onClick={() => { setMode("sign-in"); setMessage(""); }}>
                  Sign in
                </button>
              </p>
            ) : (
              <p className="auth-switch-text">Admin access only</p>
            )}
            {mode === "sign-in" && (
              <button className="auth-forgot-password" type="button" onClick={() => { setMode("forgot-password"); setMessage(""); }}>
                Forgot password?
              </button>
            )}
          </div>
          <p className="auth-footer">© 2026 StockBase · Built for better inventory decisions</p>
        </div>
      </section>
    </main>
  );
}
