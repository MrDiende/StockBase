import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function Auth({ supabase }) {
  const strongPasswordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%]).{12,}$/;
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (mode === "sign-up" && !strongPasswordPattern.test(password)) {
      setMessage("Password must be at least 12 characters and include uppercase, lowercase, number, and one of ! @ # $ %.");
      return;
    }
    if (mode === "sign-up" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
      : await supabase.auth.signUp({ email: normalizedEmail, password });
    setBusy(false);
    if (result.error) {
      const duplicateEmail = mode === "sign-up" && (
        result.error.code === "user_already_exists"
        || result.error.message.toLowerCase().includes("already registered")
        || result.error.message.toLowerCase().includes("already exists")
      );
      if (duplicateEmail) {
        setMessage("An account with this email already exists. Sign in instead.");
        setMode("sign-in");
      } else {
        setMessage(result.error.message);
      }
    } else if (mode === "sign-up" && result.data.user?.identities?.length === 0) {
      setMessage("An account with this email already exists. Sign in instead.");
      setMode("sign-in");
    } else if (mode === "sign-up") {
      setMessage("Account created. Check your email to confirm your account, then sign in.");
      setMode("sign-in");
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
              <span className="auth-form-kicker">{mode === "sign-in" ? "WELCOME BACK" : "GET STARTED"}</span>
              <h2>{mode === "sign-in" ? "Sign in to your account" : "Create your account"}</h2>
              <p>{mode === "sign-in" ? "Enter your details to continue." : "Start managing your inventory today."}</p>
            </div>
            <form className="auth-form" onSubmit={submit}>
              <div className="auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input id="auth-email" className="auth-input" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="auth-password">Password</label>
                  {mode === "sign-in" ? (
                    <span className="auth-hint">Your account password</span>
                  ) : (
                    <span className="auth-hint">12+ chars · A-Z · a-z · 0-9 · ! @ # $ %</span>
                  )}
                </div>
                <div className="auth-password-wrap">
                  <input id="auth-password" className="auth-input" type={showPassword ? "text" : "password"} placeholder="Enter your password" minLength={mode === "sign-up" ? 12 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {mode === "sign-up" && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">Confirm password</label>
                  <div className="auth-password-wrap">
                    <input id="auth-confirm-password" className="auth-input" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter your password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              {message && <p className="auth-message">{message}</p>}
              <button className="auth-submit" disabled={busy}>
                {busy ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </form>
            <p className="auth-switch-text">
              {mode === "sign-in" ? "New to StockBase?" : "Already have an account?"}
              <button onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setMessage(""); }}>
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
          <p className="auth-footer">© 2026 StockBase · Built for better inventory decisions</p>
        </div>
      </section>
    </main>
  );
}
