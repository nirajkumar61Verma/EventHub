import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../api/client";

type ProviderCustomerChatProps = {
  customerId: number;
  customerName: string;
  messages: any[];
  onSent: () => void;
};

export default function ProviderCustomerChat({
  customerId,
  customerName,
  messages,
  onSent,
}: ProviderCustomerChatProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;

    setSending(true);
    setError("");
    try {
      await api(`/provider/messages/${customerId}`, {
        method: "POST",
        body: JSON.stringify({ message: draft.trim() }),
      });
      setDraft("");
      onSent();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to send your reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="provider-customer-chat" aria-label={`Chat with ${customerName}`}>
      <div className="provider-customer-chat-heading">
        <div>
          <strong>Chat with {customerName}</strong>
          <span>Quick messages to this customer</span>
        </div>
      </div>
      <ol className="provider-customer-chat-history" aria-live="polite">
        {messages.length === 0 ? (
          <li className="provider-customer-chat-empty">
            No quick messages yet. Send a message to start this chat.
          </li>
        ) : (
          messages.map((item) => (
            <li
              className={`provider-customer-chat-message${item.sender_id !== customerId ? " own" : ""}`}
              key={item.id}
            >
              <div>
                <strong>{item.sender_name}</strong>
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
      <form className="provider-customer-chat-form" onSubmit={(event) => void sendMessage(event)}>
        <label htmlFor={`provider-customer-reply-${customerId}`}>Your reply</label>
        <textarea
          id={`provider-customer-reply-${customerId}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Reply to ${customerName}...`}
          rows={2}
          maxLength={2000}
          required
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={sending || !draft.trim()}>
          {sending ? "Sending..." : "Send reply"}
        </button>
      </form>
    </section>
  );
}
