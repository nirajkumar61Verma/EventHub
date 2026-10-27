import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";

export default function ProviderDashboard({
  initialTab = "enquiries",
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
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
    <main className="provider-dashboard">
      <header className="provider-dashboard-hero">
        <div>
          <p className="provider-dashboard-eyebrow">YOUR EVENTHUB BUSINESS</p>
          <h1>Provider Dashboard</h1>
          <p>Manage your enquiries, bookings, and the profile customers see.</p>
        </div>
        {tab === "profile" && form.verification_status && (
          <span className={`provider-verification-status ${String(form.verification_status).toLowerCase()}`}>
            {String(form.verification_status).replaceAll("_", " ")}
          </span>
        )}
      </header>
      <div className="tabs provider-dashboard-tabs" aria-label="Provider dashboard sections">
        {["enquiries", "bookings", "profile", "availability"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
          >
            {item === "profile" ? "Edit profile" : item[0].toUpperCase() + item.slice(1)}
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
            <form className="provider-profile-form" onSubmit={save}>
              <section className="provider-profile-editor-intro">
                {form.logo_data ? (
                  <img className="provider-logo-preview" src={form.logo_data} alt="Business logo preview" />
                ) : (
                  <span className="provider-logo-placeholder" aria-hidden="true">
                    {(form.business_name || "E").trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="provider-dashboard-eyebrow">YOUR PUBLIC LISTING</p>
                  <h2>{form.business_name || "Tell customers about your service"}</h2>
                  <p>Keep your service details current so customers can find the right event professional.</p>
                </div>
              </section>

              <section className="provider-profile-section">
                <div className="provider-profile-section-heading">
                  <span>01</span>
                  <div><h3>Business details</h3><p>Introduce your service and the people behind it.</p></div>
                </div>
                <div className="provider-profile-fields">
                  <label htmlFor="provider-business-name">Business or professional name <span>*</span>
                    <input id="provider-business-name" required maxLength={180} value={form.business_name || ""} onChange={(event) => setForm({ ...form, business_name: event.target.value })} />
                  </label>
                  <label htmlFor="provider-business-title">Profile title or tagline
                    <input id="provider-business-title" maxLength={180} value={form.business_title || ""} onChange={(event) => setForm({ ...form, business_title: event.target.value })} placeholder="e.g. Creating joyful celebrations, one detail at a time" />
                  </label>
                  <label htmlFor="provider-category">Service you provide <span>*</span>
                    <input id="provider-category" required maxLength={120} value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Mehndi artist, DJ, event planner" />
                  </label>
                  <label htmlFor="provider-description" className="provider-profile-field-wide">About your service
                    <textarea id="provider-description" rows={4} maxLength={4000} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Tell customers about your experience, style, and what makes your service special." />
                  </label>
                </div>
              </section>

              <section className="provider-profile-section">
                <div className="provider-profile-section-heading">
                  <span>02</span>
                  <div><h3>Location and service area</h3><p>Help customers understand where you work.</p></div>
                </div>
                <div className="provider-profile-fields">
                  <label htmlFor="provider-city">City <span>*</span>
                    <input id="provider-city" required maxLength={100} value={form.city || ""} onChange={(event) => setForm({ ...form, city: event.target.value })} />
                  </label>
                  <label htmlFor="provider-state">State / Union Territory <span>*</span>
                    <input id="provider-state" required maxLength={100} value={form.state || ""} onChange={(event) => setForm({ ...form, state: event.target.value })} />
                  </label>
                  <label htmlFor="provider-radius">Service radius (km)
                    <input id="provider-radius" type="number" min={1} value={form.service_radius ?? 25} onChange={(event) => setForm({ ...form, service_radius: Number(event.target.value) })} />
                  </label>
                  <label htmlFor="provider-experience">Years of experience
                    <input id="provider-experience" type="number" min={0} value={form.years_experience ?? 0} onChange={(event) => setForm({ ...form, years_experience: Number(event.target.value) })} />
                  </label>
                </div>
              </section>

              <section className="provider-profile-section">
                <div className="provider-profile-section-heading">
                  <span>03</span>
                  <div><h3>Pricing and brand</h3><p>Share an indicative starting price and add a recognizable logo.</p></div>
                </div>
                <div className="provider-profile-fields">
                  <label htmlFor="provider-price">Starting price (₹)
                    <input id="provider-price" type="number" min={0} step="any" value={form.starting_price ?? 0} onChange={(event) => setForm({ ...form, starting_price: Number(event.target.value) })} />
                  </label>
                  <label htmlFor="provider-price-unit">Price applies per
                    <select id="provider-price-unit" value={form.price_unit || "event"} onChange={(event) => setForm({ ...form, price_unit: event.target.value })}>
                      {["event", "hour", "day", "person", "package"].map((unit) => <option key={unit} value={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>)}
                    </select>
                  </label>
                  <div className="provider-logo-editor provider-profile-field-wide">
                    <div><strong>Business logo or profile image</strong><small>PNG, JPEG, or WebP, up to 512 KB.</small></div>
                    <div className="provider-logo-control">
                      <label className="button-label" htmlFor="provider-logo-upload">Upload logo</label>
                      <input id="provider-logo-upload" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { void uploadLogo(event.target.files?.[0]); event.target.value = ""; }} />
                      {form.logo_data && <button type="button" onClick={() => setForm({ ...form, logo_data: "" })}>Remove logo</button>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="provider-profile-section">
                <div className="provider-profile-section-heading">
                  <span>04</span>
                  <div><h3>Contact details</h3><p>Set a public contact number customers can use without exposing your sign-in phone.</p></div>
                </div>
                <div className="provider-profile-fields">
                  <label htmlFor="provider-contact-email">Public email address (optional)
                    <input id="provider-contact-email" type="email" autoComplete="email" maxLength={255} value={form.contact_email || ""} onChange={(event) => setForm({ ...form, contact_email: event.target.value })} placeholder="you@example.com" />
                  </label>
                  <label htmlFor="provider-alternate-contact-phone">Public contact mobile number (optional)
                    <input id="provider-alternate-contact-phone" type="tel" autoComplete="tel" maxLength={30} value={form.alternate_contact_phone || ""} onChange={(event) => setForm({ ...form, alternate_contact_phone: event.target.value })} placeholder="+91 98765 43210" />
                  </label>
                  <p className="provider-contact-privacy provider-profile-field-wide">Your primary mobile number is for signing in and is not shown here. The alternative number and public email are visible to anyone viewing your public EventHub profile.</p>
                </div>
              </section>

              <section className="provider-profile-section">
                <div className="provider-profile-section-heading">
                  <span>05</span>
                  <div><h3>Social links</h3><p>Optional links where customers can learn more about your work.</p></div>
                </div>
                <div className="provider-profile-fields">
                  {socialFields.map(([key, label, placeholder]) => (
                    <label key={key} htmlFor={`provider-${key}`}>{label}
                      <input id={`provider-${key}`} type="url" maxLength={500} value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} placeholder={placeholder} />
                    </label>
                  ))}
                </div>
              </section>
              {form.verification_status && (
                <p className="provider-profile-review-note">Saving profile changes sends the listing back for provider review.</p>
              )}
              {message && <p role="status" className="provider-profile-save-message">{message}</p>}
              <div className="provider-profile-save-row">
                <span>Fields marked <strong>*</strong> are required.</span>
                <button className="primary" type="submit" disabled={saving}>{saving ? "Saving your profile..." : "Save profile changes"}</button>
              </div>
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
