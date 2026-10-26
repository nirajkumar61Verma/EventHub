import { Box, Button, Stack, Typography } from "@mui/material";

type AppFooterProps = {
  onPage: (page: string) => void;
};

export default function AppFooter({ onPage }: AppFooterProps) {
  return (
    <Box component="footer" className="app-footer">
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography sx={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
            EventHub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Discover event services and organize your planning.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
          <Button onClick={() => onPage("providers")}>Providers</Button>
          <Button onClick={() => onPage("help")}>Help</Button>
          <Button onClick={() => onPage("about")}>About</Button>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} EventHub
        </Typography>
      </Stack>
    </Box>
  );
}
