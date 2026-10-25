import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { indiaLocations, indianStates } from "../indiaLocations";

type Provider = {
  id: number;
  business_name: string;
  provider_type: string;
  category: string;
  city: string;
  state: string;
  starting_price: number;
  price_unit: string;
};

type EventRequestPageProps = {
  api: (path: string, options?: any) => Promise<any>;
  initialProviderId?: number;
  onBrowse: () => void;
};

const eventTypes = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Anniversary",
  "Baby shower",
  "Graduation",
  "Corporate event",
  "Family celebration",
  "Other",
];

function localDateInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function EventRequestPage({
  api,
  initialProviderId,
  onBrowse,
}: EventRequestPageProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventType, setEventType] = useState("Wedding");
  const [customEventType, setCustomEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("");
  const [budget, setBudget] = useState("");
  const [venue, setVenue] = useState("");
  const [details, setDetails] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<number[]>(
    initialProviderId ? [initialProviderId] : [],
  );
  const [providerSearch, setProviderSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/providers"),
      api("/customer/events"),
    ])
      .then(([providerRows, eventRows]) => {
        if (!active) return;
        setProviders(providerRows);
        setEvents(eventRows);
        const initialProvider = providerRows.find((provider: Provider) => provider.id === initialProviderId);
        if (initialProvider) {
          setState(initialProvider.state);
          setCity(initialProvider.city);
          setServices([initialProvider.provider_type || initialProvider.category]);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load event request details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);

  const availableCities = state ? indiaLocations[state] || [] : [];
  const serviceOptions = useMemo(
    () => [...new Set(providers.map((provider) => provider.provider_type || provider.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b)),
    [providers],
  );
  const matchingProviders = useMemo(() => {
    const search = providerSearch.trim().toLowerCase();
    return providers.filter((provider) => {
      const type = provider.provider_type || provider.category || "";
      const matchesLocation = (!state || provider.state === state)
        && (!city || provider.city.toLowerCase() === city.toLowerCase())
      const matchesFilters = matchesLocation
        && (!services.length || services.includes(type))
        && (!search || `${provider.business_name} ${type} ${provider.city}`.toLowerCase().includes(search));
      return selectedProviders.includes(provider.id) || matchesFilters;
    });
  }, [city, providerSearch, providers, selectedProviders, services, state]);

  function updateServices(service: string, checked: boolean) {
    setServices((current) => checked
      ? [...current, service]
      : current.filter((item) => item !== service));
  }

  function toggleProvider(providerId: number, checked: boolean) {
    setError("");
    if (checked && selectedProviders.length >= 25) {
      setError("You can send an event request to up to 25 providers at a time.");
      return;
    }
    setSelectedProviders((current) => checked
      ? current.includes(providerId) ? current : [...current, providerId]
      : current.filter((id) => id !== providerId));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (selectedProviders.length === 0) {
      setError("Select at least one provider to receive this event request.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await api("/customer/events", {
        method: "POST",
        body: JSON.stringify({
          event_type: eventType === "Other" ? customEventType.trim() : eventType,
          city,
          state,
          event_date: eventDate,
          guests: Number(guests),
          budget: Number(budget || 0),
          provider_ids: selectedProviders,
          services,
          venue,
          details,
        }),
      });
      setSuccess(result.message || "Your event request was sent to the selected providers.");
      setSelectedProviders([]);
      setServices([]);
      setEvents(await api("/customer/events"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your event request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="main" className="event-planning-page">
      <Box className="event-planning-hero">
        <Stack spacing={1} className="event-planning-hero-copy">
          <Typography variant="overline" className="event-planning-eyebrow">LET'S CELEBRATE SOMETHING SPECIAL</Typography>
          <Typography variant="h3">Tell providers about your event</Typography>
          <Typography>
            Share your date, guest count, location, and needs. Your event brief will be sent to each provider you select.
          </Typography>
          <Typography variant="body2">
            Requests appear in each provider&apos;s Enquiries dashboard; email notifications are not enabled yet.
          </Typography>
        </Stack>
        <div className="event-planning-decoration" aria-hidden="true">
          <span className="event-planning-ring" />
          <span className="event-planning-flower">✿</span>
          <span className="event-planning-sparkle">✦</span>
          <span className="event-planning-decoration-label">YOUR DAY, YOUR WAY</span>
        </div>
      </Box>

      {error && <Alert severity="error" className="event-planning-alert">{error}</Alert>}
      {success && <Alert severity="success" className="event-planning-alert">{success}</Alert>}

      <Paper component="form" onSubmit={submit} elevation={0} className="event-planning-form">
        <Stack spacing={2.5}>
          <Box className="event-form-section event-details-section">
            <Typography className="event-form-step">01 <span>YOUR CELEBRATION</span></Typography>
            <Typography variant="h6" className="event-form-section-title">Event details</Typography>
            <Box className="event-details-grid">
            <TextField select label="Event type" required value={eventType} onChange={(event) => setEventType(event.target.value)}>
              {eventTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
            {eventType === "Other" && <TextField label="Describe your event" required value={customEventType} onChange={(event) => setCustomEventType(event.target.value)} slotProps={{ htmlInput: { maxLength: 100 } }} />}
            <TextField label="Event date" type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: localDateInputValue() } }} />
            <TextField select label="State / Union Territory" required value={state} onChange={(event) => { setState(event.target.value); setCity(""); }}>
              {indianStates.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select label="City" required disabled={!state} value={city} onChange={(event) => setCity(event.target.value)}>
              {availableCities.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField label="Number of guests" type="number" required value={guests} onChange={(event) => setGuests(event.target.value)} slotProps={{ htmlInput: { min: 1, max: 100000 } }} />
            <TextField label="Estimated budget (₹)" type="number" helperText="Optional; leave blank if undecided." value={budget} onChange={(event) => setBudget(event.target.value)} slotProps={{ htmlInput: { min: 0, step: 500 } }} />
            <TextField label="Venue or area (optional)" value={venue} onChange={(event) => setVenue(event.target.value)} slotProps={{ htmlInput: { maxLength: 300 } }} />
            </Box>
          </Box>

          <Box className="event-form-section">
            <Typography className="event-form-step">02 <span>THE DETAILS</span></Typography>
            <Typography variant="subtitle1" className="event-form-section-title">Services you need</Typography>
            <Typography variant="body2" color="text.secondary">Optional. Choose one or more service types to narrow provider selection.</Typography>
            {loading ? <Typography sx={{ mt: 1 }}>Loading services...</Typography> : (
              <FormGroup row className="event-service-options">
                {serviceOptions.map((service) => (
                  <FormControlLabel key={service} control={<Checkbox checked={services.includes(service)} onChange={(event) => updateServices(service, event.target.checked)} />} label={service} />
                ))}
              </FormGroup>
            )}
          </Box>

          <Box className="event-form-section event-notes-section">
          <Typography className="event-form-step">03 <span>MAKE IT YOURS</span></Typography>
          <TextField
            label="Event notes and requirements (optional)"
            multiline
            minRows={3}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            helperText="Mention themes, food preferences, accessibility needs, timing, or other details providers should know."
            slotProps={{ htmlInput: { maxLength: 4000 } }}
          />
          </Box>

          <Box className="event-form-section event-provider-section">
            <Stack spacing={1} className="event-provider-heading">
              <Box>
                <Typography className="event-form-step">04 <span>YOUR EVENT TEAM</span></Typography>
                <Typography variant="h6" className="event-form-section-title">Choose providers</Typography>
                <Typography variant="body2" color="text.secondary">Select one or more providers. Choose a state and city above to narrow the list.</Typography>
              </Box>
            </Stack>
            <Chip className="event-selected-count" label={`${selectedProviders.length} selected`} color={selectedProviders.length ? "primary" : "default"} />
            <TextField fullWidth label="Search providers" value={providerSearch} onChange={(event) => setProviderSearch(event.target.value)} sx={{ mb: 1.5 }} />
            {loading ? <Typography>Loading providers...</Typography> : matchingProviders.length === 0 ? (
              <Alert severity="info">No providers match these filters. Try another city or service type.</Alert>
            ) : (
              <Box className="event-provider-grid">
                {matchingProviders.map((provider) => (
                  <Paper
                    key={provider.id}
                    component="label"
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2.5,
                      cursor: "pointer",
                      borderColor: selectedProviders.includes(provider.id) ? "#9b315a" : "#f0dfd5",
                      backgroundColor: selectedProviders.includes(provider.id) ? "#fff0f3" : "#fffdf9",
                      transition: "border-color .2s ease, background-color .2s ease, transform .2s ease",
                      "&:hover": { borderColor: "#c78935", backgroundColor: "#fff8ef", transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                      <Checkbox
                        checked={selectedProviders.includes(provider.id)}
                        onChange={(event) => toggleProvider(provider.id, event.target.checked)}
                        sx={{ mt: -0.5, ml: -0.5 }}
                      />
                      <Box sx={{ pt: 0.75 }}>
                        <Typography variant="subtitle2" className="event-provider-name">{provider.business_name}</Typography>
                        <Typography variant="body2" color="text.secondary">{provider.provider_type || provider.category} · {provider.city}, {provider.state}</Typography>
                        <Typography variant="body2" className="event-provider-price">From ₹{provider.starting_price} / {provider.price_unit}</Typography>
                        {selectedProviders.includes(provider.id) && <Chip size="small" label="Selected" color="primary" sx={{ mt: 0.75 }} />}
                        {selectedProviders.includes(provider.id) && state && (provider.state !== state || (city && provider.city.toLowerCase() !== city.toLowerCase())) && (
                          <Typography
                            variant="caption"
                            color="warning.main"
                            sx={{ display: "block" }}
                          >
                            Outside the selected event location
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          <Stack spacing={1} className="event-planning-actions">
            <Button type="submit" variant="contained" disabled={submitting || loading} className="event-submit-button">
              {submitting ? "Sending event request..." : `Send to ${selectedProviders.length || "selected"} provider${selectedProviders.length === 1 ? "" : "s"}`}
            </Button>
            <Button type="button" onClick={onBrowse} sx={{ borderRadius: 2, textTransform: "none" }}>Browse providers</Button>
          </Stack>
        </Stack>
      </Paper>

      <Box className="event-sent-requests">
        <div className="event-sent-requests-heading">
          <Typography variant="h5">Your sent event requests</Typography>
          <span>{events.length} {events.length === 1 ? "request" : "requests"}</span>
        </div>
        {events.length === 0 ? <div className="event-requests-empty"><span aria-hidden="true">✦</span><Typography color="text.secondary">Your submitted event requests will appear here.</Typography></div> : (
          <Stack spacing={1.5}>
            {events.map((item) => (
              <Paper key={item.id} elevation={0} className="event-sent-request-card">
                <Typography variant="h6">{item.event_type} · {item.city}{item.state ? `, ${item.state}` : ""}</Typography>
                <Typography color="text.secondary">{item.event_date} · {item.guests} guests · Budget {item.budget ? `₹${item.budget}` : "Not provided"}</Typography>
                {item.services?.length > 0 && <Typography sx={{ mt: 1 }}>Services: {item.services.join(", ")}</Typography>}
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {item.providers.map((provider: any) => (
                    <Typography key={provider.provider_id} variant="body2">
                      {provider.business_name}: {provider.quote ? `Quote ₹${provider.quote.amount} (${provider.quote.status})` : provider.status}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
