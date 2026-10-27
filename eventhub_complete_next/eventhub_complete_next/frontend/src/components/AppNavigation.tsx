import { useEffect, useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
} from "@mui/material";
import type { ReactNode } from "react";

type AppNavigationProps = {
  user: any;
  onLogout: () => void;
  onPage: (page: string) => void;
};

export default function AppNavigation({
  user,
  onLogout,
  onPage,
}: AppNavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  function navigate(page: string) {
    onPage(page);
    setMenuOpen(false);
    setAccountAnchor(null);
  }

  function drawerLink(label: string, page: string, icon: ReactNode, primary = false) {
    return (
      <button
        className={`drawer-link${primary ? " drawer-link-primary" : ""}`}
        key={page}
        onClick={() => navigate(page)}
      >
        <span className="drawer-link-icon">{icon}</span>
        <span className="drawer-link-label">{label}</span>
        <ArrowForwardRoundedIcon className="drawer-link-arrow" />
      </button>
    );
  }

  const displayName = user?.full_name || user?.name || "";
  const firstName = displayName.trim().split(/\s+/)[0];
  const roleLabel =
    user?.role === "ADMIN"
      ? "EventHub administrator"
      : ["PROVIDER", "CUSTOMER_PROVIDER"].includes(user?.role)
        ? "Event service provider"
        : "Event planner";
  const brandTagline =
    ["PROVIDER", "CUSTOMER_PROVIDER"].includes(user?.role)
      ? "Event service provider"
      : user?.role === "ADMIN"
        ? "EventHub administrator"
        : "Make every moment memorable";
  const referralLink = user?.referral_code
    ? `${window.location.origin}/?ref=${encodeURIComponent(user.referral_code)}`
    : "";
  const referralMessage = `Join me on EventHub to discover event services and plan celebrations. Sign up here: ${referralLink}`;
  const whatsappReferralUrl = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;
  const emailReferralUrl = `mailto:?subject=${encodeURIComponent("Join me on EventHub")}&body=${encodeURIComponent(referralMessage)}`;

  return (
    <>
      <nav className="app-nav">
        <button
          className="menu-toggle"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MenuIcon />
        </button>
        <button
          className="app-brand-block"
          type="button"
          onClick={() => navigate("home")}
          aria-label={`EventHub. ${brandTagline}`}
        >
          <strong className="app-brand">EventHub</strong>
          <span className="app-brand-tagline">{brandTagline}</span>
        </button>
        <Tooltip title={user ? "Account menu" : "Help and information"}>
          <IconButton
            className="account-menu-toggle"
            aria-label={user ? "Open account menu" : "Open help and information menu"}
            aria-controls={accountAnchor ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={accountAnchor ? "true" : undefined}
            onClick={(event) => setAccountAnchor(event.currentTarget)}
            size="large"
          >
            <span className="account-menu-name">
              {user ? displayName || "My account" : "Sign in"}
            </span>
            {user && firstName ? (
              <Avatar className="account-menu-avatar">
                {firstName[0].toUpperCase()}
              </Avatar>
            ) : (
              <AccountCircleOutlinedIcon />
            )}
          </IconButton>
        </Tooltip>
        <Menu
          id="account-menu"
          className="account-menu-popover"
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
          slotProps={{ paper: { className: "account-menu-paper" } }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {user ? (
            <>
              <Box className="account-menu-welcome">
                <Avatar className="account-menu-large-avatar">
                  {firstName?.[0]?.toUpperCase() || <AccountCircleOutlinedIcon />}
                </Avatar>
                <Box className="account-menu-welcome-copy">
                  <Typography className="account-menu-greeting">
                    Welcome{firstName ? `, ${firstName}` : " back"}
                  </Typography>
                  <Typography className="account-menu-email">
                    {user.email || "Your EventHub account"}
                  </Typography>
                  <span className="account-menu-role">{roleLabel}</span>
                  {user.referral_code && (
                    <Box
                      sx={{
                        mt: 1,
                        px: 1.25,
                        py: 0.75,
                        border: "1px solid #f0dfd5",
                        borderRadius: 1.5,
                        bgcolor: "#fffaf5",
                      }}
                    >
                      <Typography
                        component="span"
                        sx={{ display: "block", color: "#74616a", fontSize: 10 }}
                      >
                        YOUR REFERRAL CODE
                      </Typography>
                      <Typography
                        component="strong"
                        sx={{
                          color: "#9b315a",
                          fontFamily: "monospace",
                          fontSize: 14,
                          letterSpacing: 1,
                        }}
                      >
                        {user.referral_code}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              {referralLink && (
                <>
                  <Divider className="account-menu-divider" />
                  <Typography className="account-menu-section-label">SHARE YOUR REFERRAL</Typography>
                  <MenuItem
                    component="a"
                    href={whatsappReferralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="account-menu-item"
                    onClick={() => setAccountAnchor(null)}
                  >
                    <span className="account-menu-item-icon account-menu-whatsapp-icon"><WhatsAppIcon /></span>
                    <span>Invite by WhatsApp</span>
                    <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
                  </MenuItem>
                  <MenuItem
                    component="a"
                    href={emailReferralUrl}
                    className="account-menu-item"
                    onClick={() => setAccountAnchor(null)}
                  >
                    <span className="account-menu-item-icon"><EmailOutlinedIcon /></span>
                    <span>Invite by email</span>
                    <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
                  </MenuItem>
                </>
              )}
              <Divider className="account-menu-divider" />
              <Typography className="account-menu-section-label">YOUR ACCOUNT</Typography>
              <MenuItem className="account-menu-item" onClick={() => navigate("profile")}>
                <span className="account-menu-item-icon"><PersonOutlineOutlinedIcon /></span>
                <span>My profile</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
              <MenuItem className="account-menu-item" onClick={() => navigate("settings")}>
                <span className="account-menu-item-icon"><SettingsOutlinedIcon /></span>
                <span>Settings</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
              <Divider className="account-menu-divider" />
              <Typography className="account-menu-section-label">DISCOVER EVENTHUB</Typography>
              <MenuItem className="account-menu-item" onClick={() => navigate("help")}>
                <span className="account-menu-item-icon"><HelpOutlineIcon /></span>
                <span>Help & support</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
              <MenuItem className="account-menu-item" onClick={() => navigate("about")}>
                <span className="account-menu-item-icon"><InfoOutlinedIcon /></span>
                <span>About EventHub</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
              <Divider className="account-menu-divider" />
              <MenuItem
                className="account-menu-item account-menu-logout"
                onClick={() => {
                  setAccountAnchor(null);
                  onLogout();
                }}
              >
                <span className="account-menu-item-icon"><LogoutOutlinedIcon /></span>
                <span>Sign out</span>
              </MenuItem>
            </>
          ) : (
            <>
              <Box className="account-menu-guest-header">
                <span className="account-menu-guest-sparkle" aria-hidden="true">✦</span>
                <Typography className="account-menu-guest-title">
                  Welcome to EventHub
                </Typography>
                <Typography className="account-menu-guest-subtitle">
                  Find your people. Celebrate your way.
                </Typography>
              </Box>
              <Box className="account-menu-guest-actions">
                <MenuItem
                  className="account-menu-item account-menu-signup"
                  onClick={() => navigate("signup")}
                >
                  <span className="account-menu-item-icon"><PersonAddAlt1OutlinedIcon /></span>
                  <span>Create your account</span>
                  <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
                </MenuItem>
                <MenuItem className="account-menu-item" onClick={() => navigate("login")}>
                  <span className="account-menu-item-icon"><LoginOutlinedIcon /></span>
                  <span>Sign in</span>
                  <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
                </MenuItem>
              </Box>
              <Divider className="account-menu-divider" />
              <MenuItem className="account-menu-item" onClick={() => navigate("help")}>
                <span className="account-menu-item-icon"><HelpOutlineIcon /></span>
                <span>Help & support</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
              <MenuItem className="account-menu-item" onClick={() => navigate("about")}>
                <span className="account-menu-item-icon"><InfoOutlinedIcon /></span>
                <span>About EventHub</span>
                <ArrowForwardRoundedIcon className="account-menu-item-arrow" />
              </MenuItem>
            </>
          )}
        </Menu>
      </nav>
      {menuOpen && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Close navigation menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="app-drawer" aria-label="Main navigation">
            <div className="drawer-navigation">
              <div className="drawer-section">
                <p className="drawer-section-title">DISCOVER</p>
                {drawerLink("Providers", "providers", <ExploreOutlinedIcon />)}
                <button className="drawer-link" onClick={() => navigate("help")}>
                  <span className="drawer-link-icon"><HelpOutlineIcon /></span>
                  <span className="drawer-link-label">Help</span>
                  <ArrowForwardRoundedIcon className="drawer-link-arrow" />
                </button>
                <button className="drawer-link" onClick={() => navigate("about")}>
                  <span className="drawer-link-icon"><InfoOutlinedIcon /></span>
                  <span className="drawer-link-label">About EventHub</span>
                  <ArrowForwardRoundedIcon className="drawer-link-arrow" />
                </button>
              </div>
              {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
                <div className="drawer-section">
                  <p className="drawer-section-title">YOUR CELEBRATION</p>
                  {drawerLink("Plan an event", "event-request", <EventNoteOutlinedIcon />, true)}
                  {drawerLink("My planner dashboard", "customer-dashboard", <FavoriteBorderOutlinedIcon />)}
                </div>
              )}
              {user?.role === "CUSTOMER" && (
                <div className="drawer-section">
                  <p className="drawer-section-title">GROW WITH EVENTHUB</p>
                  {drawerLink("Become a service provider", "become-provider", <StorefrontOutlinedIcon />, true)}
                </div>
              )}
              {["PROVIDER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
                <div className="drawer-section">
                  <p className="drawer-section-title">YOUR BUSINESS</p>
                  {drawerLink("Provider Dashboard", "provider", <DashboardOutlinedIcon />, true)}
                  {drawerLink("Edit business profile", "provider-edit", <StorefrontOutlinedIcon />)}
                </div>
              )}
              {user?.role === "ADMIN" && (
                <div className="drawer-section">
                  <p className="drawer-section-title">MANAGEMENT</p>
                  {drawerLink("Admin", "admin", <AdminPanelSettingsOutlinedIcon />, true)}
                </div>
              )}
            </div>
            <div className="drawer-account">
              {user ? (
                <>
                  <p className="drawer-section-title">ACCOUNT</p>
                  <button className="drawer-link" onClick={() => navigate("profile")}>
                    <span className="drawer-link-icon"><PersonOutlineOutlinedIcon /></span>
                    <span className="drawer-link-label">My profile</span>
                    <ArrowForwardRoundedIcon className="drawer-link-arrow" />
                  </button>
                  <button className="drawer-link" onClick={() => navigate("settings")}>
                    <span className="drawer-link-icon"><SettingsOutlinedIcon /></span>
                    <span className="drawer-link-label">Settings</span>
                    <ArrowForwardRoundedIcon className="drawer-link-arrow" />
                  </button>
                  <button
                    className="drawer-link drawer-link-logout"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    <span className="drawer-link-icon"><LogoutOutlinedIcon /></span>
                    <span className="drawer-link-label">Logout</span>
                  </button>
                </>
              ) : (
                <div className="drawer-guest-actions">
                  <button className="drawer-link" onClick={() => navigate("login")}>
                    <span className="drawer-link-icon"><LoginOutlinedIcon /></span>
                    <span className="drawer-link-label">Login</span>
                    <ArrowForwardRoundedIcon className="drawer-link-arrow" />
                  </button>
                  {drawerLink("Create your account", "signup", <PersonAddAlt1OutlinedIcon />, true)}
                  <p>Find your people. Celebrate your way.</p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
