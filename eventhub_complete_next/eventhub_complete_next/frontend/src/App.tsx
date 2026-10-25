import { useCallback, useEffect, useState } from "react";
import { Alert, Backdrop, Box, CircularProgress, Snackbar } from "@mui/material";
import { api, subscribeApiFeedback } from "./api/client";
import AppNavigation from "./components/AppNavigation";
import AdminDashboard from "./features/admin/AdminDashboard";
import PlannerShortlist from "./features/customer/PlannerShortlist";
import ProviderMarketplace from "./features/marketplace/ProviderMarketplace";
import ProviderProfile from "./features/marketplace/ProviderProfile";
import ProviderDashboard from "./features/provider/ProviderDashboard";
import BecomeProviderPage from "./features/provider/BecomeProviderPage";
import EventRequestPage from "./pages/EventRequestPage";
import ProfilePage, { type ProfileValues } from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import SignupPage, { type SignupValues } from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import HelpPage from "./pages/HelpPage";
import AboutPage from "./pages/AboutPage";
import HomePage from "./pages/HomePage";
import AppFooter from "./components/AppFooter";

export default function App() {
  const [user, setUser] = useState<any>(() =>
    JSON.parse(localStorage.getItem("eh_user") || "null"),
  );
  const [page, setPage] = useState("home");
  const [providerId, setProviderId] = useState(0);
  const [requestProviderId, setRequestProviderId] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [showLoading, setShowLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  useEffect(
    () =>
      subscribeApiFeedback((event) => {
        if (event.type === "pending") {
          setPendingRequests(event.count);
        } else {
          setToast({ message: event.message, severity: event.severity });
        }
      }),
    [],
  );

  useEffect(() => {
    if (pendingRequests === 0) {
      setShowLoading(false);
      return;
    }
    const timeout = window.setTimeout(() => setShowLoading(true), 250);
    return () => window.clearTimeout(timeout);
  }, [pendingRequests]);

  function startEventRequest(initialProviderId = 0) {
    setRequestProviderId(initialProviderId);
    setPage("event-request");
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setPage("home");
  }

  async function signup(values: SignupValues) {
    const data = await api("/auth/signup", {
      method: "POST",
      body: JSON.stringify(values),
    });
    localStorage.setItem("eh_token", data.access_token);
    localStorage.setItem("eh_user", JSON.stringify(data.user));
    setUser(data.user);
    setPage("home");
  }

  const loadProfile = useCallback(
    async (): Promise<ProfileValues> => api("/profile"),
    [],
  );

  async function saveProfile(values: ProfileValues) {
    const updated = await api("/profile", {
      method: "PUT",
      body: JSON.stringify(values),
    });
    const nextUser = { ...user, ...updated, name: updated.full_name };
    localStorage.setItem("eh_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  return (
    <>
      <AppNavigation user={user} onLogout={logout} onPage={setPage} />
      {page === "home" && (
        <HomePage
          onBrowse={() => setPage("providers")}
          onSignup={() =>
            setPage(
              !user
                ? "signup"
                : ["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user.role)
                  ? "event-request"
                  : "providers",
            )
          }
          onHelp={() => setPage("help")}
          onAbout={() => setPage("about")}
        />
      )}
      {page === "help" && (
        <HelpPage
          onBrowse={() => setPage("providers")}
          onSignup={() => setPage("signup")}
        />
      )}
      {page === "about" && (
        <AboutPage
          onBrowse={() => setPage("providers")}
          onHelp={() => setPage("help")}
        />
      )}
      {page === "providers" && (
        <ProviderMarketplace
          user={user}
          onOpen={(id) => {
            setProviderId(id);
            setPage("provider-profile");
          }}
          onLogin={() => setPage("login")}
        />
      )}
      {page === "provider-profile" && (
        <ProviderProfile
          id={providerId}
          user={user}
          onLogin={() => setPage("login")}
          onRequest={startEventRequest}
        />
      )}
      {page === "event-request" &&
        ["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
        <EventRequestPage
          api={api}
          initialProviderId={requestProviderId || undefined}
          onBrowse={() => setPage("providers")}
        />
      )}
      {page === "customer-dashboard" &&
        ["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
        <PlannerShortlist
          onOpen={(id) => {
            setProviderId(id);
            setPage("provider-profile");
          }}
          onBrowse={() => setPage("providers")}
          onPlan={() => startEventRequest()}
        />
      )}
      {page === "become-provider" && user?.role === "CUSTOMER" && (
        <BecomeProviderPage
          onComplete={(updatedUser) => {
            setUser(updatedUser);
            setPage("provider");
          }}
        />
      )}
      {page === "login" && (
        <LoginPage
          onDone={() => {
            setUser(JSON.parse(localStorage.getItem("eh_user") || "null"));
            setPage("home");
          }}
          onSignup={() => setPage("signup")}
        />
      )}
      {page === "signup" && (
        <SignupPage onSignup={signup} onLogin={() => setPage("login")} />
      )}
      {page === "profile" && user && (
        <ProfilePage onLoad={loadProfile} onSave={saveProfile} />
      )}
      {page === "settings" && user && (
        <SettingsPage
          user={user}
          onProfileLoad={loadProfile}
          onProfileSave={saveProfile}
        />
      )}
      {page === "provider" &&
        ["PROVIDER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
        <ProviderDashboard />
      )}
      {page === "admin" && user?.role === "ADMIN" && <AdminDashboard />}
      <AppFooter onPage={setPage} />
      <Backdrop
        className="app-loading-backdrop"
        open={showLoading}
        aria-label="Loading"
      >
        <Box className="app-loading-indicator">
          <CircularProgress
            aria-label="Loading"
            size={42}
            thickness={4}
            sx={{ color: "#9b315a" }}
          />
          <span>One moment, please...</span>
        </Box>
      </Backdrop>
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4500}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 1600 }}
        onClose={(_, reason) => {
          if (reason !== "clickaway") setToast(null);
        }}
      >
        {toast ? (
          <Alert
            onClose={() => setToast(null)}
            severity={toast.severity}
            variant="filled"
            className="app-toast"
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
