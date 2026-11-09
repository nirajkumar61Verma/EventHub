import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api/client";

type CustomerProviderChatProps = {
  providerId: number;
  customerId: number;
  providerName: string;
};

export default function CustomerProviderChat({
  providerId,
  customerId,
  providerName,
}: CustomerProviderChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const result = await api(`/support/messages?provider_id=${providerId}`);
    setMessages(result);
    setError("");
  }, [providerId]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const result = await api(`/support/messages?provider_id=${providerId}`);
        if (active) {
          setMessages(result);
          setError("");
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Unable to load this chat.");
        }
      } finally {
        if (active) setLoading(false);
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
  }, [providerId]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError("");
    try {
      await api("/support/messages", {
        method: "POST",
        body: JSON.stringify({ message: draft.trim(), provider_id: providerId }),
      });
      setDraft("");
      await loadMessages();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="provider-customer-chat" aria-label={`Chat with ${providerName}`}>
      <div className="provider-customer-chat-heading">
        <div>
          <strong>Chat with {providerName}</strong>
          <span>Messages and replies stay together here</span>
        </div>
      </div>
      <ol className="provider-customer-chat-history" aria-live="polite">
        {loading && messages.length === 0 ? (
          <li className="provider-customer-chat-empty">Loading chat...</li>
        ) : messages.length === 0 ? (
          <li className="provider-customer-chat-empty">
            Start a chat with {providerName} about availability, services, or your plans.
          </li>
        ) : (
          messages.map((item) => (
            <li
              className={`provider-customer-chat-message${item.sender_id === customerId ? " own" : ""}`}
              key={item.id}
            >
              <div>
                <strong>{item.sender_id === customerId ? "You" : item.sender_name}</strong>
                <time dateTime={item.created_at}>
                  {new Date(item.created_at).toLocaleString()}
                </time>
              </div>
              <p>{item.message}</p>
            </li>
          ))
        )}
        <li className="provider-customer-chat-anchor" ref={historyEndRef} aria-hidden="true" />
      </ol>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="provider-customer-chat-form" onSubmit={(event) => void sendMessage(event)}>
        <label htmlFor={`customer-provider-message-${providerId}`}>Your message</label>
        <textarea
          id={`customer-provider-message-${providerId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Message ${providerName}...`}
          rows={2}
          maxLength={2000}
          required
        />
        <button type="submit" className="primary" disabled={sending || !draft.trim()}>
          {sending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  );
}
