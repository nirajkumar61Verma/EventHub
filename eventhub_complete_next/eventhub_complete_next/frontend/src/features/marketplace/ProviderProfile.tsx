import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  EmailOutlined,
  Facebook,
  Instagram,
  Language,
  LinkedIn,
  PhoneOutlined,
  YouTube,
  WhatsApp,
} from "@mui/icons-material";
import { api } from "../../api/client";

type ProviderProfileProps = {
  id: number;
  user: any;
  onLogin: () => void;
  onRequest: (providerId: number) => void;
  onOpen: (providerId: number) => void;
};

type ReferralNetwork = {
  chain: { provider_id: number | null; name: string; kind: "provider" | "community" }[];
  referred_providers: { id: number; business_name: string; category: string }[];
};

export default function ProviderProfile({
  id,
  user,
  onLogin,
  onRequest,
  onOpen,
}: ProviderProfileProps) {
  const [provider, setProvider] = useState<any>();
  const [offerings, setOfferings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [referralNetwork, setReferralNetwork] = useState<ReferralNetwork>({
    chain: [],
    referred_providers: [],
  });
  const [referralError, setReferralError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [isMessageFormOpen, setIsMessageFormOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [messageSent, setMessageSent] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [details, providerReviews, providerOfferings, referralResult] = await Promise.all([
      api(`/providers/${id}`),
      api(`/providers/${id}/reviews`),
      api(`/providers/${id}/offerings`),
      api(`/providers/${id}/referrals`)
        .then((data: ReferralNetwork) => ({ data, error: "" }))
        .catch((cause: unknown) => ({
          data: null,
          error:
            cause instanceof Error
              ? cause.message
              : "Unable to load referral connections.",
        })),
    ]);
    setProvider(details);
    setReviews(providerReviews);
    setOfferings(providerOfferings);
    if (referralResult.data) setReferralNetwork(referralResult.data);
    setReferralError(referralResult.error);
  }, [id]);

  useEffect(() => {
    load().catch((cause: any) =>
      setError(cause.message || "Unable to load provider."),
    );
  }, [load]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api(`/providers/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      setMessage("Your rating and comment have been saved.");
      await load();
      setIsReviewFormOpen(false);
    } catch (cause: any) {
      setError(cause.message || "Unable to save your review.");
    } finally {
      setSaving(false);
    }
  }

  async function submitProviderMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendingMessage(true);
    setMessageError("");
    setMessageSent("");
    try {
      const result = await api(`/providers/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: customMessage }),
      });
      setMessageSent(result.message || "Your message was sent to the provider.");
      setCustomMessage("");
      setIsMessageFormOpen(false);
    } catch (cause: any) {
      setMessageError(cause.message || "Unable to send your message.");
    } finally {
      setSendingMessage(false);
    }
  }

  if (!provider) {
    return (
      <main>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : (
          "Loading provider..."
        )}
      </main>
    );
  }

  const socialLinks = [
    { label: "Instagram", url: provider.instagram_url, icon: <Instagram /> },
    { label: "Facebook", url: provider.facebook_url, icon: <Facebook /> },
    { label: "YouTube", url: provider.youtube_url, icon: <YouTube /> },
    { label: "LinkedIn", url: provider.linkedin_url, icon: <LinkedIn /> },
    { label: "Website", url: provider.website_url, icon: <Language /> },
  ].filter((item) => item.url);
  const ratingBreakdown = [5, 4, 3, 2, 1].map((value) => ({
    value,
    count: reviews.filter(
      (review) => Math.round(Number(review.rating)) === value,
    ).length,
  }));
  const reviewTotal = reviews.length;
  const averageRating = Number(provider.rating || 0);
  const contactNumbers = provider.alternate_contact_phone
    ? [{ label: "Public contact number", number: provider.alternate_contact_phone }]
    : [];
  const whatsappMessage = `Hi ${provider.business_name}, I found your profile on EventHub and would like to know more about your services.`;
  const hasReferralNetwork =
    referralNetwork.chain.length > 1 ||
    referralNetwork.referred_providers.length > 0;

  return (
    <main className="provider-profile-page">
      <div className="profile card provider-profile-hero">
        {provider.logo_data ? (
          <img
            className="provider-logo-public"
            src={provider.logo_data}
            alt={`${provider.business_name} logo`}
          />
        ) : (
          <div className="avatar big">{provider.business_name[0]}</div>
        )}
        <div>
          <h1>
            {provider.business_name}{" "}
            {provider.verified && <span className="badge">Verified</span>}
          </h1>
          {provider.business_title && (
            <h2 className="provider-business-title">{provider.business_title}</h2>
          )}
          <p>
            {provider.category} · {provider.city} · {provider.years_experience} years
            experience
          </p>
          <p>{provider.description || "Professional event service provider."}</p>
          <h3>
            {Number(provider.starting_price) > 0
              ? `₹${Number(provider.starting_price).toLocaleString("en-IN")} / ${provider.price_unit}`
              : "Contact for price"}
          </h3>
          <p className="provider-profile-rating" aria-label={`${averageRating} out of 5 stars`}>
            <span aria-hidden="true">★</span> {averageRating.toFixed(1)} ·{" "}
            {provider.review_count || 0} reviews
          </p>
          {socialLinks.length > 0 && (
            <div
              className="provider-social-links"
              aria-label="Provider social media links"
            >
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  onClick={(event) => event.stopPropagation()}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {offerings.length > 0 && (
        <section className="provider-offerings" aria-labelledby="provider-offerings-title">
          <div className="provider-reviews-heading">
            <div>
              <p className="provider-profile-eyebrow">SERVICES & PRICING</p>
              <h2 id="provider-offerings-title">What this provider offers</h2>
            </div>
            <span>{offerings.length} {offerings.length === 1 ? "offering" : "offerings"}</span>
          </div>
          <div className="provider-offerings-grid">
            {offerings.map((offer) => (
              <article className="card provider-offering-card" key={offer.id}>
                <div className="provider-offering-heading">
                  <span>{offer.category}</span>
                  {offer.minimum_quantity && <small>Minimum {Number(offer.minimum_quantity).toLocaleString("en-IN")} {offer.price_unit === "person" ? "people" : `${offer.price_unit}s`}</small>}
                </div>
                <h3>{offer.title}</h3>
                <div className="provider-offering-events" aria-label="Suitable for events">
                  <strong>Suitable for</strong>
                  <div>
                    {offer.all_events
                      ? <span>All event types</span>
                      : offer.event_types?.length
                        ? offer.event_types.map((eventType: string) => <span key={eventType}>{eventType}</span>)
                        : <span>Event types not listed</span>}
                  </div>
                </div>
                {offer.description && <p>{offer.description}</p>}
                {offer.inclusions && (
                  <div className="provider-offering-inclusions">
                    <strong>Included</strong>
                    <p>{offer.inclusions}</p>
                  </div>
                )}
                <div className="provider-offering-price">
                  <strong>₹{Number(offer.price).toLocaleString("en-IN")}</strong>
                  <span>per {offer.price_unit}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="provider-offerings-disclaimer">Prices are indicative. Confirm availability, final quantities, travel or setup charges, and the final quote directly with the provider.</p>
        </section>
      )}
      {(provider.contact_email || contactNumbers.length > 0) && (
        <section className="card provider-contact-card" aria-label="Contact provider directly">
          <div className="provider-contact-heading">
            <p className="provider-profile-eyebrow">LET'S TALK DETAILS</p>
            <h2>Contact this provider directly</h2>
            <p>Reach out with questions about availability, services, or pricing.</p>
          </div>
          <div className="provider-contact-links">
            {contactNumbers.map(({ label, number }) => {
              const rawNumber = String(number).replace(/\D/g, "");
              const whatsappNumber =
                rawNumber.length === 10
                  ? `91${rawNumber}`
                  : rawNumber.length === 11 && rawNumber.startsWith("0")
                    ? `91${rawNumber.slice(1)}`
                    : rawNumber;
              return (
                <div className="provider-contact-number" key={label}>
                  <a href={`tel:${String(number).replace(/[^\d+]/g, "")}`}>
                    <PhoneOutlined aria-hidden="true" />
                    <span><small>{label}</small><strong>{number}</strong></span>
                  </a>
                  {whatsappNumber.length >= 7 && (
                    <a
                      className="provider-whatsapp-link"
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Message ${provider.business_name} using ${label} on WhatsApp`}
                    >
                      <WhatsApp aria-hidden="true" />
                      <span><small>Message on</small><strong>WhatsApp</strong></span>
                    </a>
                  )}
                </div>
              );
            })}
            {provider.contact_email && (
              <a href={`mailto:${provider.contact_email}`}>
                <EmailOutlined aria-hidden="true" />
                <span><small>Email</small><strong>{provider.contact_email}</strong></span>
              </a>
            )}
          </div>
        </section>
      )}
      {(hasReferralNetwork || referralError) && (
        <section className="provider-referral-network card" aria-labelledby="provider-referral-title">
          <div className="provider-referral-heading">
            <p className="provider-profile-eyebrow">COMMUNITY CONNECTIONS</p>
            <h2 id="provider-referral-title">Provider referral network</h2>
            <p>See how providers are connected through EventHub referrals.</p>
          </div>
          {referralError ? (
            <p role="alert" className="provider-referral-error">
              Referral connections could not be loaded: {referralError}
            </p>
          ) : (
            <>
              {referralNetwork.chain.length > 1 && (
                <ol className="provider-referral-chain" aria-label="Referral chain">
                  {referralNetwork.chain.map((entry, index) => {
                    const isCurrentProvider = index === referralNetwork.chain.length - 1;
                    return (
                      <li
                        className={`provider-referral-node${isCurrentProvider ? " is-current" : ""}`}
                        key={`${entry.kind}-${entry.provider_id ?? index}-${index}`}
                      >
                        <span className="provider-referral-marker" aria-hidden="true">
                          {entry.kind === "provider" ? entry.name[0]?.toUpperCase() : "•"}
                        </span>
                        <span className="provider-referral-copy">
                          <small>
                            {isCurrentProvider
                              ? "This provider"
                              : entry.kind === "provider"
                                ? "Referred through"
                                : "Referred by an EventHub community member"}
                          </small>
                          {entry.kind === "provider" && entry.provider_id && !isCurrentProvider ? (
                            <button
                              type="button"
                              className="provider-referral-link"
                              onClick={() => onOpen(entry.provider_id!)}
                            >
                              {entry.name}
                            </button>
                          ) : (
                            <strong>{entry.name}</strong>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {referralNetwork.referred_providers.length > 0 && (
                <div className="provider-referral-children">
                  <h3>Providers referred by this provider</h3>
                  <div className="provider-referral-list">
                    {referralNetwork.referred_providers.map((referred) => (
                      <button
                        type="button"
                        key={referred.id}
                        onClick={() => onOpen(referred.id)}
                      >
                        <span className="provider-referral-avatar" aria-hidden="true">
                          {referred.business_name[0]?.toUpperCase() || "P"}
                        </span>
                        <span>
                          <strong>{referred.business_name}</strong>
                          <small>{referred.category}</small>
                        </span>
                        <span className="provider-referral-arrow" aria-hidden="true">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="provider-referral-disclaimer">
                Referral connections show who introduced providers to EventHub; they are not a guarantee or endorsement. Community members’ names are kept private. Please review each provider’s details and feedback before booking.
              </p>
            </>
          )}
        </section>
      )}
      <section className="card provider-request-card">
        <div>
          <p className="provider-profile-eyebrow">LET'S MAKE IT MEMORABLE</p>
          <h2>Contact this provider</h2>
        </div>
        <p>
          Design your event with dates, functions, and selected services to request a quote, or send a quick custom message.
        </p>
        {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) ? (
          <div className="provider-request-actions">
            <button
              type="button"
              className="primary"
              onClick={() => onRequest(provider.id)}
            >
              Design event & request quote
            </button>
            <button
              type="button"
              className="provider-message-toggle"
              aria-expanded={isMessageFormOpen}
              aria-controls="provider-custom-message-form"
              onClick={() => {
                setIsMessageFormOpen((isOpen) => !isOpen);
                setMessageError("");
              }}
            >
              {isMessageFormOpen ? "Close message form" : "Send a custom message"}
            </button>
            {isMessageFormOpen && (
              <form id="provider-custom-message-form" className="provider-custom-message-form" onSubmit={submitProviderMessage}>
                <label htmlFor="provider-custom-message">Your message <span>*</span></label>
                <textarea
                  id="provider-custom-message"
                  required
                  minLength={1}
                  maxLength={2000}
                  rows={4}
                  value={customMessage}
                  onChange={(event) => setCustomMessage(event.target.value)}
                  placeholder={`Ask ${provider.business_name} about availability, a service, or a custom requirement.`}
                />
                <small>Up to 2,000 characters. Do not include passwords, payment-card details, or sensitive documents.</small>
                {messageError && <p role="alert" className="error">{messageError}</p>}
                <button type="submit" className="primary" disabled={sendingMessage || !customMessage.trim()}>
                  {sendingMessage ? "Sending message..." : "Send message"}
                </button>
              </form>
            )}
            {messageSent && <p role="status" className="provider-message-success">{messageSent}</p>}
          </div>
        ) : user ? (
          <p>Event requests are available to customer accounts.</p>
        ) : (
          <div className="provider-request-actions">
            <button type="button" className="primary" onClick={onLogin}>Login as a customer to contact this provider</button>
          </div>
        )}
      </section>
      <section className="provider-reviews">
        <div className="provider-reviews-heading">
          <div>
            <p className="provider-profile-eyebrow">KIND WORDS</p>
            <h2>Customer ratings and comments</h2>
          </div>
          <span>{provider.review_count || 0} reviews</span>
        </div>
        <div className="card provider-rating-summary">
          <div className="provider-rating-overall">
            <strong>{averageRating.toFixed(1)}</strong>
            <span className="provider-rating-stars" aria-label={`${averageRating} out of 5 stars`}>
              {"★".repeat(Math.round(averageRating))}
              {"☆".repeat(5 - Math.round(averageRating))}
            </span>
            <small>Based on {provider.review_count || 0} reviews</small>
          </div>
          <div className="provider-rating-breakdown" aria-label="Rating breakdown">
            {ratingBreakdown.map(({ value, count }) => {
              const percentage = reviewTotal
                ? Math.round((count / reviewTotal) * 100)
                : 0;
              return (
                <div className="provider-rating-row" key={value}>
                  <span>{value} <span aria-hidden="true">★</span></span>
                  <div
                    className="provider-rating-progress"
                    role="progressbar"
                    aria-label={`${value} star reviews`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                  >
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <small>{count}</small>
                </div>
              );
            })}
          </div>
        </div>
        {reviewTotal === 0 ? (
          <div className="provider-empty-reviews">
            <span aria-hidden="true">✦</span>
            <p>No reviews yet. Be the first to share your experience.</p>
          </div>
        ) : (
          <div className="list provider-review-list">
            {reviews.map((review) => (
              <article className="card provider-review-card" key={review.id}>
                <div className="provider-review-card-heading">
                  <div className="provider-review-avatar" aria-hidden="true">
                    {review.reviewer_name?.[0]?.toUpperCase() || "G"}
                  </div>
                  <div>
                    <strong>{review.reviewer_name || "Guest"}</strong>
                    <small>{new Date(review.created_at).toLocaleDateString()}</small>
                  </div>
                  <span
                    className="provider-review-score"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    ★ {Number(review.rating).toFixed(1)}
                  </span>
                </div>
                <p>{review.comment || "No comment provided."}</p>
              </article>
            ))}
          </div>
        )}
        {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) ? (
          <>
            <button
              className="primary"
              type="button"
              aria-expanded={isReviewFormOpen}
              aria-controls="provider-review-form"
              onClick={() => setIsReviewFormOpen((isOpen) => !isOpen)}
            >
              {isReviewFormOpen ? "Close review form" : "Leave a rating"}
            </button>
            {isReviewFormOpen && (
              <form
                id="provider-review-form"
                className="card form provider-review-form"
                onSubmit={submitReview}
              >
                <div>
                  <p className="provider-profile-eyebrow">YOUR EXPERIENCE MATTERS</p>
                  <h3>Leave a rating</h3>
                </div>
                <span id="provider-rating-label">Choose your star rating</span>
                <div
                  className="provider-star-picker"
                  role="group"
                  aria-labelledby="provider-rating-label"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      className={value <= rating ? "selected" : ""}
                      type="button"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                    >
                      {value <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <label htmlFor="provider-comment">Comment (optional)</label>
                <textarea
                  id="provider-comment"
                  aria-label="Comment"
                  maxLength={2000}
                  rows={4}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Share your experience with this provider"
                />
                <button
                  className="primary provider-review-submit"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Submit rating"}
                </button>
                {message && <p role="status">{message}</p>}
                {error && (
                  <p role="alert" className="error">
                    {error}
                  </p>
                )}
              </form>
            )}
          </>
        ) : user ? (
          <p>Only customer accounts can rate service providers.</p>
        ) : (
          <div className="card">
            <p>Log in as a customer to leave a rating and comment.</p>
            <button className="primary" onClick={onLogin}>
              Login
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
