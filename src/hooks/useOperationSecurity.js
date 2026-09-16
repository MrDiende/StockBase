import { useCallback, useEffect, useState } from "react";

export function useOperationSecurity(supabase, user) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase && user));
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !user) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    supabase.from("operation_security").select("enabled").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("Could not load operation security.", error);
          setError(`Operation Security is unavailable: ${error.message}`);
          setLoading(false);
          return;
        }
        setEnabled(Boolean(data?.enabled));
        setLoading(false);
      });
    return () => { active = false; };
  }, [supabase, user]);

  const authorize = useCallback(async (operation, force = false) => {
    if (!enabled && !force) return null;
    return new Promise((resolve) => setDialog({ operation, resolve }));
  }, [enabled]);

  const submitAuthorization = useCallback(async (password) => {
    const pending = dialog;
    if (!pending) return;
    const { data, error } = await supabase.rpc("authorize_operation", {
      requested_operation: pending.operation,
      admin_password: password,
    });
    if (error || !data) {
      setDialog({ ...pending, error: error?.message || "Authorization failed. Check the admin password." });
      return;
    }
    setDialog(null);
    pending.resolve(data);
  }, [dialog, supabase]);

  const cancelAuthorization = useCallback(() => {
    dialog?.resolve(null);
    setDialog(null);
  }, [dialog]);

  const setSecurity = useCallback(async (nextEnabled, grant = null) => {
    if (nextEnabled) {
      if (!grant) throw new Error("Admin authorization is required.");
    }
    const { error } = await supabase.rpc("set_operation_security", {
      next_enabled: nextEnabled,
      authorization_token: grant,
    });
    if (error) throw error;
    setEnabled(nextEnabled);
  }, [supabase]);

  return {
    enabled,
    loading,
    error,
    authorize,
    setSecurity,
    authorizationDialog: dialog,
    submitAuthorization,
    cancelAuthorization,
  };
}
