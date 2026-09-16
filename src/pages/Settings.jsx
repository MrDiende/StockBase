import { Eye, EyeOff, LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";

const initialProfile = {
  fullName: "",
  address: "",
  contactNumber: "",
};

export function Settings({ supabase, user, passwordRecovery = false, onRecoveryComplete, operationSecurity }) {
  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [editingProfile, setEditingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      const { data, error: loadError } = await supabase
        .from("profiles")
        .select("full_name, address, contact_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!active) return;
      if (loadError) {
        setError(loadError.message);
      } else if (data) {
        const loadedProfile = {
          fullName: data.full_name,
          address: data.address,
          contactNumber: data.contact_number,
        };
        setProfile(loadedProfile);
        setSavedProfile(loadedProfile);
      }
      setLoading(false);
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [supabase, user.id]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setError("");
    const { error: saveError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: profile.fullName.trim(),
      address: profile.address.trim(),
      contact_number: profile.contactNumber.trim(),
      updated_at: new Date().toISOString(),
    });
    setSavingProfile(false);
    if (saveError) {
      setError(saveError.message);
    } else {
      const nextProfile = {
        fullName: profile.fullName.trim(),
        address: profile.address.trim(),
        contactNumber: profile.contactNumber.trim(),
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setEditingProfile(false);
      setMessage("Profile information saved.");
    }
  };

  const cancelProfileEdit = () => {
    setProfile(savedProfile);
    setEditingProfile(false);
    setError("");
  };

  const toggleOperationSecurity = async () => {
    setError("");
    setMessage("");
    setSavingSecurity(true);
    try {
      const grant = operationSecurity.enabled
        ? null
        : await operationSecurity.authorize("security.enable", true);
      if (!operationSecurity.enabled && !grant) return;
      await operationSecurity.setSecurity(!operationSecurity.enabled, grant);
      setMessage(`Operation Security is now ${!operationSecurity.enabled ? "ON" : "OFF"}.`);
    } catch (toggleError) {
      setError(toggleError.message);
    } finally {
      setSavingSecurity(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setChangingPassword(true);
    const verification = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verification.error) {
      setChangingPassword(false);
      setError("Current password is incorrect.");
      return;
    }
    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (passwordError) {
      setError(passwordError.message);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onRecoveryComplete?.();
      setMessage("Password changed successfully.");
    }
  };

  return (
    <div className="stack settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile information and account security.</p>
        </div>
      </div>
      {loading ? (
        <div className="card">Loading settings...</div>
      ) : (
        <div className="settings-grid">
          <div className="card form">
            <div>
              <h2 className="card-title">Operation Security</h2>
              <p className="card-subtitle">Require admin authorization for inventory changes.</p>
            </div>
            <button
              className={`operation-security-control ${operationSecurity.enabled ? "operation-security-control-on" : ""}`}
              type="button"
              onClick={toggleOperationSecurity}
              disabled={savingSecurity || operationSecurity.loading}
              aria-pressed={operationSecurity.enabled}
            >
              <span className="operation-security-status">
                {operationSecurity.enabled ? <LockKeyhole size={18} /> : <UnlockKeyhole size={18} />}
                <span>
                  <strong>{operationSecurity.enabled ? "Security ON" : "Security OFF"}</strong>
                  <small>{operationSecurity.enabled ? "Authorization required for changes" : "Changes are allowed without authorization"}</small>
                </span>
              </span>
              <span className="operation-security-switch" aria-hidden="true">
                <span className="operation-security-switch-thumb" />
              </span>
            </button>
          </div>
          <form className="card form" onSubmit={updateProfile}>
            <div className="settings-card-heading">
              <div>
              <h2 className="card-title">Profile information</h2>
              <p className="card-subtitle">This information is stored securely in your account.</p>
              </div>
              {!editingProfile && (
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setEditingProfile(true)}>
                  Edit
                </button>
              )}
            </div>
            {editingProfile ? (
              <>
                <label className="field">
                  <span className="field-label">Full Name</span>
                  <input className="input" value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} maxLength={120} />
                </label>
                <label className="field">
                  <span className="field-label">Address</span>
                  <textarea className="input settings-textarea" value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} maxLength={500} rows={4} />
                </label>
                <label className="field">
                  <span className="field-label">Contact Number</span>
                  <input className="input" type="tel" value={profile.contactNumber} onChange={(event) => setProfile({ ...profile, contactNumber: event.target.value })} maxLength={40} />
                </label>
                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save profile"}
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={cancelProfileEdit} disabled={savingProfile}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <dl className="settings-profile-details">
                <div>
                  <dt>Full Name</dt>
                  <dd>{profile.fullName || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{profile.address || "Not provided"}</dd>
                </div>
                <div>
                  <dt>Contact Number</dt>
                  <dd>{profile.contactNumber || "Not provided"}</dd>
                </div>
              </dl>
            )}
          </form>

          <div className="settings-password-column">
            <form className="card form settings-password-form" onSubmit={changePassword}>
              <div>
                <h2 className="card-title">Change password</h2>
                <p className="card-subtitle">Verify your current password before setting a new one.</p>
              </div>
              <label className="field">
                <span className="field-label">Current Password</span>
                <div className="settings-password-wrap">
                  <input className="input" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                  <button className="settings-password-toggle" type="button" onClick={() => setShowCurrentPassword((visible) => !visible)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="field">
                <span className="field-label">New Password</span>
                <div className="settings-password-wrap">
                  <input className="input" type={showNewPassword ? "text" : "password"} minLength={12} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                  <button className="settings-password-toggle" type="button" onClick={() => setShowNewPassword((visible) => !visible)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <label className="field">
                <span className="field-label">Confirm New Password</span>
                <div className="settings-password-wrap">
                  <input className="input" type={showConfirmPassword ? "text" : "password"} minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
                  <button className="settings-password-toggle" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              <button className="btn btn-primary settings-password-button" type="submit" disabled={changingPassword}>
                {changingPassword ? "Changing..." : "Change password"}
              </button>
            </form>
            <div className="card settings-account-card">
              <div>
                <h2 className="card-title">Account</h2>
                <p className="card-subtitle">{user.email}</p>
              </div>
              <button className="btn btn-secondary settings-signout-button" type="button" onClick={() => supabase.auth.signOut()}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      {message && <p className="settings-success">{message}</p>}
    </div>
  );
}
