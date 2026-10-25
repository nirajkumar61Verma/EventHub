import { useEffect, useState, type MouseEvent } from "react";
import { api } from "../../api/client";
import { indiaLocations, indianStates } from "../../indiaLocations";

type ProviderMarketplaceProps = {
  user: any;
  onOpen: (id: number) => void;
  onLogin: () => void;
};

export default function ProviderMarketplace({
  user,
  onOpen,
  onLogin,
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
      rows.map((provider) => provider.provider_type || provider.category).filter(Boolean),
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
    const matchesService = !service || type === service;
    const matchesState = !state || provider.state === state;
    const matchesCity =
      !city || String(provider.city || "").toLowerCase() === city.toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      [
        provider.business_name,
        type,
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
    <main>
      <div className="hero">
        <p className="eyebrow">EVENTHUB MARKETPLACE</p>
        <h1>Find your event professionals.</h1>
        <p>
          Search by service or location, or combine filters to find the right
          provider.
        </p>
        <div
          className="provider-filters"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
            gap: 10,
            alignItems: "center",
          }}
        >
          <input
            aria-label="Search providers"
            placeholder="Search service, city, or business"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{
              width: "100%",
              padding: "16px",
              border: "1px solid #d7d0c5",
              borderRadius: 12,
              background: "#fff",
              marginTop: 18,
            }}
          />
          <select
            aria-label="Filter by service"
            value={service}
            onChange={(event) => setService(event.target.value)}
            style={filterStyle}
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
            style={filterStyle}
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
            style={filterStyle}
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
          <button type="button" onClick={clearFilters} style={{ marginTop: 12 }}>
            Clear filters
          </button>
        )}
        {!loading && !error && (
          <p className="provider-count">
            Showing {filtered.length} of {rows.length} service providers
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {shortlistError && (
        <p role="alert" className="error">
          {shortlistError}
        </p>
      )}
      {loading ? (
        <p>Loading service providers...</p>
      ) : !error && filtered.length === 0 ? (
        <p>No service providers match these filters.</p>
      ) : (
        <div className="grid">
          {filtered.map((provider) => {
            const type =
              provider.provider_type || provider.category || "Event services";
            return (
              <article
                className="card"
                key={provider.id}
                onClick={() => onOpen(provider.id)}
              >
                <div className="avatar">{provider.business_name?.[0] || "E"}</div>
                <h2>
                  {provider.business_name}{" "}
                  <span className="badge">
                    {provider.verified
                      ? "Verified"
                      : provider.verification_status || "Pending"}
                  </span>
                </h2>
                {provider.business_title && <p>{provider.business_title}</p>}
                <p>
                  {type} · {provider.city}
                </p>
                <p>
                  {provider.years_experience || 0} years experience · Service
                  radius {provider.service_radius || 25} km
                </p>
                <p>
                  ★ {provider.rating || "New"} · {provider.review_count || 0} reviews
                </p>
                <strong>
                  From ₹{provider.starting_price || 0} /{" "}
                  {provider.price_unit || "event"}
                </strong>
                {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
                  <div>
                    <button
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
    </main>
  );
}

const filterStyle = {
  width: "100%",
  padding: "16px",
  border: "1px solid #d7d0c5",
  borderRadius: 12,
  background: "#fff",
  marginTop: 18,
};
