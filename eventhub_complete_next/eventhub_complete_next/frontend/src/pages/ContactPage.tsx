import { CallOutlined, EmailOutlined, LocationOnOutlined } from "@mui/icons-material";
import { Box, Button, Link, Paper, Stack, Typography } from "@mui/material";
import { eventHubSupportPhone } from "../contactDetails";

const contacts = [
  { name: "Juhi Singh", phone: eventHubSupportPhone },
  { name: "Niraj Kumar", phone: "8904832498" },
];
const contactEmail = "juhisingh2707191@gmail.com";
export default function ContactPage() {
  return (
    <Box className="information-page">
      <Paper className="information-hero" elevation={0}>
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <CallOutlined color="primary" fontSize="large" />
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}
          >
            Contact EventHub
          </Typography>
          <Typography color="text.secondary">
            Have a question or need help? Call our team using one of the numbers
            below.
          </Typography>
        </Stack>
      </Paper>
      <Stack spacing={2} sx={{ mt: 3 }}>
        {contacts.map((contact) => (
          <Paper
            key={contact.phone}
            elevation={0}
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              p: { xs: 2.5, sm: 3 },
              border: "1px solid #e7e1d7",
              borderRadius: 3,
              bgcolor: "#fffdf9",
            }}
          >
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                {contact.name}
              </Typography>
              <Typography color="text.secondary">{contact.phone}</Typography>
            </Box>
            <Button
              component="a"
              href={`tel:${contact.phone}`}
              variant="contained"
              startIcon={<CallOutlined />}
              sx={{
                alignSelf: { xs: "stretch", sm: "center" },
                borderRadius: 2,
                bgcolor: "#29251f",
                textTransform: "none",
                fontWeight: 700,
                "&:hover": { bgcolor: "#514333" },
              }}
            >
              Call {contact.name.split(" ")[0]}
            </Button>
          </Paper>
        ))}
      </Stack>dhdj
      <Paper
        elevation={0}
        sx={{
          display: "grid",
          gap: 2,
          mt: 2,
          p: { xs: 2.5, sm: 3 },
          border: "1px solid #e7e1d7",
          borderRadius: 3,
          bgcolor: "#fffdf9",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <EmailOutlined color="primary" />
          <Box>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
              Email
            </Typography>
            <Link href={`mailto:${contactEmail}`} color="inherit">
              {contactEmail}
            </Link>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <LocationOnOutlined color="primary" />
          <Box>
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
              Contact address
            </Typography>
            <Typography color="text.secondary">
              Nisha Anand, Ratu Road, 825301
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
