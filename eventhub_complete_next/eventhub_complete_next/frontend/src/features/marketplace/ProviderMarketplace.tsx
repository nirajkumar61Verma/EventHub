import { useEffect, useState, type MouseEvent } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { api } from "../../api/client";
import { indiaLocations, indianStates } from "../../indiaLocations";

type ProviderMarketplaceProps = {
  user: any;
  onOpen: (id: number) => void;
  onLogin: (providerId: number) => void;
  onSignup: (providerId: number) => void;
};

export default function ProviderMarketplace({
  user,
  onOpen,
  onLogin,
  onSignup,
}: ProviderMarketplaceProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [shortlisted, setShortlisted] = useState<number[]>([]);
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shortlistError, setShortlistError] = useState("");
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [requestedProviderId, setRequestedProviderId] = useState(0);

  function viewProvider(providerId: number) {
    if (!user) {
      setRequestedProviderId(providerId);
      setLoginPromptOpen(true);
      return;
    }
    onOpen(providerId);
  }

  useEffect(() => {
    api("/providers")
      .then(setRows)
      .catch((cause: any) =>
        setError(cause.message || "Unable to load service providers."),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role)) {
      api("/customer/shortlist")
        .then((entries: any[]) =>
          setShortlisted(entries.map((entry) => entry.provider_id)),
        )
        .catch(() => setShortlisted([]));
    } else {
      setShortlisted([]);
    }
  }, [user?.role]);

  async function addToShortlist(providerId: number, event?: MouseEvent) {
    event?.stopPropagation();
    if (!["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role)) {
      onLogin();
      return;
    }
    try {
      setShortlistError("");
      await api("/customer/shortlist", {
        method: "POST",
        body: JSON.stringify({ provider_id: providerId, note: "" }),
      });
      setShortlisted((current) =>
        current.includes(providerId) ? current : [...current, providerId],
      );
    } catch (cause: any) {
      setShortlistError(
        cause.message || "Unable to add planner to your shortlist.",
      );
    }
  }

  const services = [
    ...new Set(
      rows.flatMap((provider) => [
        provider.provider_type || provider.category,
        ...(provider.offerings || []).map((offering: { category: string }) => offering.category),
      ]).filter((type) => type && type.toLowerCase() !== "service"),
    ),
  ].sort((first, second) => first.localeCompare(second));
  const availableCities = [
    ...new Set([
      ...(state ? indiaLocations[state] || [] : []),
      ...rows
        .filter((provider) => !state || !provider.state || provider.state === state)
        .map((provider) => provider.city)
        .filter(Boolean),
    ]),
  ].sort((first, second) => first.localeCompare(second));
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = rows.filter((provider) => {
    const type = provider.provider_type || provider.category || "";
    const offerings = provider.offerings || [];
    const matchesService = !service || type === service || offerings.some(
      (offering: { category: string }) => offering.category === service,
    );
    const matchesState = !state || provider.state === state;
    const matchesCity =
      !city || String(provider.city || "").toLowerCase() === city.toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      [
        provider.business_name,
        type,
        ...offerings.map((offering: { title: string; category: string }) =>
          `${offering.title} ${offering.category}`,
        ),
        provider.city,
        provider.state,
        provider.description,
      ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    return matchesService && matchesState && matchesCity && matchesQuery;
  });

  function clearFilters() {
    setQuery("");
    setService("");
    setState("");
    setCity("");
  }

  return (
    <main className="provider-marketplace">
      <section className="provider-marketplace-hero">
        <div className="marketplace-hero-copy">
          <p className="eyebrow">THE CELEBRATION STARTS HERE</p>
          <h1>Meet your event’s dream team.</h1>
          <p>
            From wedding photographers to birthday DJs, discover people who can
            help bring your celebration to life.
          </p>
        </div>
        <div className="provider-marketplace-decoration" aria-hidden="true">
          <span className="marketplace-decoration-sparkle">✦</span>
          <span className="marketplace-decoration-flower">✿</span>
          <span className="marketplace-decoration-ring" />
          <span className="marketplace-decoration-tag">MADE FOR YOUR MOMENT</span>
        </div>
        <div className="provider-filters">
          <input
            aria-label="Search providers"
            placeholder="Search service, city, or business"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="provider-search-input"
          />
          <select
            aria-label="Filter by service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            className="provider-filter-select"
          >
            <option value="">All services</option>
            {services.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by state"
            value={state}
            onChange={(event) => {
              setState(event.target.value);
              setCity("");
            }}
            className="provider-filter-select"
          >
            <option value="">All states / UTs</option>
            {indianStates.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="provider-filter-select"
            disabled={availableCities.length === 0}
          >
            <option value="">All cities</option>
            {availableCities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {(query || service || state || city) && (
          <button
            type="button"
            className="provider-clear-filters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
        {!loading && !error && (
          <div className="provider-count-row">
            <p className="provider-count">
              <strong>{filtered.length}</strong> of {rows.length} event
              professionals
            </p>
            <span className="provider-count-note">Find the right people for your day</span>
          </div>
        )}
      </section>
      {error && (
        <p role="alert" className="error provider-marketplace-message">
          {error}
        </p>
      )}
      {shortlistError && (
        <p role="alert" className="error provider-marketplace-message">
          {shortlistError}
        </p>
      )}
      {loading ? (
        <p className="provider-marketplace-message">Finding your event professionals...</p>
      ) : !error && filtered.length === 0 ? (
        <section className="provider-empty-state">
          <span aria-hidden="true">✿</span>
          <h2>No matches just yet</h2>
          <p>Try another service or location to find more event professionals.</p>
          <button type="button" className="provider-clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        </section>
      ) : (
        <div className="grid provider-card-grid">
          {filtered.map((provider) => {
            const type =
              provider.provider_type || provider.category || "Event services";
            const additionalServices = [...new Set((provider.offerings || [])
              .map((offering: { category: string }) => offering.category)
              .filter((category: string) => category && category.toLowerCase() !== type.toLowerCase()))];
            const isVerified = Boolean(provider.verified);
            return (
              <article
                className="card provider-card"
                key={provider.id}
                onClick={() => viewProvider(provider.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    viewProvider(provider.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View ${provider.business_name} profile`}
              >
                <div className="provider-card-topline">
                  <div className="avatar provider-card-avatar">
                    {provider.business_name?.[0] || "E"}
                  </div>
                  <span className={`provider-verification ${isVerified ? "is-verified" : "is-pending"}`}>
                    <span aria-hidden="true">{isVerified ? "✓" : "✦"}</span>
                    {isVerified
                      ? "Verified"
                      : provider.verification_status || "Pending review"}
                  </span>
                </div>
                <div className="provider-card-heading">
                  <h2>{provider.business_name}</h2>
                  {provider.business_title && (
                    <p className="provider-card-title">{provider.business_title}</p>
                  )}
                </div>
                <div className="provider-card-location">
                  <span>{type}</span>
                  <span aria-hidden="true">·</span>
                  <span>{provider.city}</span>
                </div>
                {additionalServices.length > 0 && (
                  <div className="provider-card-details">
                    <span>Also offers: {additionalServices.join(", ")}</span>
                  </div>
                )}
                <div className="provider-card-details">
                  <span>{provider.years_experience || 0} years experience</span>
                  <span>Travel radius {provider.service_radius || 25} km</span>
                </div>
                <div className="provider-card-rating">
                  <span aria-label={`${provider.rating || "New"} star rating`}>★</span>
                  <strong>{provider.rating || "New"}</strong>
                  <span>· {provider.review_count || 0} reviews</span>
                </div>
                <div className="provider-card-footer">
                  <strong>
                    {Number(provider.starting_price) > 0 ? (
                      <>
                        <span>Starting from</span>
                        ₹{Number(provider.starting_price).toLocaleString("en-IN")}
                        <small> / {provider.price_unit || "event"}</small>
                      </>
                    ) : (
                      <>
                        <span>Pricing</span>
                        Contact for price
                      </>
                    )}
                  </strong>
                  <span className="provider-view-profile">View profile <span aria-hidden="true">→</span></span>
                </div>
                {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
                  <div className="provider-card-actions">
                    <button
                      className="provider-shortlist-button"
                      type="button"
                      aria-label={
                        shortlisted.includes(provider.id)
                          ? `${provider.business_name} is shortlisted`
                          : `Shortlist ${provider.business_name}`
                      }
                      onClick={(event) => addToShortlist(provider.id, event)}
                      disabled={shortlisted.includes(provider.id)}
                    >
                      {shortlisted.includes(provider.id)
                        ? "Added to shortlist"
                        : "Shortlist planner"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      <Dialog
        open={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        aria-labelledby="provider-login-prompt-title"
      >
        <DialogTitle id="provider-login-prompt-title">
          Sign in to view provider details
        </DialogTitle>
        <DialogContent>
          <Typography>
            You can browse providers here. Sign in or create an account to see a
            provider’s full profile, offerings, reviews, and contact options.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLoginPromptOpen(false)}>Keep browsing</Button>
          <Button
            onClick={() => {
              setLoginPromptOpen(false);
              onSignup(requestedProviderId);
            }}
          >
            Sign up
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setLoginPromptOpen(false);
              onLogin(requestedProviderId);
            }}
          >
            Log in
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}
