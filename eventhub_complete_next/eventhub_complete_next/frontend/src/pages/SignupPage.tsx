import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowForwardRounded,
  BusinessRounded,
  EmailOutlined,
  LockOutlined,
  PersonOutlineRounded,
  PhoneIphoneRounded,
  WorkOutlineRounded,
} from "@mui/icons-material";
import { indiaLocations, indianStates } from "../indiaLocations";

export type SignupValues = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: "CUSTOMER" | "PROVIDER";
  business_name: string;
  business_title: string;
  logo_data: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  linkedin_url: string;
  website_url: string;
  provider_type: string;
  description: string;
  state: string;
  city: string;
  service_radius: number;
  years_experience: number;
};

type SignupPageProps = {
  onSignup: (values: SignupValues) => Promise<void>;
  onLogin: () => void;
};

const initialValues: SignupValues = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "CUSTOMER",
  business_name: "",
  business_title: "",
  logo_data: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  linkedin_url: "",
  website_url: "",
  provider_type: "",
  description: "",
  state: "",
  city: "",
  service_radius: 25,
  years_experience: 1,
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
  },
};

export default function SignupPage({ onSignup, onLogin }: SignupPageProps) {
  const [values, setValues] = useState(initialValues);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isProvider = values.role === "PROVIDER";
  const cities = values.state ? indiaLocations[values.state] ?? [] : [];

  function update<K extends keyof SignupValues>(
    key: K,
    value: SignupValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function uploadLogo(file?: File) {
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
      if (typeof reader.result === "string") {
        setError("");
        update("logo_data", reader.result);
      } else {
        setError("Unable to read the selected logo image.");
      }
    };
    reader.onerror = () => setError("Unable to read the selected logo image.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (values.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await onSignup(values);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 6 },
        background:
          "radial-gradient(circle at 8% 8%, #efe2ce 0, transparent 34%), #f7f4ee",
      }}
    >
      <Box
        sx={{
          width: "min(1080px, 100%)",
          mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "0.78fr 1.22fr" },
          overflow: "hidden",
          borderRadius: { xs: 3, md: 5 },
          boxShadow: "0 24px 80px rgba(45, 39, 29, 0.12)",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 5,
            color: "#fff",
            background:
              "linear-gradient(155deg, rgba(38,35,31,.96), rgba(68,56,43,.92)), radial-gradient(circle at 85% 12%, #b7834b, transparent 50%)",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontFamily: "Georgia, serif", fontWeight: 700, mb: 1 }}
            >
              EventHub
            </Typography>
            <Typography
              variant="overline"
              sx={{ color: "#dec7a6", letterSpacing: 2.5 }}
            >
              MAKE IT A DAY TO REMEMBER
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Georgia, serif",
                fontWeight: 600,
                lineHeight: 1.08,
                mb: 2,
              }}
            >
              Great events start with great people.
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,.72)", lineHeight: 1.8 }}>
              Find trusted local professionals or bring your event business to a
              community that is ready to celebrate.
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,.58)" }}>
            Your next memorable moment starts here.
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
          <Stack spacing={0.7} sx={{ mb: 3 }}>
            <Typography
              variant="overline"
              sx={{ color: "#987044", letterSpacing: 2, fontWeight: 700 }}
            >
              JOIN EVENTHUB
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Georgia, serif",
                fontWeight: 700,
                color: "#25231f",
              }}
            >
              Create your account
            </Typography>
            <Typography color="text.secondary">
              Sign up as a customer or event service provider.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={submit}>
            <Stack spacing={2.1}>
              <FormControl>
                <Typography variant="subtitle2" sx={{ mb: 0.7, fontWeight: 700 }}>
                  I want to join as
                </Typography>
                <RadioGroup
                  row
                  value={values.role}
                  onChange={(event) =>
                    update("role", event.target.value as SignupValues["role"])
                  }
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                  }}
                >
                  {[
                    { value: "CUSTOMER", label: "Customer" },
                    { value: "PROVIDER", label: "Service provider" },
                  ].map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio size="small" />}
                      label={option.label}
                      sx={{
                        m: 0,
                        px: 1.2,
                        py: 0.5,
                        border: "1px solid",
                        borderColor:
                          values.role === option.value ? "#8d673b" : "#e7e1d7",
                        borderRadius: 2,
                        bgcolor:
                          values.role === option.value ? "#fbf7f0" : "#fff",
                        "& .MuiFormControlLabel-label": {
                          fontSize: 14,
                          fontWeight: 600,
                        },
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              <TextField
                label="Full name"
                autoComplete="name"
                required
                fullWidth
                value={values.full_name}
                onChange={(event) => update("full_name", event.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineRounded fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  required
                  fullWidth
                  value={values.email}
                  onChange={(event) => update("email", event.target.value)}
                  sx={fieldSx}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  required
                  fullWidth
                  value={values.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  sx={fieldSx}
                  slotProps={{
                    htmlInput: { minLength: 7, maxLength: 30 },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIphoneRounded fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
              <TextField
                label="Password"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                value={values.password}
                onChange={(event) => update("password", event.target.value)}
                helperText="Use at least 6 characters."
                sx={fieldSx}
                slotProps={{
                  htmlInput: { minLength: 6 },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                error={confirmPassword.length > 0 && values.password !== confirmPassword}
                helperText={
                  confirmPassword.length > 0 && values.password !== confirmPassword
                    ? "Passwords do not match."
                    : "Re-enter your password to confirm."
                }
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
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
                  helperText={
                    values.state
                      ? "Select your city."
                      : "Choose a state or Union Territory first."
                  }
                  sx={fieldSx}
                >
                  {cities.map((city) => (
                    <MenuItem key={city} value={city}>
                      {city}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {isProvider && (
                <>
                  <Divider>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", px: 1 }}
                    >
                      PROVIDER PROFILE
                    </Typography>
                  </Divider>
                  <TextField
                    label="Business name"
                    required
                    fullWidth
                    value={values.business_name}
                    onChange={(event) =>
                      update("business_name", event.target.value)
                    }
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessRounded fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    label="Business title or tagline"
                    fullWidth
                    value={values.business_title}
                    onChange={(event) => update("business_title", event.target.value)}
                    helperText="A short headline shown on your public provider profile."
                    sx={fieldSx}
                  />
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Business logo</Typography>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      {values.logo_data && <Box component="img" src={values.logo_data} alt="Business logo preview" sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 2, border: "1px solid #e7e1d7" }} />}
                      <Button component="label" variant="outlined" sx={{ borderRadius: 2, textTransform: "none" }}>
                        {values.logo_data ? "Change logo" : "Upload logo"}
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void uploadLogo(event.target.files?.[0]); event.target.value = ""; }} />
                      </Button>
                      {values.logo_data && <Button type="button" onClick={() => update("logo_data", "")} sx={{ textTransform: "none" }}>Remove</Button>}
                    </Stack>
                    <FormHelperText>PNG, JPEG, or WebP; maximum 512 KB.</FormHelperText>
                  </Box>
                  <Divider>
                    <Typography variant="caption" sx={{ color: "text.secondary", px: 1 }}>SOCIAL LINKS</Typography>
                  </Divider>
                  <TextField label="Instagram URL" type="url" fullWidth value={values.instagram_url} onChange={(event) => update("instagram_url", event.target.value)} placeholder="https://instagram.com/yourbusiness" sx={fieldSx} />
                  <TextField label="Facebook URL" type="url" fullWidth value={values.facebook_url} onChange={(event) => update("facebook_url", event.target.value)} placeholder="https://facebook.com/yourbusiness" sx={fieldSx} />
                  <TextField label="YouTube URL" type="url" fullWidth value={values.youtube_url} onChange={(event) => update("youtube_url", event.target.value)} placeholder="https://youtube.com/@yourbusiness" sx={fieldSx} />
                  <TextField label="LinkedIn URL" type="url" fullWidth value={values.linkedin_url} onChange={(event) => update("linkedin_url", event.target.value)} placeholder="https://linkedin.com/company/yourbusiness" sx={fieldSx} />
                  <TextField label="Website URL" type="url" fullWidth value={values.website_url} onChange={(event) => update("website_url", event.target.value)} placeholder="https://yourbusiness.com" sx={fieldSx} />
                  <TextField
                    label="Service you provide"
                    required
                    fullWidth
                    slotProps={{ htmlInput: { maxLength: 120 } }}
                    value={values.provider_type}
                    onChange={(event) =>
                      update("provider_type", event.target.value)
                    }
                    placeholder="e.g. Mehndi artist, Dancer, Anchor, DJ"
                    helperText="Enter any event service, including one not shown in a list."
                    sx={fieldSx}
                  />
                  <TextField
                    label="Business description"
                    multiline
                    minRows={3}
                    fullWidth
                    value={values.description}
                    onChange={(event) =>
                      update("description", event.target.value)
                    }
                    sx={fieldSx}
                  />
                  <TextField
                    label="Service radius"
                    type="number"
                    fullWidth
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={values.service_radius}
                    onChange={(event) =>
                      update("service_radius", Math.max(1, Number(event.target.value)))
                    }
                    helperText="Distance from your base"
                    sx={fieldSx}
                  />
                  <TextField
                    label="Years of experience"
                    type="number"
                    required
                    fullWidth
                    value={values.years_experience}
                    onChange={(event) =>
                      update(
                        "years_experience",
                        Math.max(0, Number(event.target.value)),
                      )
                    }
                    sx={fieldSx}
                    slotProps={{
                      htmlInput: { min: 0 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <WorkOutlineRounded fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </>
              )}

              {error && <Alert severity="error">{error}</Alert>}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                endIcon={<ArrowForwardRounded />}
                sx={{
                  minHeight: 52,
                  mt: 0.5,
                  borderRadius: 2,
                  bgcolor: "#29251f",
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#514333" },
                }}
              >
                {submitting ? "Creating account..." : "Create account"}
              </Button>
              <FormHelperText sx={{ textAlign: "center", mx: 0 }}>
                By continuing, you agree to use EventHub responsibly.
              </FormHelperText>
              <Typography variant="body2" align="center" color="text.secondary">
                Already have an account?{" "}
                <Button
                  type="button"
                  onClick={onLogin}
                  sx={{
                    minWidth: 0,
                    p: 0,
                    ml: 0.5,
                    color: "#805b32",
                    textTransform: "none",
                    fontWeight: 700,
                    verticalAlign: "baseline",
                  }}
                >
                  Sign in
                </Button>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
