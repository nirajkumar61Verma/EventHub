import { useState, type FormEvent } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";

type HomePageProps = {
  onBrowse: () => void;
  onSearch: (criteria: { service: string; location: string }) => void;
  onSignup: () => void;
  onHelp: () => void;
  onAbout: () => void;
};

const searchableServices = [
  "Photography",
  "Catering",
  "Decoration",
  "Music & DJ",
  "Makeup",
];

const services = [
  { label: "Photography", icon: <CameraAltOutlinedIcon /> },
  { label: "Catering", icon: <RestaurantOutlinedIcon /> },
  { label: "Decoration", icon: <CelebrationOutlinedIcon /> },
  { label: "Music & DJ", icon: <MusicNoteOutlinedIcon /> },
  { label: "Makeup", icon: <SpaOutlinedIcon /> },
  { label: "More event services", icon: <TravelExploreOutlinedIcon /> },
];

const steps = [
  {
    number: "01",
    title: "Explore providers",
    description:
      "Search by service and location, then review provider profiles, experience, pricing, and reviews.",
  },
  {
    number: "02",
    title: "Share your event brief",
    description:
      "Tell selected providers your event date, location, guest count, budget, and service needs.",
  },
  {
    number: "03",
    title: "Compare and decide",
    description:
      "Track replies, save providers to your shortlist, and keep your planning notes together.",
  },
];

export default function HomePage({
  onBrowse,
  onSearch,
  onSignup,
  onHelp,
  onAbout,
}: HomePageProps) {
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  function searchProviders(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({ service, location: location.trim() });
  }

  return (
    <Box className="home-page">
      <Box className="hero">
        <Box className="hero-copy">
          <p className="eyebrow">YOUR CELEBRATION, ALL IN ONE PLACE</p>
          <Typography variant="h1" className="hero-title">
            Plan the day.<br />Find your <span>people.</span>
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 570, fontSize: 18 }}>
            Organize your event, discover trusted service providers, and keep
            your plans, replies, and shortlist together.
          </Typography>
          <Box component="form" className="home-provider-search" onSubmit={searchProviders}>
            <Typography component="label" htmlFor="home-service-search" className="home-search-label">
              Find the right people for your event
            </Typography>
            <Box className="home-search-fields">
              <TextField
                id="home-service-search"
                select
                size="small"
                label="Service"
                value={service}
                onChange={(event) => setService(event.target.value)}
                className="home-search-service"
              >
                <MenuItem value="">Any service</MenuItem>
                {searchableServices.map((item) => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="City or area"
                placeholder="e.g. Bengaluru"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="home-search-location"
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchOutlinedIcon />}
                className="home-search-submit"
              >
                Search
              </Button>
            </Box>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={onSignup}>
              <EventAvailableOutlinedIcon sx={{ mr: 1 }} />
              Plan my event
            </Button>
            <Button className="hero-secondary-button" variant="outlined" onClick={onBrowse}>
              Browse all providers
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Weddings · birthdays · family celebrations · and everything in between
          </Typography>
        </Box>
        <Box className="hero-art" aria-hidden="true">
          <span className="hero-art-glow" />
          <span className="hero-flower flower-one">✿</span>
          <span className="hero-flower flower-two">✿</span>
          <span className="hero-flower flower-three">✿</span>
          <span className="hero-confetti confetti-one">✦</span>
          <span className="hero-confetti confetti-two">✧</span>
          <span className="hero-confetti confetti-three">✦</span>
          <Paper className="celebration-card" elevation={0}>
            <span className="celebration-card-ribbon">YOUR DAY, YOUR WAY</span>
            <span className="celebration-card-symbol">
              <CelebrationOutlinedIcon />
            </span>
            <span className="celebration-card-title">Let the good<br />days begin</span>
            <span className="celebration-card-caption">Plan something unforgettable</span>
            <span className="celebration-card-dots"><i /><i /><i /></span>
          </Paper>
          <Paper className="floating-note floating-note-top" elevation={0}>
            <span>✦</span> Made for your moment
          </Paper>
          <Paper className="floating-note floating-note-bottom" elevation={0}>
            <EventAvailableOutlinedIcon /> Your celebration starts here
          </Paper>
          <span className="hero-art-orbit orbit-one" />
          <span className="hero-art-orbit orbit-two" />
        </Box>
      </Box>

      <Box component="section" className="home-section">
        <Box className="home-section-heading">
          <Box>
            <Typography className="home-eyebrow">FIND YOUR EVENT TEAM</Typography>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
              Services for every celebration
            </Typography>
          </Box>
          <Button endIcon={<TravelExploreOutlinedIcon />} onClick={onBrowse}>
            Browse all
          </Button>
        </Box>
        <Box className="home-service-grid">
          {services.map((service) => (
            <Paper
              key={service.label}
              component="button"
              type="button"
              className="home-service-card"
              elevation={0}
              onClick={() =>
                onSearch({
                  service:
                    service.label === "More event services" ? "" : service.label,
                  location: "",
                })
              }
            >
              <span className="home-service-icon">{service.icon}</span>
              <Typography component="span" sx={{ fontWeight: 650 }}>
                {service.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Box component="section" className="home-section">
        <Box className="home-section-heading">
          <Box>
            <Typography className="home-eyebrow">A SIMPLE WAY TO GET STARTED</Typography>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
              Your whole event, easier to manage
            </Typography>
          </Box>
        </Box>
        <Box className="home-steps-grid">
          {steps.map((step) => (
            <Paper key={step.number} className="home-step-card" elevation={0}>
              <Typography className="home-step-number">{step.number}</Typography>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                {step.title}
              </Typography>
              <Typography color="text.secondary">{step.description}</Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      <Paper className="home-planner-banner" elevation={0}>
        <EventAvailableOutlinedIcon color="primary" fontSize="large" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            Keep your event moving, all in one place
          </Typography>
          <Typography color="text.secondary">
            Plan your event, track provider replies, save your favorites, and
            keep notes handy as you decide.
          </Typography>
        </Box>
        <Button variant="contained" onClick={onSignup}>
          Get started
        </Button>
      </Paper>

      <Paper className="home-transparency-note" elevation={0}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          A note about listings and bookings
        </Typography>
        <Typography color="text.secondary">
          Some listings are synthetic demo profiles for testing and may be
          marked pending verification. An EventHub verification status reflects
          a platform review; it is not a guarantee of service quality. EventHub
          does not process payments in this version. Confirm availability,
          written terms, cancellation arrangements, and payment directly with a
          provider before committing.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button onClick={onAbout}>Learn about EventHub</Button>
          <Button onClick={onHelp}>Visit Help</Button>
        </Stack>
      </Paper>
    </Box>
  );
}
