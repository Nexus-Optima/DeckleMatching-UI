import { createTheme } from "@mui/material/styles";

export const buttonStyle = {
  textTransform: "none",
  backgroundColor: "black",
  padding: "12px 40px",
  color: "white",
  "&:hover": {
    backgroundColor: "#01CEFF", // Hover color
    color: "black",
  },
};

// Define the theme with typography and any other global styles
const theme = createTheme({
  typography: {
    fontFamily: "Raleway, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: buttonStyle,
      },
    },
  },
});

export default theme;
