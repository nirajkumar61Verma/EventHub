import { useState, type ChangeEvent, type FormEvent } from "react";
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
import { api } from "../../api/client";
import { indiaLocations, indianStates } from "../../indiaLocations";

type BecomeProviderPageProps = {
  onComplete: (user: any) => void;
};

type ProviderForm = {
  business_name: string;
  business_title: string;
  category: string;
  city: string;
  state: string;
  description: string;
  years_experience: number;
  service_radius: number;
  starting_price: number;
  price_unit: string;
  logo_data: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  website_url: string;
};

const initialValues: ProviderForm = {
  business_name: "",
  business_title: "",
  category: "",
  city: "",
  state: "",
  description: "",
  years_experience: 0,
  service_radius: 25,
  starting_price: 0,
  price_unit: "event",
  logo_data: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  linkedin_url: "",
  website_url: "",
};

const socialFields: [keyof ProviderForm, string, string][] = [
  ["instagram_url", "Instagram URL", "https://instagram.com/yourbusiness"],
  ["facebook_url", "Facebook URL", "https://facebook.com/yourbusiness"],
  ["youtube_url", "YouTube URL", "https://youtube.com/@yourbusiness"],
  ["linkedin_url", "LinkedIn URL", "https://linkedin.com/company/yourbusiness"],
  ["website_url", "Website URL", "https://yourbusiness.com"],
];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
  },
};

export default function BecomeProviderPage({
  onComplete,
}: BecomeProviderPageProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const cities = values.state ? indiaLocations[values.state] ?? [] : [];

  function update<K extends keyof ProviderForm>(key: K, value: ProviderForm[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP logo image.");
      return;
    }
    if (file.size > 512 * 1024) {
      setError("Logo image must be 512 KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Unable to read the selected logo image.");
        return;
      }
      update("logo_data", reader.result);
      setError("");
    };
    reader.onerror = () => setError("Unable to read the selected logo image.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api("/provider/profile", {
        method: "POST",
        body: JSON.stringify(values),
      });
      localStorage.setItem("eh_user", JSON.stringify(result.user));
      onComplete(result.user);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to create provider profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box
      sx={{
        maxWidth: 820,
        mx: "auto",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 5 },
      }}
    >
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: "#987044", letterSpacing: 2 }}>
          GROW WITH EVENTHUB
        </Typography>
        <Typography
          variant="h3"
          sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
        >
          Offer your event service
        </Typography>
        <Typography color="text.secondary">
          Add a business or personal service profile. Mehndi artists, dancers,
          anchors, photographers, caterers, and other event professionals are
          welcome. Your customer account and planning tools stay available.
        </Typography>
      </Stack>

      <Paper
        component="form"
        onSubmit={submit}
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          border: "1px solid #e7e1d7",
          borderRadius: 3,
        }}
      >
        <Stack spacing={2.2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Service profile
          </Typography>
          <TextField
            label="Business or professional name"
            required
            fullWidth
            maxRows={1}
            value={values.business_name}
            onChange={(event) => update("business_name", event.target.value)}
            sx={fieldSx}
          />
          <TextField
            label="Profile title or tagline"
            fullWidth
            value={values.business_title}
            onChange={(event) => update("business_title", event.target.value)}
            helperText="A short headline shown on your public profile."
            sx={fieldSx}
          />
          <TextField
            label="Service you provide"
            required
            fullWidth
            slotProps={{ htmlInput: { maxLength: 120 } }}
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="e.g. Mehndi artist, Dancer, Anchor, DJ, Photographer"
            helperText="Enter any event service; it does not need to be in a preset list."
            sx={fieldSx}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              select
              label="State / Union Territory"
              required
              fullWidth
              value={values.state}
              onChange={(event) => {
                update("state", event.target.value);
                update("city", "");
              }}
              sx={fieldSx}
            >
              {indianStates.map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="City"
              required
              fullWidth
              disabled={!values.state}
              value={values.city}
              onChange={(event) => update("city", event.target.value)}
              sx={fieldSx}
            >
              {cities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <TextField
            label="About your service"
            multiline
            minRows={3}
            fullWidth
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            sx={fieldSx}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
            }}
          >
            <TextField
              label="Years of experience"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
              value={values.years_experience}
              onChange={(event) =>
                update("years_experience", Math.max(0, Number(event.target.value)))
              }
              sx={fieldSx}
            />
            <TextField
              label="Service radius (km)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 1000 } }}
              value={values.service_radius}
              onChange={(event) =>
                update("service_radius", Math.max(1, Number(event.target.value)))
              }
              sx={fieldSx}
            />
            <TextField
              label="Starting price (₹)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
              value={values.starting_price}
              onChange={(event) =>
                update("starting_price", Math.max(0, Number(event.target.value)))
              }
              sx={fieldSx}
            />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Business logo or profile icon
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
            >
              {values.logo_data && (
                <Box
                  component="img"
                  src={values.logo_data}
                  alt="Service profile logo preview"
                  sx={{
                    width: 76,
                    height: 76,
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid #e7e1d7",
                  }}
                />
              )}
              <Button
                component="label"
                variant="outlined"
                sx={{ borderRadius: 2, textTransform: "none" }}
              >
                {values.logo_data ? "Change logo" : "Upload logo"}
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={uploadLogo}
                />
              </Button>
              {values.logo_data && (
                <Button
                  type="button"
                  onClick={() => update("logo_data", "")}
                  sx={{ textTransform: "none" }}
                >
                  Remove
                </Button>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              PNG, JPEG, or WebP; maximum 512 KB.
            </Typography>
          </Box>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Social media and website
          </Typography>
          {socialFields.map(([key, label, placeholder]) => (
            <TextField
              key={key}
              label={label}
              type="url"
              fullWidth
              value={values[key]}
              onChange={(event) => update(key, event.target.value)}
              placeholder={placeholder}
              sx={fieldSx}
            />
          ))}
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={saving}
            sx={{
              minHeight: 50,
              borderRadius: 2,
              bgcolor: "#29251f",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { bgcolor: "#514333" },
            }}
          >
            {saving ? "Creating your profile..." : "Create service profile"}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Your profile will be pending admin verification before it is shown
            as verified.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
