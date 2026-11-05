import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";

type PlannerShortlistProps = {
  onOpen: (id: number) => void;
  onBrowse: () => void;
  onPlan: () => void;
  onEditEvent: (id: number) => void;
};

export default function PlannerShortlist({
  onOpen,
  onBrowse,
  onPlan,
  onEditEvent,
}: PlannerShortlistProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyProvider, setBusyProvider] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [shortlist, plannedEvents] = await Promise.all([
        api("/customer/shortlist"),
        api("/customer/events"),
      ]);
      setEntries(shortlist);
      setEvents(plannedEvents);
    } catch (cause: any) {
      setError(cause.message || "Unable to load your planner shortlist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function editNote(providerId: number, note: string) {
    setEntries((current) =>
      current.map((entry) =>
        entry.provider_id === providerId ? { ...entry, note } : entry,
      ),
    );
  }

  async function saveNote(entry: any) {
    setBusyProvider(entry.provider_id);
    setError("");
    setMessage("");
    try {
      await api(`/customer/shortlist/${entry.provider_id}/note`, {
        method: "PUT",
        body: JSON.stringify({ note: entry.note }),
      });
      setMessage(`Notes saved for ${entry.business_name}.`);
    } catch (cause: any) {
      setError(cause.message || "Unable to save planner notes.");
    } finally {
      setBusyProvider(null);
    }
  }

  async function setStatus(entry: any, status: "SHORTLISTED" | "SELECTED") {
    setBusyProvider(entry.provider_id);
    setError("");
    setMessage("");
    try {
      await api(
        `/customer/shortlist/${entry.provider_id}/status?status=${status}`,
        { method: "PATCH" },
      );
      await load();
      setMessage(
        status === "SELECTED"
          ? `${entry.business_name} is now your final choice.`
          : `${entry.business_name} is back on your shortlist.`,
      );
    } catch (cause: any) {
      setError(cause.message || "Unable to update planner status.");
    } finally {
      setBusyProvider(null);
    }
  }

  async function remove(entry: any) {
    setBusyProvider(entry.provider_id);
    setError("");
    setMessage("");
    try {
      await api(`/customer/shortlist/${entry.provider_id}`, {
        method: "DELETE",
      });
      await load();
      setMessage(`${entry.business_name} was removed from your shortlist.`);
    } catch (cause: any) {
      setError(cause.message || "Unable to remove planner.");
    } finally {
      setBusyProvider(null);
    }
  }

  const selected = entries.find((entry) => entry.status === "SELECTED");

  return (
    <main className="customer-dashboard">
      <p className="eyebrow">YOUR EVENT PLANNING</p>
      <h1>Planner shortlist</h1>
      <p>
        Save planners, add notes about what you need, and choose your final
        planner when you are ready.
      </p>
      <button type="button" className="primary" onClick={onPlan}>
        Create new event plan
      </button>
      <section className="customer-planned-events" aria-labelledby="planned-events-heading">
        <div className="row">
          <div>
            <h2 id="planned-events-heading">Your planned events</h2>
            <p>View your event plans and check provider responses.</p>
          </div>
          <button type="button" onClick={onPlan}>Create another event</button>
        </div>
        {loading ? (
          <p>Loading your planned events...</p>
        ) : events.length === 0 ? (
          <div className="card">
            <p>You haven’t created an event plan yet.</p>
            <button type="button" className="primary" onClick={onPlan}>Plan an event</button>
          </div>
        ) : (
          <div className="list">
            {events.map((event) => (
              <article className="card planned-event-card" key={event.id}>
                <div className="row">
                  <div>
                    <h3>{event.event_type} · {[event.city, event.state].filter(Boolean).join(", ")}</h3>
                    <p>{event.event_date} · {event.guests} guests · Budget {event.budget ? `₹${Number(event.budget).toLocaleString("en-IN")}` : "Not provided"}</p>
                  </div>
                  <span className="status-badge">{event.status}</span>
                </div>
                {event.services?.length > 0 && <p>Services: {event.services.join(", ")}</p>}
                <div className="planned-event-providers">
                  <strong>Provider responses</strong>
                  {event.providers?.length ? event.providers.map((provider: any) => (
                    <div className="planned-event-provider-response" key={provider.provider_id}>
                      <p>
                        <strong>{provider.business_name}:</strong> {provider.quote
                          ? `Total ₹${Number(provider.quote.amount).toLocaleString("en-IN")} (${provider.quote.status})`
                          : provider.status}
                      </p>
                      {provider.quote?.service_items?.length > 0 && (
                        <ul>
                          {provider.quote.service_items.map((item: any, index: number) => (
                            <li key={`${item.service}-${index}`}>
                              <span>{item.service}</span>
                              <span>₹{Number(item.amount).toLocaleString("en-IN")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {provider.quote?.notes && <p>{provider.quote.notes}</p>}
                    </div>
                  )) : <p>No providers selected for this plan.</p>}
                </div>
                <button type="button" onClick={() => onEditEvent(event.id)}>Edit event plan</button>
              </article>
            ))}
          </div>
        )}
      </section>
      <div className="stats">
        <div className="card">
          <b>
            {entries.filter((entry) => entry.status !== "SELECTED").length}
          </b>
          <span>Shortlisted planners</span>
        </div>
        <div className="card">
          <b>{selected ? "1" : "0"}</b>
          <span>Final choice selected</span>
        </div>
      </div>
      {selected && (
        <div className="card final-choice">
          <strong>Current final choice</strong>
          <p>
            {selected.business_name} · {selected.provider_type} · {selected.city}
          </p>
          <p>
            {selected.note ||
              "Add a note to record why this planner is your final choice."}
          </p>
        </div>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {loading ? (
        <p>Loading your shortlist...</p>
      ) : entries.length === 0 ? (
        <div className="card">
          <h2>Your shortlist is empty</h2>
          <p>
            Browse providers and select “Shortlist planner” to keep event
            planners here for later.
          </p>
          <button className="primary" onClick={onBrowse}>
            Explore providers
          </button>
        </div>
      ) : (
        <div className="list">
          {entries.map((entry) => (
            <article className="card shortlist-card" key={entry.id}>
              <div className="row">
                <div>
                  <h2>{entry.business_name}</h2>
                  <p>
                    {entry.provider_type} ·{" "}
                    {[entry.city, entry.state].filter(Boolean).join(", ") ||
                      "Location not set"}
                  </p>
                  <p>
                    ★ {Number(entry.rating || 0).toFixed(1)} ·{" "}
                    {entry.review_count} reviews · {entry.verification_status}
                  </p>
                </div>
                <span
                  className={`status-badge ${
                    entry.status === "SELECTED" ? "selected" : "shortlisted"
                  }`}
                >
                  {entry.status === "SELECTED" ? "Final choice" : "Shortlisted"}
                </span>
              </div>
              {!entry.provider_active && (
                <p role="status" className="error">
                  This provider account is disabled and is not currently
                  available.
                </p>
              )}
              <p>
                {entry.description || "No provider description has been added."}
              </p>
              <label htmlFor={`planner-note-${entry.provider_id}`}>
                Your planning notes
              </label>
              <textarea
                id={`planner-note-${entry.provider_id}`}
                rows={3}
                maxLength={2000}
                value={entry.note}
                onChange={(event) =>
                  editNote(entry.provider_id, event.target.value)
                }
                placeholder="Record your event requirements, questions, or why this planner interests you."
              />
              <div className="shortlist-actions">
                <button
                  type="button"
                  onClick={() => onOpen(entry.provider_id)}
                >
                  View planner
                </button>
                <button
                  type="button"
                  onClick={() => saveNote(entry)}
                  disabled={busyProvider === entry.provider_id}
                >
                  Save notes
                </button>
                {entry.status === "SELECTED" ? (
                  <button
                    type="button"
                    onClick={() => setStatus(entry, "SHORTLISTED")}
                    disabled={busyProvider === entry.provider_id}
                  >
                    Return to shortlist
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => setStatus(entry, "SELECTED")}
                    disabled={
                      busyProvider === entry.provider_id || !entry.provider_active
                    }
                  >
                    Choose as final planner
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  disabled={busyProvider === entry.provider_id}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
