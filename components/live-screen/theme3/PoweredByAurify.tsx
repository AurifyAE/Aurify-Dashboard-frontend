import React from "react";
import { Box, Typography } from "@mui/material";
const AurifyLogo = "/images/aurify-logo.svg";

const PoweredByAurify = () => {
  return (
    <Box
      sx={{
        textDecoration: "none",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.6vw",
        padding: "0.8vw 1.4vw",
        // margin: "0 auto",
      }}
    >
      <Typography
        component="a"
        href="https://www.aurify.ae"
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          fontSize: { xs: "15px", md: "1.2vw" },

          fontWeight: 500,
          color: "#FFC983",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5vw",
          whiteSpace: "nowrap",
          letterSpacing: "0.05em",
        }}
      >
        Powered by
        <Box
          component="img"
          src={AurifyLogo}
          alt="Aurify"
          sx={{
            height: { xs: "5vw", md: "1.5vw" },
            objectFit: "contain",
          }}
        />
      </Typography>
    </Box>
  );
};

export default PoweredByAurify;
