import { useState } from "react";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";
import MenuIcon from "@mui/icons-material/Menu";
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";

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

  function navigate(page: string) {
    onPage(page);
    setMenuOpen(false);
    setAccountAnchor(null);
  }

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
        <b className="app-brand" onClick={() => navigate("home")}>EventHub</b>
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
            <AccountCircleOutlinedIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="account-menu"
          anchorEl={accountAnchor}
          open={Boolean(accountAnchor)}
          onClose={() => setAccountAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          {user ? (
            <>
              <MenuItem onClick={() => navigate("profile")}>My profile</MenuItem>
              <MenuItem onClick={() => navigate("settings")}>Settings</MenuItem>
              <MenuItem onClick={() => navigate("help")}>
                <HelpOutlineIcon fontSize="small" sx={{ mr: 1.25 }} />
                Help
              </MenuItem>
              <MenuItem onClick={() => navigate("about")}>
                <InfoOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />
                About EventHub
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAccountAnchor(null);
                  onLogout();
                }}
              >
                Logout
              </MenuItem>
            </>
          ) : (
            <>
              <MenuItem onClick={() => navigate("help")}>
                <HelpOutlineIcon fontSize="small" sx={{ mr: 1.25 }} />
                Help
              </MenuItem>
              <MenuItem onClick={() => navigate("about")}>
                <InfoOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />
                About EventHub
              </MenuItem>
              <MenuItem onClick={() => navigate("login")}>Login</MenuItem>
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
            <div className="drawer-heading">
              <strong>EventHub</strong>
              <button
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <button onClick={() => navigate("providers")}>Providers</button>
            <button onClick={() => navigate("help")}>Help</button>
            <button onClick={() => navigate("about")}>About EventHub</button>
            {["CUSTOMER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
              <>
                <button onClick={() => navigate("event-request")}>
                  Plan an event
                </button>
                <button onClick={() => navigate("customer-dashboard")}>
                  My planner dashboard
                </button>
              </>
            )}
            {user?.role === "CUSTOMER" && (
              <button onClick={() => navigate("become-provider")}>
                Become a service provider
              </button>
            )}
            {["PROVIDER", "CUSTOMER_PROVIDER"].includes(user?.role) && (
              <button onClick={() => navigate("provider")}>Provider Dashboard</button>
            )}
            {user?.role === "ADMIN" && (
              <button onClick={() => navigate("admin")}>Admin</button>
            )}
            {user ? (
              <>
                <button onClick={() => navigate("profile")}>My profile</button>
                <button onClick={() => navigate("settings")}>Settings</button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate("login")}>Login</button>
                <button className="primary" onClick={() => navigate("signup")}>
                  Sign up
                </button>
              </>
            )}
          </aside>
        </>
      )}
    </>
  );
}
