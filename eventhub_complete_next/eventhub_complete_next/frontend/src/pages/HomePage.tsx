import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import MusicNoteOutlinedIcon from "@mui/icons-material/MusicNoteOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";

type HomePageProps = {
  onBrowse: () => void;
  onSignup: () => void;
  onHelp: () => void;
  onAbout: () => void;
};

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
  onSignup,
  onHelp,
  onAbout,
}: HomePageProps) {
  return (
    <Box className="home-page">
      <Box className="hero">
        <p className="eyebrow">EVENT SERVICES MARKETPLACE</p>
        <Typography
          variant="h1"
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(42px, 7vw, 78px)",
            fontWeight: 700,
            lineHeight: 0.98,
            maxWidth: 900,
            my: 1.5,
          }}
        >
          Plan the event. Find the people. Bring it to life.
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 680, fontSize: 18 }}>
          Discover event professionals, share what you need, and keep your
          planning organized with EventHub.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
          <Button variant="contained" onClick={onBrowse}>
            Explore providers
          </Button>
          <Button variant="outlined" onClick={onSignup}>
            Create an account
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Start browsing without an account. Sign in to shortlist providers or
          send event requests.
        </Typography>
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
              onClick={onBrowse}
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
              From idea to event plan
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
            Planning a wedding, birthday, or special gathering?
          </Typography>
          <Typography color="text.secondary">
            Keep your event details, provider replies, shortlist, and notes
            together in one place.
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
