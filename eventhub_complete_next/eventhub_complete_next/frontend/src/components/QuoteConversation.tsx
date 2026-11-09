import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api/client";

type QuoteConversationProps = {
  requestId: number;
  viewerRole: "CUSTOMER" | "PROVIDER";
  onUpdated?: () => void;
};

export default function QuoteConversation({
  requestId,
  viewerRole,
  onUpdated,
}: QuoteConversationProps) {
  const [conversation, setConversation] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const result = await api(`/quote-requests/${requestId}/conversation`);
    setConversation(result);
  }, [requestId]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await api(`/quote-requests/${requestId}/conversation`);
        if (active) {
          setConversation(result);
          setError("");
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load this conversation.");
        }
      }
    };
    void refresh();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [requestId]);

  const activity = useMemo(() => {
    if (!conversation) return [];
    return [
      ...conversation.messages.map((item: any) => ({ ...item, kind: "message" })),
      ...conversation.quotes.map((item: any) => ({ ...item, kind: "quote" })),
    ].sort((first: any, second: any) =>
      new Date(first.created_at).getTime() - new Date(second.created_at).getTime(),
    );
  }, [conversation]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError("");
    try {
      await api(`/quote-requests/${requestId}/conversation`, {
        method: "POST",
        body: JSON.stringify({
          message: message.trim(),
          ...(viewerRole === "CUSTOMER" && proposedAmount
            ? { proposed_amount: Number(proposedAmount) }
            : {}),
        }),
      });
      setMessage("");
      setProposedAmount("");
      await load();
      onUpdated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  async function acceptLatestQuote() {
    setSending(true);
    setError("");
    try {
      await api(`/quote-requests/${requestId}/accept`, { method: "POST" });
      await load();
      onUpdated?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to accept this quote.");
    } finally {
      setSending(false);
    }
  }

  if (!conversation) {
    return (
      <p className={error ? "quote-conversation-error" : "quote-conversation-loading"} role={error ? "alert" : undefined}>
        {error || "Loading negotiation history..."}
      </p>
    );
  }

  const finalized = conversation.status === "ACCEPTED";
  const latestQuote = conversation.quotes[conversation.quotes.length - 1];
  return (
    <section className="quote-conversation" aria-label="Quote discussion">
      <div className="quote-conversation-heading">
        <div>
          <strong>Messages and price offers</strong>
          <span className={`quote-negotiation-status ${finalized ? "finalized" : ""}`}>
            {finalized ? "Finalized" : conversation.status === "NEGOTIATING" ? "In discussion" : latestQuote ? "Quote received" : "Waiting for provider quote"}
          </span>
        </div>
        {viewerRole === "CUSTOMER" && latestQuote && !finalized && (
          <button type="button" className="primary" disabled={sending} onClick={() => void acceptLatestQuote()}>
            Accept quote and finalize
          </button>
        )}
      </div>
      {activity.length === 0 ? (
        <p className="quote-conversation-empty">
          Your event budget is shared as the target budget. Send a message or target price here; the provider can reply with a quote or a revised offer.
        </p>
      ) : (
        <ol className="quote-conversation-history">
          {activity.map((item: any) => item.kind === "quote" ? (
            <li className="quote-conversation-quote" key={`quote-${item.id}`}>
              <div className="quote-conversation-entry-heading">
                <strong>Provider {item.status === "SUPERSEDED" ? "previous offer" : "quote"}</strong>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </div>
              <strong className="quote-conversation-total">₹{Number(item.amount).toLocaleString("en-IN")} total · {item.status}</strong>
              {item.service_items?.length > 0 && (
                <ul>
                  {item.service_items.map((service: any, index: number) => (
                    <li key={`${service.service}-${index}`}>
                      <span>{service.service}</span>
                      <strong>₹{Number(service.amount).toLocaleString("en-IN")}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {item.notes && <p>{item.notes}</p>}
            </li>
          ) : (
            <li
              className={`quote-conversation-message${(
                item.sender_side
                  ? item.sender_side === viewerRole
                  : viewerRole === "CUSTOMER"
                    ? item.sender_role === "CUSTOMER" || item.sender_role === "CUSTOMER_PROVIDER"
                    : item.sender_role === "PROVIDER"
              ) ? " own" : ""}`}
              key={`message-${item.id}`}
            >
              <div className="quote-conversation-entry-heading">
                <strong>{item.sender_name}</strong>
                <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              </div>
              <p>{item.message}</p>
              {item.proposed_amount !== null && item.proposed_amount !== undefined && (
                <strong className="quote-conversation-proposal">
                  Customer target: ₹{Number(item.proposed_amount).toLocaleString("en-IN")}
                </strong>
              )}
            </li>
          ))}
        </ol>
      )}
      {!finalized && (
        <form className="quote-conversation-form" onSubmit={(event) => void sendMessage(event)}>
          <label>
            {viewerRole === "CUSTOMER" ? "Message the provider" : "Reply to the customer"}
            <textarea
              required
              rows={2}
              maxLength={2000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={viewerRole === "CUSTOMER" ? "Ask a question or discuss the quote..." : "Reply about services, pricing, or event details..."}
            />
          </label>
          {viewerRole === "CUSTOMER" && (
            <label>
              Your target price (optional, ₹)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={proposedAmount}
                onChange={(event) => setProposedAmount(event.target.value)}
                placeholder="Suggest a total for the requested services"
              />
            </label>
          )}
          {error && <p role="alert" className="error">{error}</p>}
          <button type="submit" className="primary" disabled={sending || !message.trim()}>
            {sending ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
      {finalized && (
        <p className="quote-conversation-finalized">
          This quote is finalized. The provider and customer can review the conversation and accepted service prices above.
        </p>
      )}
    </section>
  );
}
