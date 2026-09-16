import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Modal } from "./Modal";

export function AdminAuthorizationDialog({ dialog, onSubmit, onCancel }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  if (!dialog) return null;
  const submit = (event) => {
    event.preventDefault();
    onSubmit(password);
    setPassword("");
  };
  return (
    <Modal open title="🔒 Admin Authorization Required" onClose={onCancel} width="sm">
      <form className="form" onSubmit={submit}>
        <p className="confirm-message">
          {dialog.operation === "security.disable"
            ? "Admin password is required to turn Operation Security off."
            : "Operation Security is enabled. Admin password is required for this operation."}
        </p>
        <label className="field">
          <span className="field-label">Admin password</span>
          <div className="settings-password-wrap">
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              required
            />
            <button
              type="button"
              className="settings-password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        {dialog.error && <p className="form-error">{dialog.error}</p>}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-block">OK</button>
        </div>
      </form>
    </Modal>
  );
}
