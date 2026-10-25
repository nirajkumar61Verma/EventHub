import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Facebook,
  Instagram,
  Language,
  LinkedIn,
  YouTube,
} from "@mui/icons-material";
import { api } from "../../api/client";

type ProviderProfileProps = {
  id: number;
  user: any;
  onLogin: () => void;
  onRequest: (providerId: number) => void;
};

export default function ProviderProfile({
  id,
  user,
  onLogin,
  onRequest,
}: ProviderProfileProps) {
  const [provider, setProvider] = useState<any>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [details, providerReviews] = await Promise.all([
      api(`/providers/${id}`),
      api(`/providers/${id}/reviews`),
    ]);
    setProvider(details);
    setReviews(providerReviews);
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

  return (
    <main>
      <div className="profile card">
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
          <p aria-label={`${provider.rating || 0} out of 5 stars`}>
            ★ {Number(provider.rating || 0).toFixed(1)} ·{" "}
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
      <div className="card">
        <h2>Send an event request</h2>
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
        <h2>Customer ratings and comments</h2>
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to rate this provider.</p>
        ) : (
          <div className="list">
            {reviews.map((review) => (
              <article className="card" key={review.id}>
                <strong aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(Math.round(review.rating))}
                  {"☆".repeat(5 - Math.round(review.rating))} {review.rating}/5
                </strong>
                <p>{review.comment || "No comment provided."}</p>
                <small>
                  {review.reviewer_name} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </small>
              </article>
            ))}
          </div>
        )}
        {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) ? (
          <form className="card form" onSubmit={submitReview}>
            <h3>Leave a rating</h3>
            <label htmlFor="provider-rating">Your rating</label>
            <select
              id="provider-rating"
              aria-label="Your rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value === 1 ? "" : "s"}
                </option>
              ))}
            </select>
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
            <button className="primary" type="submit" disabled={saving}>
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
