import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { api } from "../api/client";
import ProfilePage, { type ProfileValues } from "./ProfilePage";

type Preferences = {
  email_notifications: boolean;
  booking_updates: boolean;
  shortlist_updates: boolean;
  marketing_emails: boolean;
  updated_at?: string | null;
};

type SettingsPageProps = {
  user: any;
  onProfileLoad: () => Promise<ProfileValues>;
  onProfileSave: (values: ProfileValues) => Promise<void>;
};

const defaults: Preferences = {
  email_notifications: true,
  booking_updates: true,
  shortlist_updates: true,
  marketing_emails: false,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
  },
};

export default function SettingsPage({
  user,
  onProfileLoad,
  onProfileSave,
}: SettingsPageProps) {
  const [tab, setTab] = useState("account");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [preferences, setPreferences] = useState(defaults);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let active = true;
    api("/settings/notifications", {
      headers: { Authorization: `Bearer ${localStorage.getItem("eh_token") || ""}` },
    })
      .then((data) => {
        if (active) setPreferences(data);
      })
      .catch((cause: unknown) => {
        if (active) {
          setPreferencesError(cause instanceof Error ? cause.message : "Unable to load settings.");
        }
      })
      .finally(() => {
        if (active) setPreferencesLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreferencesSaving(true);
    setPreferencesError("");
    setPreferencesMessage("");
    try {
      const data = await api("/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("eh_token") || ""}`,
        },
        body: JSON.stringify(preferences),
      });
      setPreferences(data);
      setPreferencesMessage("Notification preferences saved.");
    } catch (cause) {
      setPreferencesError(cause instanceof Error ? cause.message : "Unable to save settings.");
    } finally {
      setPreferencesSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await api("/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("eh_token") || ""}`,
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed successfully.");
    } catch (cause) {
      setPasswordError(cause instanceof Error ? cause.message : "Unable to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  const changedAt = preferences.updated_at
    ? new Date(preferences.updated_at).toLocaleString()
    : "Not changed yet";

  const tabTitle = tab === "account" ? "Account settings" : tab === "security" ? "Security" : "Notifications";

  return (
    <Box className="settings-layout" sx={{ maxWidth: 1240, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
      {sidebarOpen && <Paper component="aside" elevation={0} className="settings-sidebar" sx={{ p: 2.5, border: "1px solid #e7e1d7", borderRadius: 3 }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="overline" sx={{ color: "#987044", letterSpacing: 2 }}>ACCOUNT</Typography>
          <Typography variant="h5" sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>Settings</Typography>
        </Stack>
        <Stack component="nav" aria-label="Settings sections" spacing={0.75} sx={{ mb: 3 }}>
          {[
            ["account", "Account"],
            ["security", "Security"],
            ["notifications", "Notifications"],
          ].map(([value, label]) => (
            <Button key={value} onClick={() => setTab(value)} aria-current={tab === value ? "page" : undefined}
              sx={{ justifyContent: "flex-start", borderRadius: 2, textTransform: "none", color: tab === value ? "#fff" : "#29251f", bgcolor: tab === value ? "#29251f" : "transparent", "&:hover": { bgcolor: tab === value ? "#29251f" : "#f4f0e9" } }}>
              {label}
            </Button>
          ))}
        </Stack>
        <Box className="settings-account-summary">
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Account details</Typography>
          <Typography variant="body2"><strong>Name</strong><br/>{user?.name || user?.full_name || "Not set"}</Typography>
          <Typography variant="body2"><strong>Email</strong><br/>{user?.email || "Not set"}</Typography>
          <Typography variant="body2"><strong>Account type</strong><br/>{user?.role === "PROVIDER" ? "Service provider" : user?.role === "CUSTOMER_PROVIDER" ? "Customer and service provider" : user?.role === "ADMIN" ? "Administrator" : "Customer"}</Typography>
          <Typography variant="body2"><strong>Status</strong><br/>{user?.active === false ? "Disabled" : "Enabled"}</Typography>
        </Box>
      </Paper>}
      <Box component="section" className="settings-content">
        <Box className="settings-content-heading">
          <IconButton aria-label={sidebarOpen ? "Hide settings menu" : "Show settings menu"} onClick={() => setSidebarOpen(open => !open)} sx={{ alignSelf: "flex-start", mt: 0.5 }}>
            <MenuIcon/>
          </IconButton>
          <Stack spacing={0.5}>
            <Typography variant="overline" sx={{ color: "#987044", letterSpacing: 2 }}>EVENTHUB</Typography>
            <Typography variant="h3" sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>{tabTitle}</Typography>
            <Typography color="text.secondary">Manage your account details, security, and notification preferences.</Typography>
          </Stack>
        </Box>

      {tab === "account" && (
        <>
          <Paper elevation={0} sx={{ p: 3, mb: 2, border: "1px solid #e7e1d7", borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Account overview</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Typography><strong>Name:</strong> {user?.name || user?.full_name || "Not set"}</Typography>
              <Typography><strong>Email:</strong> {user?.email || "Not set"}</Typography>
              <Typography><strong>Account type:</strong> {user?.role === "PROVIDER" ? "Service provider" : user?.role === "CUSTOMER_PROVIDER" ? "Customer and service provider" : user?.role === "ADMIN" ? "Administrator" : "Customer"}</Typography>
              <Typography><strong>Account status:</strong> {user?.active === false ? "Disabled" : "Enabled"}</Typography>
              <Typography><strong>Email verification:</strong> {user?.email_verified ? "Verified" : "Not verified"}</Typography>
              {user?.created_at && <Typography><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</Typography>}
              {user?.id && <Typography><strong>Account ID:</strong> {user.id}</Typography>}
            </Box>
          </Paper>
          <ProfilePage onLoad={onProfileLoad} onSave={onProfileSave} />
        </>
      )}

      {tab === "security" && (
        <Paper component="form" onSubmit={changePassword} elevation={0} sx={{ maxWidth: 650, p: { xs: 2.5, sm: 4 }, border: "1px solid #e7e1d7", borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Change password</Typography>
            <Typography color="text.secondary">Choose a new password with at least 8 characters.</Typography>
            <TextField label="Current password" type="password" autoComplete="current-password" required fullWidth value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} sx={fieldSx} />
            <TextField label="New password" type="password" autoComplete="new-password" required fullWidth slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} sx={fieldSx} />
            <TextField label="Confirm new password" type="password" autoComplete="new-password" required fullWidth slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} sx={fieldSx} />
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}
            <Button type="submit" variant="contained" disabled={passwordSaving} sx={{ borderRadius: 2, bgcolor: "#29251f", textTransform: "none" }}>
              {passwordSaving ? "Updating..." : "Update password"}
            </Button>
          </Stack>
        </Paper>
      )}

      {tab === "notifications" && (
        <Paper component="form" onSubmit={savePreferences} elevation={0} sx={{ maxWidth: 720, p: { xs: 2.5, sm: 4 }, border: "1px solid #e7e1d7", borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Notification preferences</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              These preferences are saved to your account and can be used by notification delivery when available.
            </Typography>
            {preferencesLoading ? <Typography>Loading preferences...</Typography> : <>
              <FormControlLabel control={<Switch checked={preferences.email_notifications} onChange={(_, checked) => setPreferences((current) => ({ ...current, email_notifications: checked }))} />} label="Email notifications" />
              <FormControlLabel control={<Switch checked={preferences.booking_updates} onChange={(_, checked) => setPreferences((current) => ({ ...current, booking_updates: checked }))} />} label="Booking and quote updates" />
              <FormControlLabel control={<Switch checked={preferences.shortlist_updates} onChange={(_, checked) => setPreferences((current) => ({ ...current, shortlist_updates: checked }))} />} label="Planner shortlist updates" />
              <FormControlLabel control={<Switch checked={preferences.marketing_emails} onChange={(_, checked) => setPreferences((current) => ({ ...current, marketing_emails: checked }))} />} label="Product announcements and tips" />
              <Typography variant="caption" color="text.secondary">Last updated: {changedAt}</Typography>
              {preferencesError && <Alert severity="error">{preferencesError}</Alert>}
              {preferencesMessage && <Alert severity="success">{preferencesMessage}</Alert>}
              <Button type="submit" variant="contained" disabled={preferencesSaving} sx={{ mt: 1, borderRadius: 2, bgcolor: "#29251f", textTransform: "none" }}>
                {preferencesSaving ? "Saving..." : "Save notification preferences"}
              </Button>
            </>}
          </Stack>
        </Paper>
      )}
      </Box>
    </Box>
  );
}
