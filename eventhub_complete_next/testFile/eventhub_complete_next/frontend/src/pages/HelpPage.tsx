import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";

type HelpPageProps = {
  onBrowse: () => void;
  onSignup: () => void;
};

const questions = [
  {
    question: "How do I find an event service provider?",
    answer:
      "Open Providers and search by service, business, state, or city. Select a provider to see their profile, starting price, experience, reviews, and any published social links.",
  },
  {
    question: "How do I request a quote?",
    answer:
      "Sign in as a customer, choose Plan an event, enter the event details and service requirements, and select one or more providers. Your requests and replies appear in the event-planning flow.",
  },
  {
    question: "Can I save providers while I decide?",
    answer:
      "Yes. Use Shortlist planner on a provider card. From My planner dashboard, you can compare saved providers, add planning notes, and choose a final planner.",
  },
  {
    question: "How can I offer my own service?",
    answer:
      "Create a customer account, open the hamburger menu, and select Become a service provider. You can enter any event service, such as mehndi artist, dancer, or anchor, and create a profile without losing customer features.",
  },
  {
    question: "Why does my provider listing show pending verification?",
    answer:
      "New provider profiles are reviewed by an administrator before they are marked verified. A verified status means the profile has passed the platform's review process; it is not a guarantee of service quality, availability, or an event outcome. Some listings are synthetic demo profiles and should not be treated as real businesses.",
  },
  {
    question: "How do I update my account or provider profile?",
    answer:
      "Use the account icon in the top-right corner for My profile and Settings. Provider Dashboard lets providers update their service profile, logo, social links, enquiries, bookings, and availability.",
  },
  {
    question: "Does EventHub collect payment or handle refunds?",
    answer:
      "No. This version of EventHub does not process payments or refunds. Confirm the price, payment schedule, cancellation terms, and any refund arrangement directly with the provider, and keep a written record of what you agree.",
  },
  {
    question: "Is a quote request a confirmed booking?",
    answer:
      "No. A quote request starts a conversation and a provider reply is not a confirmed booking by itself. Confirm the date, scope of work, total price, deliverables, and cancellation terms directly with the provider before making plans.",
  },
  {
    question: "What information is shared when I request a quote?",
    answer:
      "Your event brief can include event type, date, location, guest count, budget, service needs, and notes. It is sent to the provider or providers you select so they can respond. Avoid adding passwords, identity documents, or payment-card details to event notes.",
  },
  {
    question: "What can people see on a provider profile?",
    answer:
      "Provider profiles are part of the public marketplace and can show the provider's business and service details, service location, description, logo, social links, and reviews. Providers should only publish business information and contact links they are comfortable sharing publicly.",
  },
  {
    question: "How should I choose a provider safely?",
    answer:
      "Review the profile, status, experience, and available reviews. Ask for a written quote and confirm availability, inclusions, payment timing, and cancellation terms. Do not rely on a verification badge alone, and do not send money based only on a demo listing.",
  },
  {
    question: "Can I leave or report a review?",
    answer:
      "Customers can leave a review on provider profiles, and completed bookings also have a review flow. Use the report option on a review if it appears inappropriate; administrators can review reported content.",
  },
  {
    question: "How do I get account support or delete my account?",
    answer:
      "Use Settings to update your profile, password, and notification preferences. This local MVP does not currently provide an in-app support ticket or self-service account deletion flow. Do not enter sensitive information in public profile fields or event notes.",
  },
];

export default function HelpPage({ onBrowse, onSignup }: HelpPageProps) {
  return (
    <Box className="information-page">
      <Paper className="information-hero" elevation={0}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <HelpOutlineIcon color="primary" fontSize="large" />
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
          >
            How can we help?
          </Typography>
          <Typography color="text.secondary">
            Quick answers for finding providers, planning an event, and offering
            your own services.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" onClick={onBrowse}>
              Explore providers
            </Button>
            <Button variant="outlined" onClick={onSignup}>
              Create an account
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 700 }}>
          Frequently asked questions
        </Typography>
        {questions.map((item) => (
          <Accordion key={item.question} elevation={0} disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
