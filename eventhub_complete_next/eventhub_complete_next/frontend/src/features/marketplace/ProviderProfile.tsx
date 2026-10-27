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
  const [reviews, setReviews] = useState<any[]>([]);
  const [referralNetwork, setReferralNetwork] = useState<ReferralNetwork>({
    chain: [],
    referred_providers: [],
  });
  const [referralError, setReferralError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [details, providerReviews, referralResult] = await Promise.all([
      api(`/providers/${id}`),
      api(`/providers/${id}/reviews`),
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
    } catch (cause: any) {
      setError(cause.message || "Unable to save your review.");
    } finally {
      setSaving(false);
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
            ₹{provider.starting_price} / {provider.price_unit}
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
      <div className="card provider-request-card">
        <div>
          <p className="provider-profile-eyebrow">LET'S MAKE IT MEMORABLE</p>
          <h2>Send an event request</h2>
        </div>
        <p>
          Share your event date, guest count, location, and requirements to ask
          this provider for a quote.
        </p>
        {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) ? (
          <button
            type="button"
            className="primary"
            onClick={() => onRequest(provider.id)}
          >
            Plan event with this provider
          </button>
        ) : user ? (
          <p>Event requests are available to customer accounts.</p>
        ) : (
          <button type="button" className="primary" onClick={onLogin}>
            Login as a customer to request a quote
          </button>
        )}
      </div>
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
          <form className="card form provider-review-form" onSubmit={submitReview}>
            <div>
              <p className="provider-profile-eyebrow">YOUR EXPERIENCE MATTERS</p>
              <h3>Leave a rating</h3>
            </div>
            <span id="provider-rating-label">Choose your star rating</span>
            <div className="provider-star-picker" role="group" aria-labelledby="provider-rating-label">
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
            <button className="primary provider-review-submit" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Submit rating"}
            </button>
            {message && <p role="status">{message}</p>}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </form>
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
