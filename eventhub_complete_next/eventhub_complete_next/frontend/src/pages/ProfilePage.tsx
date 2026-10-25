import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { indiaLocations, indianStates } from "../indiaLocations";

export type ProfileValues = {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  locality: string;
  city: string;
  state: string;
  postal_code: string;
};

type ProfilePageProps = {
  onLoad: () => Promise<ProfileValues>;
  onSave: (values: ProfileValues) => Promise<void>;
};

const emptyProfile: ProfileValues = {
  full_name: "",
  email: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  locality: "",
  city: "",
  state: "",
  postal_code: "",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
  },
};

export default function ProfilePage({ onLoad, onSave }: ProfilePageProps) {
  const [values, setValues] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    onLoad()
      .then((data) => {
        if (!active) return;
        setValues({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address_line1: data.address_line1 || "",
          address_line2: data.address_line2 || "",
          locality: data.locality || "",
          city: data.city || "",
          state: data.state || "",
          postal_code: data.postal_code || "",
        });
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load profile.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onLoad]);

  function update<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await onSave(values);
      setSuccess("Your profile has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  }

  const cities = values.state ? indiaLocations[values.state] ?? [] : [];

  if (loading) return <main><p>Loading your profile...</p></main>;

  return (
    <Box sx={{ maxWidth: 820, mx: "auto", px: { xs: 2, sm: 3 }, py: 5 }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: "#987044", letterSpacing: 2 }}>
          ACCOUNT SETTINGS
        </Typography>
        <Typography variant="h3" sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
          Your profile
        </Typography>
        <Typography color="text.secondary">
          Update your contact information and full address. These settings are available
          to both customers and service providers.
        </Typography>
      </Stack>
      <Paper component="form" onSubmit={submit} elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, border: "1px solid #e7e1d7", borderRadius: 3 }}>
        <Stack spacing={2.2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Contact details</Typography>
          <TextField label="Full name" autoComplete="name" required fullWidth value={values.full_name} onChange={(event) => update("full_name", event.target.value)} sx={fieldSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField label="Email address" type="email" autoComplete="email" required fullWidth value={values.email} onChange={(event) => update("email", event.target.value)} sx={fieldSx} />
            <TextField label="Phone number" type="tel" autoComplete="tel" required fullWidth value={values.phone} onChange={(event) => update("phone", event.target.value)} slotProps={{ htmlInput: { minLength: 7, maxLength: 30 } }} sx={fieldSx} />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700, pt: 1 }}>Full address</Typography>
          <TextField label="Address line 1" autoComplete="address-line1" required fullWidth value={values.address_line1} onChange={(event) => update("address_line1", event.target.value)} sx={fieldSx} />
          <TextField label="Address line 2 (optional)" autoComplete="address-line2" fullWidth value={values.address_line2} onChange={(event) => update("address_line2", event.target.value)} sx={fieldSx} />
          <TextField label="Area / locality" autoComplete="address-level3" required fullWidth value={values.locality} onChange={(event) => update("locality", event.target.value)} sx={fieldSx} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField select label="State / Union Territory" required fullWidth value={values.state} onChange={(event) => { update("state", event.target.value); update("city", ""); }} sx={fieldSx}>
              {indianStates.map((state) => <MenuItem key={state} value={state}>{state}</MenuItem>)}
            </TextField>
            <TextField select label="City" required fullWidth disabled={!values.state} value={values.city} onChange={(event) => update("city", event.target.value)} sx={fieldSx}>
              {cities.map((city) => <MenuItem key={city} value={city}>{city}</MenuItem>)}
            </TextField>
          </Box>
          <TextField label="PIN code" autoComplete="postal-code" required fullWidth value={values.postal_code} onChange={(event) => update("postal_code", event.target.value)} slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6 } }} helperText="Enter a 6-digit Indian PIN code." sx={fieldSx} />

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={saving} sx={{ minHeight: 50, borderRadius: 2, bgcolor: "#29251f", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#514333" } }}>
            {saving ? "Saving profile..." : "Save profile"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
