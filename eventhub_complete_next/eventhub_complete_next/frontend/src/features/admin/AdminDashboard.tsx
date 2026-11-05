import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api/client";
import {
  isChatSoundEnabled,
  playChatNotification,
  setChatSoundEnabled,
} from "../../chatNotifications";

export default function AdminDashboard() {
  const [tab, setTab] = useState("summary");
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [summary, setSummary] = useState<any>({});
  const [providers, setProviders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [accountError, setAccountError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [supportError, setSupportError] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(isChatSoundEnabled);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);
  const [newSupportNotice, setNewSupportNotice] = useState("");
  const supportListRef = useRef<HTMLDivElement>(null);
  const lastSupportMessageIdRef = useRef(0);
  const initializedSupportRef = useRef(false);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  function updateSupportMessages(messages: any[]) {
    const newestId = messages.reduce(
      (highest, entry) => Math.max(highest, entry.id),
      0,
    );
    if (initializedSupportRef.current) {
      const incoming = messages.filter(
        (entry) =>
          entry.id > lastSupportMessageIdRef.current &&
          entry.sender_role !== "ADMIN",
      );
      if (incoming.length > 0) {
        setUnreadSupportCount((count) =>
          tabRef.current === "support" ? count : count + incoming.length,
        );
        setNewSupportNotice(
          incoming.length === 1
            ? `New support message from ${incoming[0].customer_name || "a customer"}.`
            : `${incoming.length} new customer support messages.`,
        );
        playChatNotification();
      }
    } else {
      initializedSupportRef.current = true;
    }
    lastSupportMessageIdRef.current = Math.max(
      lastSupportMessageIdRef.current,
      newestId,
    );
    setSupportMessages(messages);
  }

  async function load() {
    setLoadError("");
    try {
      const [
        nextSummary,
        nextProviders,
        nextAccounts,
        nextCategories,
        nextServices,
        nextReports,
        nextSupportMessages,
      ] = await Promise.all([
        api("/admin/summary"),
        api("/admin/providers"),
        api("/admin/users"),
        api("/admin/categories"),
        api("/admin/services"),
        api("/admin/reviews/reported"),
        api("/admin/support/messages"),
      ]);
      setSummary(nextSummary);
      setProviders(nextProviders);
      setAccounts(nextAccounts);
      setCategories(nextCategories);
      setServices(nextServices);
      setReports(nextReports);
      updateSupportMessages(nextSupportMessages);
    } catch (cause: unknown) {
      setLoadError(
        cause instanceof Error ? cause.message : "Unable to load admin data.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const messages = await api("/admin/support/messages");
        if (active) {
          updateSupportMessages(messages);
          setSupportError("");
        }
      } catch (cause: unknown) {
        if (active) {
          setSupportError(
            cause instanceof Error
              ? cause.message
              : "Unable to refresh support messages.",
          );
        }
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(refreshWhenVisible, 5000);
    refreshWhenVisible();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (tab === "support") setUnreadSupportCount(0);
  }, [tab]);

  useEffect(() => {
    if (tab === "support" && supportListRef.current) {
      supportListRef.current.scrollTop = 0;
    }
  }, [supportMessages, tab]);

  function toggleSound() {
    const enabled = !soundEnabled;
    setChatSoundEnabled(enabled);
    setSoundEnabled(enabled);
    if (enabled) playChatNotification();
  }

  async function setAccountStatus(account: any) {
    setAccountError("");
    try {
      await api(
        `/admin/users/${account.id}/status?active=${!account.active}`,
        { method: "PATCH" },
      );
      await load();
    } catch (cause: any) {
      setAccountError(cause.message || "Unable to update account status.");
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredAccounts = accounts.filter((account) => {
    const matchesRole =
      accountFilter === "all" ||
      (accountFilter === "customers" &&
        ["CUSTOMER", "CUSTOMER_PROVIDER"].includes(account.role)) ||
      (accountFilter === "providers" &&
        ["PROVIDER", "CUSTOMER_PROVIDER"].includes(account.role));
    const searchable = [
      account.full_name,
      account.email,
      account.phone,
      account.business_name,
      account.city,
      account.state,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesRole && (!normalizedSearch || searchable.includes(normalizedSearch));
  });
  const filteredProviders = providers.filter((provider) =>
    [
      provider.business_name,
      provider.category,
      provider.provider_type,
      provider.city,
      provider.owner?.full_name,
      provider.owner?.phone,
      provider.contact_phone,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  );
  const adminTabs = [
    ["summary", "Overview"],
    ["providers", "Service providers"],
    ["accounts", "Customers & accounts"],
    ["catalog", "Service catalog"],
    ["reports", "Review reports"],
    ["support", "Support inbox"],
  ];

  return (
    <main className="admin-console">
      <header className="admin-hero">
        <div>
          <span className="admin-eyebrow">EVENTHUB · PRIVATE WORKSPACE</span>
          <h1>Admin dashboard</h1>
          <p>Manage accounts, review providers, and oversee marketplace activity.</p>
        </div>
        <div className="admin-hero-actions">
          <span className="admin-access-label">Admin-only information</span>
          <button className="admin-sound-toggle" onClick={toggleSound}>
            Sound: {soundEnabled ? "On" : "Off"}
          </button>
        </div>
      </header>
      {loadError && <p role="alert" className="error">{loadError}</p>}
      {newSupportNotice && (
        <div className="admin-new-message" role="status">
          <span>{newSupportNotice}</span>
          <button onClick={() => setNewSupportNotice("")} aria-label="Dismiss new message notice">Dismiss</button>
        </div>
      )}
      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {adminTabs.map(([item, label]) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "active" : ""}
            role="tab"
            aria-selected={tab === item}
          >
            {label}
            {item === "support" && unreadSupportCount > 0 && (
              <span className="admin-unread-count" aria-label={`${unreadSupportCount} unread messages`}>
                {unreadSupportCount}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "summary" && (
        <>
          <div className="admin-welcome">
            <h2>Marketplace at a glance</h2>
            <p>Use the sections above to review accounts and take moderation actions.</p>
          </div>
          <div className="admin-stats">
            {[
              ["providers", "Service providers"],
              ["pending_providers", "Awaiting review"],
              ["bookings", "Bookings"],
              ["reported_reviews", "Reported reviews"],
              ["categories", "Service categories"],
              ["services", "Listed services"],
            ].map(([key, label]) => (
              <div className="admin-stat-card" key={key}>
                <b>{summary[key] ?? "—"}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="admin-privacy-note">
            Account contact and address details are private. Use them only for
            legitimate EventHub administration and support.
          </div>
        </>
      )}
      {tab === "providers" && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Service provider review</h2>
              <p>Review business profiles and manage verification and account access.</p>
            </div>
            <span>{filteredProviders.length} providers</span>
          </div>
          <label className="admin-search">
            <span>Search providers</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Business, owner, phone, or city"
            />
          </label>
          <div className="admin-record-list">
            {filteredProviders.length === 0 ? (
              <div className="admin-empty">No providers match this search.</div>
            ) : filteredProviders.map((provider) => (
              <article className="admin-record" key={provider.id}>
                <div className="admin-record-top">
                  <div>
                    <span className={`admin-status ${provider.verification_status?.toLowerCase()}`}>
                      {provider.verification_status || "UNREVIEWED"}
                    </span>
                    {!provider.owner?.active && <span className="admin-status disabled">ACCOUNT DISABLED</span>}
                    <h3>{provider.business_name}</h3>
                    <p>{provider.business_title || provider.provider_type || provider.category} · {[provider.city, provider.state].filter(Boolean).join(", ")}</p>
                    <p className="admin-record-meta">
                      Owner: {provider.owner?.full_name || "Unavailable"} · {provider.owner?.email || "No email"} · {provider.owner?.phone || "No phone"}
                    </p>
                  </div>
                  <div className="admin-actions">
                    <button onClick={async () => {
                      await api(`/admin/providers/${provider.id}/verification?status=APPROVED`, { method: "PATCH" });
                      await load();
                    }}>Approve</button>
                    <button onClick={async () => {
                      await api(`/admin/providers/${provider.id}/verification?status=REJECTED`, { method: "PATCH" });
                      await load();
                    }}>Reject</button>
                    <button onClick={() => setAccountStatus(provider.owner)}>
                      {provider.owner?.active ? "Disable account" : "Enable account"}
                    </button>
                  </div>
                </div>
                <details className="admin-details">
                  <summary>View private account and business details</summary>
                  <div className="admin-detail-grid">
                    <AdminDetail label="Provider phone" value={provider.contact_phone} />
                    <AdminDetail label="Alternate phone" value={provider.alternate_contact_phone} />
                    <AdminDetail label="Provider email" value={provider.contact_email} />
                    <AdminDetail label="Owner alternate phone" value={provider.owner?.alternate_contact_phone} />
                    <AdminDetail label="Service category" value={provider.category} />
                    <AdminDetail label="Experience" value={provider.years_experience ? `${provider.years_experience} years` : ""} />
                    <AdminDetail label="Service radius" value={provider.service_radius ? `${provider.service_radius} km` : ""} />
                    <AdminDetail label="Starting price" value={provider.starting_price ? `₹${provider.starting_price} / ${provider.price_unit || "event"}` : ""} />
                    <AdminDetail label="Owner account" value={provider.owner?.active ? "Enabled" : "Disabled"} />
                    <AdminDetail label="Email verification" value={provider.owner?.email_verified ? "Verified" : "Not verified"} />
                    <AdminDetail label="Preferred contact" value={provider.owner?.preferred_contact_method} />
                    <AdminDetail label="Languages" value={provider.owner?.preferred_languages?.join(", ")} />
                    <AdminDetail label="Account address" value={[
                      provider.owner?.address_line1,
                      provider.owner?.address_line2,
                      provider.owner?.locality,
                      provider.owner?.city,
                      provider.owner?.state,
                      provider.owner?.postal_code,
                    ].filter(Boolean).join(", ")} />
                    <AdminDetail label="Account created" value={formatAdminDate(provider.owner?.created_at)} />
                    <AdminDetail label="Provider profile created" value={formatAdminDate(provider.created_at)} />
                    <AdminDetail label="Business description" value={provider.description} />
                  </div>
                </details>
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "accounts" && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Customers and accounts</h2>
              <p>Review account status and private profile details or temporarily disable access.</p>
            </div>
            <span>{filteredAccounts.length} accounts</span>
          </div>
          {accountError && (
            <p role="alert" className="error">
              {accountError}
            </p>
          )}
          <div className="admin-filters">
            <label className="admin-search">
              <span>Search accounts</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, phone, or city"
              />
            </label>
            <label className="admin-search admin-filter-select">
              <span>Account type</span>
              <select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
                <option value="all">All accounts</option>
                <option value="customers">Customers</option>
                <option value="providers">Service providers</option>
              </select>
            </label>
          </div>
          <div className="admin-record-list">
            {filteredAccounts.length === 0 ? (
              <div className="admin-empty">No customer or provider accounts match this search.</div>
            ) : (
              filteredAccounts.map((account) => (
                <article className="admin-record" key={account.id}>
                  <div className="admin-record-top">
                    <div className="admin-account-heading">
                      <span className="admin-status">{account.role === "PROVIDER"
                        ? "SERVICE PROVIDER"
                        : account.role === "CUSTOMER_PROVIDER"
                          ? "CUSTOMER + PROVIDER"
                          : "CUSTOMER"}</span>
                      <span className={`admin-status ${account.active ? "approved" : "disabled"}`}>
                        {account.active ? "ENABLED" : "DISABLED"}
                      </span>
                      <h3>{account.full_name}</h3>
                      <p>{account.email || "No email"} · {account.phone || "No phone"}</p>
                      {account.business_name && <p>{account.business_name} · {[account.city, account.state].filter(Boolean).join(", ")}</p>}
                    </div>
                    <button
                      aria-label={`${account.active ? "Disable" : "Enable"} ${account.full_name}`}
                      onClick={() => setAccountStatus(account)}
                    >
                      {account.active ? "Disable account" : "Enable account"}
                    </button>
                  </div>
                  <details className="admin-details">
                    <summary>View private profile details</summary>
                    <div className="admin-detail-grid">
                      <AdminDetail label="Email verification" value={account.email_verified ? "Verified" : "Not verified"} />
                      <AdminDetail label="Alternate contact" value={account.alternate_contact_phone} />
                      <AdminDetail label="Preferred contact" value={account.preferred_contact_method} />
                      <AdminDetail label="Preferred languages" value={account.preferred_languages?.join(", ")} />
                      <AdminDetail label="City and state" value={[account.city, account.state].filter(Boolean).join(", ")} />
                      <AdminDetail label="Address" value={[
                        account.address_line1,
                        account.address_line2,
                        account.locality,
                        account.city,
                        account.state,
                        account.postal_code,
                      ].filter(Boolean).join(", ")} />
                      <AdminDetail label="Account created" value={formatAdminDate(account.created_at)} />
                    </div>
                  </details>
                </article>
              ))
            )}
          </div>
        </section>
      )}
      {tab === "catalog" && (
        <div className="two">
          <div className="card">
            <h2>Categories</h2>
            {categories.map((category) => (
              <p key={category.id}>
                <b>{category.name}</b> —{" "}
                {category.active ? "Active" : "Disabled"}
              </p>
            ))}
            <CategoryAdd onDone={load} />
          </div>
          <div className="card">
            <h2>Services</h2>
            {services.map((service) => (
              <p key={service.id}>
                {service.name} — {service.active ? "Active" : "Disabled"}
              </p>
            ))}
            <ServiceAdd categories={categories} onDone={load} />
          </div>
        </div>
      )}
      {tab === "reports" && (
        <div className="list">
          {reports.length === 0 ? (
            <div className="card">No reported reviews.</div>
          ) : (
            reports.map((report) => (
              <div className="card row" key={report.id}>
                <div>
                  <b>
                    Review #{report.id} · ★{report.rating}
                  </b>
                  <p>{report.comment}</p>
                  <small>Reason: {report.reason}</small>
                </div>
                <span>
                  <button
                    onClick={async () => {
                      await api(`/admin/reviews/${report.id}?action=hide`, {
                        method: "PATCH",
                      });
                      await load();
                    }}
                  >
                    Hide
                  </button>
                  <button
                    onClick={async () => {
                      await api(
                        `/admin/reviews/${report.id}?action=dismiss_report`,
                        { method: "PATCH" },
                      );
                      await load();
                    }}
                  >
                    Dismiss
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}
      {tab === "support" && (
        <section>
          <h2>Customer support chat</h2>
          <p>New messages appear automatically while this dashboard is open. Sound alerts are {soundEnabled ? "on" : "off"}.</p>
          {supportError && <p role="alert" className="error">{supportError}</p>}
          {supportMessages.length === 0 ? (
            <div className="card">No customer support messages yet.</div>
          ) : (
            <div className="list admin-support-list" ref={supportListRef}>
              {[...supportMessages].reverse().map((entry) => (
                <div className="card" key={entry.id}>
                  <b>
                    {entry.sender_role === "ADMIN" ? "EventHub support" : entry.customer_name}
                    {entry.sender_role !== "ADMIN" && ` · ${entry.customer_phone || "No phone"}`}
                  </b>
                  <p>{entry.provider_name}</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{entry.message}</p>
                  <small>{new Date(entry.created_at).toLocaleString()}</small>
                  {entry.sender_role !== "ADMIN" && (
                    <SupportReply
                      customerId={entry.customer_id}
                      providerId={entry.provider_id}
                      onDone={load}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function AdminDetail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="admin-detail">
      <span>{label}</span>
      <strong>{value?.trim() || "Not provided"}</strong>
    </div>
  );
}

function formatAdminDate(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function SupportReply({
  customerId,
  providerId,
  onDone,
}: {
  customerId: number;
  providerId: number | null;
  onDone: () => Promise<void>;
}) {
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await api(`/admin/support/messages/${customerId}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: reply, provider_id: providerId }),
      });
      setReply("");
      await onDone();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to send reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="inline" onSubmit={submit}>
      <input
        aria-label="Reply to customer"
        placeholder="Write a support reply"
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        maxLength={2000}
        required
      />
      <button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Reply"}
      </button>
      {error && <span role="alert" className="error">{error}</span>}
    </form>
  );
}

function CategoryAdd({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");

  async function add() {
    await api("/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setName("");
    onDone();
  }

  return (
    <div className="inline">
      <input
        placeholder="New category"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button onClick={add}>Add</button>
    </div>
  );
}

function ServiceAdd({
  categories,
  onDone,
}: {
  categories: any[];
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");

  async function add() {
    await api("/admin/services", {
      method: "POST",
      body: JSON.stringify({ name, category_id: Number(categoryId) }),
    });
    setName("");
    onDone();
  }

  return (
    <div className="inline">
      <input
        placeholder="New service"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <select
        value={categoryId}
        onChange={(event) => setCategoryId(Number(event.target.value))}
      >
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button onClick={add}>Add</button>
    </div>
  );
}
