import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const clockConfig = [
  {
    key: "india",
    label: "INDIA",
    timeZone: "Asia/Kolkata",
    flag: "/images/india.png",
  },
  {
    key: "uae",
    label: "UAE",
    timeZone: "Asia/Dubai",
    flag: "/images/uae.png",
  },
  {
    key: "london",
    label: "LONDON",
    timeZone: "Europe/London",
    flag: "/images/uk.png",
  },
  {
    key: "usa",
    label: "USA",
    timeZone: "America/New_York",
    flag: "/images/usa.png",
  },
];

const WorldClockHorizontal = () => {
  const [times, setTimes] = useState({});

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      const updatedTimes = {};

      clockConfig.forEach((clock) => {
        updatedTimes[clock.key] = now.toLocaleTimeString("en-US", {
          ...timeOptions,
          timeZone: clock.timeZone,
        });
      });

      setTimes(updatedTimes);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        gap: "1vw",
        width: "100%",
      }}
    >
      {clockConfig.map((clock) => (
        <Box
          key={clock.key}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: {
              xs: "10px",
              lg: "1vw",
            },
          }}
        >
          <Box
            sx={{
              width: {
                xs: "30px",
                lg: "3vw",
              },
            }}
          >
            <img
              src={clock.flag}
              alt={clock.label}
              style={{ width: "100%", height: "auto" }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "start",
              flexDirection: "column",
            }}
          >
            <Typography
              sx={{



                fontSize: {
                  xs: "14px",
                  lg: "1vw",
                },
                fontWeight: 500,
                color: "#FFC983",
              }}
            >
              {clock.label}
            </Typography>

            <Typography
              sx={{



                fontSize: {
                  xs: "14px",
                  lg: "1vw",
                },
                color: "#FFC983",
              }}
            >
              {times[clock.key] || "--:--"}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default WorldClockHorizontal;
