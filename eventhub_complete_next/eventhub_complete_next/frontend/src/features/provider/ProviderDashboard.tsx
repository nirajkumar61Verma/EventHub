import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";

export default function ProviderDashboard() {
  const [tab, setTab] = useState("enquiries");
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextEnquiries, nextBookings, profile] = await Promise.all([
        api("/provider/enquiries"),
        api("/provider/bookings"),
        api("/provider/profile"),
      ]);
      setEnquiries(nextEnquiries);
      setBookings(nextBookings);
      setForm(profile);
    } catch (cause: any) {
      setError(cause.message || "Unable to load provider dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await api("/provider/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setForm(saved);
      setMessage("Provider profile saved.");
    } catch (cause: any) {
      setError(cause.message || "Unable to save provider profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file?: File) {
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
        setForm((current: any) => ({ ...current, logo_data: reader.result }));
      } else {
        setError("Unable to read the selected logo image.");
      }
    };
    reader.onerror = () => setError("Unable to read the selected logo image.");
    reader.readAsDataURL(file);
  }

  return (
    <main>
      <h1>Provider Dashboard</h1>
      <div className="tabs">
        {["enquiries", "bookings", "profile", "availability"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "active" : ""}
          >
            {item}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading ? (
        <p>Loading provider dashboard...</p>
      ) : (
        <>
          {tab === "enquiries" && (
            <div className="list">
              {enquiries.length === 0 ? (
                <div className="card">No enquiries yet.</div>
              ) : (
                enquiries.map((request) => (
                  <div className="card row" key={request.id}>
                    <div>
                      <b>
                        {request.event_type} · {request.city}
                        {request.state ? `, ${request.state}` : ""}
                      </b>
                      <p>
                        {request.event_date} · {request.guests} guests · Budget{" "}
                        {request.budget ? `₹${request.budget}` : "Not provided"}
                      </p>
                      {request.services?.length > 0 && (
                        <p>Services requested: {request.services.join(", ")}</p>
                      )}
                      {request.details && <p>{request.details}</p>}
                    </div>
                    {request.quote ? (
                      <span className="badge">
                        {request.quote.status} ₹{request.quote.amount}
                      </span>
                    ) : (
                      <Quote requestId={request.id} onDone={() => void load()} />
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "bookings" && (
            <div className="list">
              {bookings.length === 0 ? (
                <div className="card">No bookings yet.</div>
              ) : (
                bookings.map((booking) => (
                  <div className="card row" key={booking.id}>
                    <div>
                      <b>Booking #{booking.id}</b>
                      <p>₹{booking.amount}</p>
                    </div>
                    <select
                      value={booking.status}
                      onChange={async (event) => {
                        try {
                          await api(
                            `/provider/bookings/${booking.id}?status=${event.target.value}`,
                            { method: "PATCH" },
                          );
                          await load();
                        } catch (cause: any) {
                          setError(cause.message || "Unable to update booking.");
                        }
                      }}
                    >
                      <option>CONFIRMED</option>
                      <option>IN_PROGRESS</option>
                      <option>COMPLETED</option>
                      <option>CANCELLED</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "profile" && (
            <form
              className="card form provider-profile-form"
              onSubmit={save}
            >
              <h2>Public provider profile</h2>
              <label htmlFor="provider-business-name">Business name</label>
              <input
                id="provider-business-name"
                required
                maxLength={180}
                value={form.business_name || ""}
                onChange={(event) =>
                  setForm({ ...form, business_name: event.target.value })
                }
              />
              <label htmlFor="provider-business-title">
                Business title or tagline
              </label>
              <input
                id="provider-business-title"
                maxLength={180}
                value={form.business_title || ""}
                onChange={(event) =>
                  setForm({ ...form, business_title: event.target.value })
                }
                placeholder="e.g. Creating joyful celebrations, one detail at a time"
              />
              <label htmlFor="provider-category">Provider type</label>
              <input
                id="provider-category"
                required
                value={form.category || ""}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              />
              <label htmlFor="provider-city">City</label>
              <input
                id="provider-city"
                value={form.city || ""}
                onChange={(event) =>
                  setForm({ ...form, city: event.target.value })
                }
              />
              <label htmlFor="provider-description">Business description</label>
              <textarea
                id="provider-description"
                rows={4}
                value={form.description || ""}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
              <label htmlFor="provider-price">Starting price</label>
              <input
                id="provider-price"
                type="number"
                min={0}
                value={form.starting_price || 0}
                onChange={(event) =>
                  setForm({
                    ...form,
                    starting_price: Number(event.target.value),
                  })
                }
              />
              <label>Business logo or profile icon</label>
              <div className="provider-logo-control">
                {form.logo_data && (
                  <img
                    className="provider-logo-preview"
                    src={form.logo_data}
                    alt="Business logo preview"
                  />
                )}
                <label className="button-label">
                  Upload logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      void uploadLogo(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
                {form.logo_data && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_data: "" })}
                  >
                    Remove logo
                  </button>
                )}
                <small>PNG, JPEG, or WebP; maximum 512 KB.</small>
              </div>
              <h3>Social media and website links</h3>
              {socialFields.map(([key, label, placeholder]) => (
                <div key={key} className="provider-social-field">
                  <label htmlFor={`provider-${key}`}>{label}</label>
                  <input
                    id={`provider-${key}`}
                    type="url"
                    maxLength={500}
                    value={form[key] || ""}
                    onChange={(event) =>
                      setForm({ ...form, [key]: event.target.value })
                    }
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <button className="primary" type="submit" disabled={saving}>
                {saving ? "Saving profile..." : "Save profile"}
              </button>
              {message && <p role="status">{message}</p>}
            </form>
          )}
          {tab === "availability" && <Availability />}
        </>
      )}
    </main>
  );
}

function Quote({
  requestId,
  onDone,
}: {
  requestId: number;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  async function submit() {
    await api(`/quote-requests/${requestId}/quote`, {
      method: "POST",
      body: JSON.stringify({ amount, unit: "event", notes }),
    });
    setOpen(false);
    onDone();
  }

  return open ? (
    <div className="quote">
      <input
        type="number"
        placeholder="Amount"
        onChange={(event) => setAmount(Number(event.target.value))}
      />
      <input
        placeholder="Notes"
        onChange={(event) => setNotes(event.target.value)}
      />
      <button onClick={submit}>Submit</button>
    </div>
  ) : (
    <button onClick={() => setOpen(true)}>Submit quote</button>
  );
}

function Availability() {
  const [date, setDate] = useState("");

  async function save() {
    await api(
      `/provider/availability?day=${encodeURIComponent(date)}&available=true`,
      { method: "POST" },
    );
    setDate("");
  }

  return (
    <div className="card">
      <h2>Availability</h2>
      <input
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <button onClick={save}>Mark available</button>
    </div>
  );
}

const socialFields: [string, string, string][] = [
  ["instagram_url", "Instagram", "https://instagram.com/yourbusiness"],
  ["facebook_url", "Facebook", "https://facebook.com/yourbusiness"],
  ["youtube_url", "YouTube", "https://youtube.com/@yourbusiness"],
  ["linkedin_url", "LinkedIn", "https://linkedin.com/company/yourbusiness"],
  ["website_url", "Website", "https://yourbusiness.com"],
];
