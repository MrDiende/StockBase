import { useState } from "react";
import { Modal } from "./Modal";

export function AdminAuthorizationDialog({ dialog, onSubmit, onCancel }) {
  const [password, setPassword] = useState("");
  if (!dialog) return null;
  const submit = (event) => {
    event.preventDefault();
    onSubmit(password);
    setPassword("");
  };
  return (
    <Modal open title="🔒 Admin Authorization Required" onClose={onCancel} width="sm">
      <form className="form" onSubmit={submit}>
        <p className="confirm-message">Operation Security is enabled.<br />Admin password is required for this operation.</p>
        <label className="field">
          <span className="field-label">Admin password</span>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required />
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
