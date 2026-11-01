import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../../api/client";

type Offering = {
  title: string;
  category: string;
  description: string;
  inclusions: string;
  price: string | number;
  price_unit: string;
  minimum_quantity: string | number;
  event_types: string[];
  all_events: boolean;
};

const applicableEventTypes = [
  "Wedding",
  "Birthday",
  "Engagement",
  "Anniversary",
  "Baby shower",
  "Graduation",
  "Corporate event",
  "Family celebration",
];
const suggestedServiceCategories = [
  "Anchor / Emcee",
  "Cakes & Desserts",
  "Catering",
  "Decoration",
  "DJ and Sound",
  "Entertainment",
  "Event Planner",
  "Florist",
  "Makeup",
  "Mehndi Art",
  "Music & DJ",
  "Photography",
  "Venue",
  "Videography",
  "Wedding Planner",
];
const customEventTypeMarker = "__custom_event_type__";

function customEventTypes(offering: Offering) {
  return offering.event_types.filter((eventType) =>
    eventType !== customEventTypeMarker && !applicableEventTypes.includes(eventType),
  );
}

const emptyOffering = (): Offering => ({
  title: "",
  category: "Service",
  description: "",
  inclusions: "",
  price: "",
  price_unit: "event",
  minimum_quantity: "",
  event_types: [],
  all_events: false,
});

export default function ProviderDashboard({
  initialTab = "enquiries",
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [customerMessages, setCustomerMessages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    try {
      const [nextEnquiries, nextMessages, nextBookings, profile, nextOfferings] = await Promise.all([
        api("/provider/enquiries"),
        api("/provider/messages"),
        api("/provider/bookings"),
        api("/provider/profile"),
        api("/provider/offerings"),
      ]);
      setEnquiries(nextEnquiries);
      setCustomerMessages(nextMessages);
      setBookings(nextBookings);
      setForm(profile);
      setOfferings(nextOfferings);
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

  async function saveOfferings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await api("/provider/offerings", {
        method: "PUT",
        body: JSON.stringify({
          offerings: offerings.map((offering) => ({
            ...offering,
            price: Number(offering.price),
            minimum_quantity: offering.minimum_quantity === "" ? null : Number(offering.minimum_quantity),
            event_types: offering.event_types.filter((eventType) => eventType !== customEventTypeMarker),
          })),
        }),
      });
      setOfferings(saved);
      setMessage("Your service menu and prices are now visible on your public profile.");
    } catch (cause: any) {
      setError(cause.message || "Unable to save your service menu.");
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
        {["enquiries", "messages", "bookings", "offerings", "profile", "availability"].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? "active" : ""}
            aria-current={tab === item ? "page" : undefined}
          >
            {item === "profile" ? "Edit profile" : item === "offerings" ? "Services & menu" : item[0].toUpperCase() + item.slice(1)}
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
                      {tab === "messages" && (
                        <div className="list provider-inbox">
                          {customerMessages.length === 0 ? (
                            <div className="card">No custom messages yet. Messages from customers will appear here.</div>
                          ) : (
                            customerMessages.map((item) => (
                              <article className="card provider-inbox-message" key={item.id}>
                                <div className="provider-inbox-message-heading">
                                  <strong>{item.customer_name}</strong>
                                  <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
                                </div>
                                <p>{item.message}</p>
                              </article>
                            ))
                          )}
                        </div>
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
                  <label htmlFor="provider-category">Primary service you provide <span>*</span>
                    <input id="provider-category" list="provider-service-suggestions" required maxLength={120} value={form.category || ""} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="e.g. Mehndi artist, DJ, event planner" />
                  </label>
                  <datalist id="provider-service-suggestions">
                    {suggestedServiceCategories.map((service) => (
                      <option key={service} value={service} />
                    ))}
                  </datalist>
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
                  <div><h3>Starting price and brand</h3><p>Set an optional profile starting rate. Add separate services, menus, or packages with their own prices in Services &amp; menu.</p></div>
                </div>
                <div className="provider-profile-fields">
                  <label htmlFor="provider-price">Starting price (₹)
                    <input id="provider-price" type="number" min={0} step="any" value={form.starting_price ?? 0} onChange={(event) => setForm({ ...form, starting_price: Number(event.target.value) })} />
                  </label>
                  <label htmlFor="provider-price-unit">Price applies per
                    <select id="provider-price-unit" value={form.price_unit || "event"} onChange={(event) => setForm({ ...form, price_unit: event.target.value })}>
                      {["event", "hour", "day", "plate", "person", "package"].map((unit) => <option key={unit} value={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>)}
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
          {tab === "offerings" && (
            <form className="provider-profile-form" onSubmit={saveOfferings}>
              <section className="provider-profile-editor-intro">
                <div>
                  <p className="provider-dashboard-eyebrow">YOUR PUBLIC SERVICE MENU</p>
                  <h2>Show customers exactly what you offer</h2>
                  <p>Add each service, menu item, or package separately. Set its service category, price unit (plate, person, hour, day, event, or package), inclusions, and supported events. You can return here after signup or profile edits to add or update up to 50 items; saved items appear on your public profile and can be found in the marketplace and event planner.</p>
                </div>
              </section>
              {offerings.map((offering, index) => (
                <section className="provider-profile-section provider-offering-editor" key={index}>
                  <div className="provider-profile-section-heading">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><h3>{offering.title || `Offering ${index + 1}`}</h3><p>Describe the scope and how the price is calculated.</p></div>
                    <button className="provider-offering-remove" type="button" onClick={() => setOfferings((current) => current.filter((_, currentIndex) => currentIndex !== index))}>Remove</button>
                  </div>
                  <div className="provider-profile-fields">
                    <label>Item or service name <span>*</span>
                      <input required maxLength={120} value={offering.title} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, title: event.target.value } : item))} placeholder="e.g. Punjabi wedding lunch" />
                    </label>
                    <label>Menu or service category <span>*</span>
                      <input required maxLength={60} value={offering.category} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, category: event.target.value } : item))} placeholder="e.g. Catering, Photography, Music" />
                    </label>
                    <label className="provider-profile-field-wide">Description
                      <textarea rows={3} maxLength={1000} value={offering.description} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, description: event.target.value } : item))} placeholder="Explain what the customer receives, portions or duration, and any important limits." />
                    </label>
                    <label className="provider-profile-field-wide">Included in this price
                      <textarea rows={2} maxLength={1000} value={offering.inclusions} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, inclusions: event.target.value } : item))} placeholder="e.g. 2 starters, 3 main dishes, rice, breads, dessert, serving staff" />
                    </label>
                    <label>Price (₹) <span>*</span>
                      <input required type="number" min="0.01" step="0.01" value={offering.price} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, price: event.target.value } : item))} />
                    </label>
                    <label>Charge per <span>*</span>
                      <select required value={offering.price_unit} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, price_unit: event.target.value } : item))}>
                        {[
                          ["plate", "Plate"],
                          ["person", "Person"],
                          ["hour", "Hour"],
                          ["day", "Day"],
                          ["event", "Event"],
                          ["package", "Package"],
                        ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <label>Minimum quantity (optional)
                      <input type="number" min="1" max="100000" step="1" value={offering.minimum_quantity} onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, minimum_quantity: event.target.value } : item))} placeholder="e.g. 50 plates" />
                    </label>
                    <fieldset className="provider-event-type-picker provider-profile-field-wide">
                      <legend>Events this offering is for <span>*</span></legend>
                      <p>Select one or more events, or choose all events. This helps customers understand whether the menu or service fits their celebration.</p>
                      <label className="provider-event-type-option">
                        <input
                          type="checkbox"
                          checked={offering.all_events}
                          onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => currentIndex === index ? { ...item, all_events: event.target.checked, event_types: [] } : item))}
                        />
                        All event types
                      </label>
                      <div className="provider-event-type-grid">
                        {applicableEventTypes.map((eventType) => (
                          <label className="provider-event-type-option" key={eventType}>
                            <input
                              type="checkbox"
                              disabled={offering.all_events}
                              checked={offering.event_types.includes(eventType)}
                              onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => {
                                if (currentIndex !== index) return item;
                                const eventTypes = event.target.checked
                                  ? [...new Set([...item.event_types, eventType])]
                                  : item.event_types.filter((value) => value !== eventType);
                                return { ...item, event_types: eventTypes };
                              }))}
                            />
                            {eventType}
                          </label>
                        ))}
                        <label className="provider-event-type-option">
                          <input
                            type="checkbox"
                            disabled={offering.all_events}
                            checked={offering.event_types.includes(customEventTypeMarker) || customEventTypes(offering).length > 0}
                            onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => {
                              if (currentIndex !== index) return item;
                              return {
                                ...item,
                                event_types: event.target.checked
                                ? [...item.event_types, customEventTypeMarker]
                                  : item.event_types.filter((value) => applicableEventTypes.includes(value)),
                              };
                            }))}
                          />
                          Other
                        </label>
                      </div>
                      {!offering.all_events && customEventTypes(offering).length > 0 && (
                        <label className="provider-custom-event-type">
                          Specify other event type <span>*</span>
                          <input
                            required
                            maxLength={100}
                            value={customEventTypes(offering).join(", ")}
                            onChange={(event) => setOfferings((current) => current.map((item, currentIndex) => {
                              if (currentIndex !== index) return item;
                              const selected = event.target.value.trim();
                              const otherTypes = selected ? selected.split(",").map((value) => value.trim()).filter(Boolean) : [];
                              return {
                                ...item,
                                event_types: [
                                  ...item.event_types.filter((value) => applicableEventTypes.includes(value)),
                                  ...(otherTypes.length ? otherTypes : [customEventTypeMarker]),
                                ],
                              };
                            }))}
                            placeholder="e.g. Housewarming, religious ceremony"
                          />
                        </label>
                      )}
                    </fieldset>
                    <p className="provider-contact-privacy provider-profile-field-wide">Shown publicly as ₹{Number(offering.price || 0).toLocaleString("en-IN")} per {offering.price_unit || "event"}{offering.minimum_quantity ? ` · minimum ${offering.minimum_quantity}` : ""}. Final availability and quote are confirmed with you.</p>
                  </div>
                </section>
              ))}
              {offerings.length < 50 && (
                <button className="provider-offering-add" type="button" onClick={() => setOfferings((current) => [...current, { ...emptyOffering(), category: form.category || "Service" }])}>+ Add another service or menu item</button>
              )}
              {message && <p role="status" className="provider-profile-save-message">{message}</p>}
              <div className="provider-profile-save-row">
                <span>Up to 50 items · Customers see saved items on your profile.</span>
                <button className="primary" type="submit" disabled={saving}>{saving ? "Publishing menu..." : "Save and publish menu"}</button>
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
