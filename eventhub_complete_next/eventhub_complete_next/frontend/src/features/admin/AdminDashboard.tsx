import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";

export default function AdminDashboard() {
  const [tab, setTab] = useState("summary");
  const [summary, setSummary] = useState<any>({});
  const [providers, setProviders] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [accountError, setAccountError] = useState("");

  async function load() {
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
    setSupportMessages(nextSupportMessages);
  }

  useEffect(() => {
    void load();
  }, []);

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

  return (
    <main>
      <h1>Admin Console</h1>
      <div className="tabs">
        {["summary", "providers", "accounts", "catalog", "reports", "support"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "active" : ""}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "summary" && (
        <div className="stats">
          {Object.entries(summary).map(([key, value]) => (
            <div className="card" key={key}>
              <b>{String(value)}</b>
              <span>{key.replaceAll("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
      {tab === "providers" && (
        <div className="list">
          {providers.map((provider) => (
            <div className="card row" key={provider.id}>
              <div>
                <b>{provider.business_name}</b>
                <p>
                  {provider.category} · {provider.city}
                </p>
              </div>
              <span>
                <span className="badge">{provider.verification_status}</span>{" "}
                <button
                  onClick={async () => {
                    await api(
                      `/admin/providers/${provider.id}/verification?status=APPROVED`,
                      { method: "PATCH" },
                    );
                    await load();
                  }}
                >
                  Approve
                </button>{" "}
                <button
                  onClick={async () => {
                    await api(
                      `/admin/providers/${provider.id}/verification?status=REJECTED`,
                      { method: "PATCH" },
                    );
                    await load();
                  }}
                >
                  Reject
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
      {tab === "accounts" && (
        <section>
          <p>
            Disable an account to block login and remove provider listings.
            Existing sessions are blocked immediately.
          </p>
          {accountError && (
            <p role="alert" className="error">
              {accountError}
            </p>
          )}
          <div className="list">
            {accounts.length === 0 ? (
              <div className="card">No customer or provider accounts.</div>
            ) : (
              accounts.map((account) => (
                <div className="card row" key={account.id}>
                  <div>
                    <b>{account.full_name}</b>{" "}
                    <span className="badge">
                      {account.role === "PROVIDER"
                        ? "Service provider"
                        : account.role === "CUSTOMER_PROVIDER"
                          ? "Customer & service provider"
                          : "Customer"}
                    </span>
                    <p>
                      {account.email} · {account.phone || "No phone"}
                    </p>
                    {["PROVIDER", "CUSTOMER_PROVIDER"].includes(account.role) && (
                      <p>
                        {account.business_name || "Provider profile"} ·{" "}
                        {[account.city, account.state].filter(Boolean).join(", ") ||
                          "Location not set"}
                      </p>
                    )}
                  </div>
                  <span>
                    <span
                      className="badge"
                      style={
                        account.active
                          ? {}
                          : { background: "#f8dddd", color: "#8b1e1e" }
                      }
                    >
                      {account.active ? "Enabled" : "Disabled"}
                    </span>{" "}
                    <button
                      aria-label={`${account.active ? "Disable" : "Enable"} ${account.full_name}`}
                      onClick={() => setAccountStatus(account)}
                    >
                      {account.active ? "Disable" : "Enable"}
                    </button>
                  </span>
                </div>
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
          <p>Reply to customer messages from provider profiles. Replies appear in the customer’s in-app chat.</p>
          {supportMessages.length === 0 ? (
            <div className="card">No customer support messages yet.</div>
          ) : (
            <div className="list">
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
