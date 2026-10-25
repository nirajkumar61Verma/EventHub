import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

type AboutPageProps = {
  onBrowse: () => void;
  onHelp: () => void;
};

const features = [
  {
    icon: <TravelExploreOutlinedIcon />,
    title: "Discover local talent",
    description:
      "Search event professionals by their service and location, then review their public profiles.",
  },
  {
    icon: <EventAvailableOutlinedIcon />,
    title: "Plan with confidence",
    description:
      "Share event requirements with selected providers and keep track of quotes and replies.",
  },
  {
    icon: <GroupsOutlinedIcon />,
    title: "One account, two ways to participate",
    description:
      "Customers can also publish a service profile and continue using customer planning tools.",
  },
];

export default function AboutPage({ onBrowse, onHelp }: AboutPageProps) {
  return (
    <Box className="information-page">
      <Paper className="information-hero" elevation={0}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <Chip label="ABOUT EVENTHUB" color="primary" variant="outlined" />
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
          >
            Celebrations start with the right people.
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 700 }}>
            EventHub is an event-services marketplace that helps people discover
            providers, describe what they need, and organize their planning in
            one place.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" onClick={onBrowse}>
              Browse providers
            </Button>
            <Button variant="outlined" onClick={onHelp}>
              Visit Help
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Box className="information-feature-grid">
        {features.map((feature) => (
          <Paper
            key={feature.title}
            className="information-feature"
            elevation={0}
          >
            <Box className="information-feature-icon">{feature.icon}</Box>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
              {feature.title}
            </Typography>
            <Typography color="text.secondary">{feature.description}</Typography>
          </Paper>
        ))}
      </Box>
      <Paper className="about-details-card" elevation={0}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          How EventHub works
        </Typography>
        <List disablePadding>
          {[
            "Browse service providers by service and location.",
            "Send an event brief to the providers you choose.",
            "Compare replies, shortlist options, and keep planning notes.",
            "Providers can manage their profile, availability, enquiries, and bookings.",
          ].map((item) => (
            <ListItem key={item} disableGutters>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckCircleOutlineOutlinedIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper className="about-demo-note" elevation={0}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Use the marketplace with care
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Some listings are synthetic demo profiles used for testing. A
          verification status indicates an administrative profile review, not a
          guarantee of provider quality or performance. EventHub does not
          process payments or refunds in this version. Confirm all service
          details, availability, written terms, and payment arrangements
          directly with the provider before committing.
        </Typography>
      </Paper>
    </Box>
  );
}
