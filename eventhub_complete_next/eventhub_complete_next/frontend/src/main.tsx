import { createRoot } from "react-dom/client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import "./style.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#9b315a", dark: "#74213f", light: "#c15a7c" },
    secondary: { main: "#c78935", dark: "#946020", light: "#e4b66c" },
    background: { default: "#fff9f2", paper: "#fffdf9" },
    text: { primary: "#38232d", secondary: "#74616a" },
    success: { main: "#47775b" },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    h1: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h2: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h3: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h4: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h5: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h6: { fontFamily: 'Georgia, "Times New Roman", serif' },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20, minHeight: 42 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>,
);
