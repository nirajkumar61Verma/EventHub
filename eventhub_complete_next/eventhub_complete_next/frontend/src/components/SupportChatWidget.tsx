import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  Stack,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ChatOutlined, WhatsApp } from "@mui/icons-material";
import { api } from "../api/client";
import { eventHubSupportPhone } from "../contactDetails";
import {
  isChatSoundEnabled,
  playChatNotification,
  setChatSoundEnabled,
} from "../chatNotifications";

type SupportChatWidgetProps = {
  user: { id?: number; role?: string } | null;
  onLogin: () => void;
  onSignup: () => void;
};

export default function SupportChatWidget({
  user,
  onLogin,
  onSignup,
}: SupportChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isChatSoundEnabled);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef(0);
  const initializedMessagesRef = useRef(false);
  const isCustomer = ["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role || "");
  const whatsappSupportUrl = `https://wa.me/91${eventHubSupportPhone}?text=${encodeURIComponent("Hi EventHub support, I need help.")}`;

  const loadMessages = useCallback(async () => {
    const result = await api("/support/messages");
    const newestId = result.reduce(
      (highest: number, entry: { id: number }) => Math.max(highest, entry.id),
      0,
    );
    if (initializedMessagesRef.current) {
      const incoming = result.filter(
        (entry: { id: number; sender_role: string }) =>
          entry.id > lastMessageIdRef.current && entry.sender_role === "ADMIN",
      );
      if (incoming.length > 0) {
        setUnreadCount((count) => count + (open ? 0 : incoming.length));
        setNotification(
          incoming.length === 1
            ? "New message from EventHub support"
            : `${incoming.length} new messages from EventHub support`,
        );
        playChatNotification();
      }
    } else {
      initializedMessagesRef.current = true;
    }
    lastMessageIdRef.current = Math.max(lastMessageIdRef.current, newestId);
    setMessages(result);
    setError("");
  }, [open]);

  useEffect(() => {
    if (!isCustomer) {
      initializedMessagesRef.current = false;
      lastMessageIdRef.current = 0;
      setUnreadCount(0);
      return;
    }
    let active = true;
    const refresh = () => {
      if (open) setLoading(true);
      loadMessages()
      .catch((cause: unknown) =>
        active && setError(
            cause instanceof Error ? cause.message : "Unable to load support chat.",
          ),
      )
      .finally(() => active && setLoading(false));
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    const interval = window.setInterval(refreshWhenVisible, 5000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [open, isCustomer, loadMessages]);

  useEffect(() => {
    if (open && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      setUnreadCount(0);
    }
  }, [messages, open]);

  function toggleSound() {
    const enabled = !soundEnabled;
    setChatSoundEnabled(enabled);
    setSoundEnabled(enabled);
    if (enabled) playChatNotification();
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await api("/support/messages", {
        method: "POST",
        body: JSON.stringify({ message: draft }),
      });
      setDraft("");
      await loadMessages();
    } catch (cause: unknown) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send support message.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Tooltip title={`Chat with EventHub on WhatsApp (${eventHubSupportPhone})`}>
        <Fab
          component="a"
          href={whatsappSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with EventHub on WhatsApp"
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: { xs: 88, sm: 96 },
            zIndex: (theme) => theme.zIndex.modal + 1,
            width: 58,
            height: 58,
            bgcolor: "#25d366",
            color: "#fff",
            boxShadow: "0 6px 20px rgba(37, 211, 102, 0.3)",
            "&:hover": { bgcolor: "#1da851" },
          }}
        >
          <WhatsApp />
        </Fab>
      </Tooltip>
      <Tooltip title="Chat with EventHub support">
        <Fab
          color="primary"
          aria-label="Chat with EventHub support"
          onClick={() => {
            setOpen(true);
            setUnreadCount(0);
          }}
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: { xs: 16, sm: 24 },
            zIndex: (theme) => theme.zIndex.modal + 1,
            width: 58,
            height: 58,
            boxShadow: "0 6px 20px rgba(62, 38, 45, 0.3)",
          }}
        >
          <Badge badgeContent={unreadCount} color="error" overlap="circular">
            <ChatOutlined />
          </Badge>
        </Fab>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="support-chat-widget-title"
      >
        <DialogTitle id="support-chat-widget-title">
          Chat with EventHub support
          {isCustomer && (
            <Button
              size="small"
              onClick={toggleSound}
              sx={{ display: "block", mt: 0.5, textTransform: "none" }}
            >
              Sound notifications: {soundEnabled ? "On" : "Off"}
            </Button>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {!user ? (
            <Stack spacing={2} sx={{ py: 1 }}>
              <Typography>
                Sign in or create a customer account to chat with EventHub
                support. You can also reach us on WhatsApp at 7050186199.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Button variant="contained" onClick={onLogin}>Log in</Button>
                <Button variant="outlined" onClick={onSignup}>Sign up</Button>
                <Button
                  component="a"
                  href="https://wa.me/917050186199?text=Hi%20EventHub%20support%2C%20I%20need%20help."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp support
                </Button>
              </Stack>
            </Stack>
          ) : !isCustomer ? (
            <Typography sx={{ py: 1 }}>
              In-app support chat is available to customer accounts. You can
              contact EventHub on WhatsApp at 7050186199.
            </Typography>
          ) : (
            <>
              {notification && open && (
                <Alert severity="info" onClose={() => setNotification("")}>
                  {notification}
                </Alert>
              )}
              <Stack ref={messagesRef} spacing={1.5} sx={{ minHeight: 180, maxHeight: 360, overflowY: "auto", py: 1 }}>
                {loading && messages.length === 0 && (
                  <Typography color="text.secondary">Loading conversation…</Typography>
                )}
                {!loading && messages.length === 0 && (
                  <Typography color="text.secondary">
                    Send a message to start chatting with EventHub support.
                  </Typography>
                )}
                {messages.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      alignSelf: entry.sender_role === "ADMIN" ? "flex-start" : "flex-end",
                      maxWidth: "90%",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: entry.sender_role === "ADMIN" ? "#f5f1eb" : "#fcecf1",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {entry.sender_role === "ADMIN" ? "EventHub support" : "You"}
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {entry.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(entry.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
              <Box component="form" onSubmit={sendMessage} sx={{ display: "flex", gap: 1, mt: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Your message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  inputProps={{ maxLength: 2000 }}
                  required
                  multiline
                  maxRows={4}
                />
                <Button type="submit" variant="contained" disabled={sending}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(notification) && !open}
        autoHideDuration={5000}
        onClose={() => setNotification("")}
        message={notification}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              setOpen(true);
              setUnreadCount(0);
              setNotification("");
            }}
          >
            View
          </Button>
        }
      />
    </>
  );
}
