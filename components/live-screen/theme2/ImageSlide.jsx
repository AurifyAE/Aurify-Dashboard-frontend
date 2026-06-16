"use client";
import React from "react";
import { Box } from "@mui/material";

// Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

// Swiper styles
import "swiper/css";
import "swiper/css/effect-fade";

const rotatingImages = [
  "/images/gold-bars.jpg",
  "/images/silver-bars.jpg",
  "/images/gold-coin.avif",
  "/images/silver-coin.jpg",
];

const ImageSlide = () => {
  return (
    <Box
      sx={{
        width: { xs: "25vw", md: "16vw" },
        height: { xs: "14vw", md: "7vw" },
        borderRadius: "0.45vw",
        overflow: "hidden",
        margin: "0 auto",
        boxShadow: "0 0.22vw 0.65vw rgba(0,0,0,0.3)",
      }}
    >
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        loop={true}
        autoplay={{
          delay: 2000,
          disableOnInteraction: false,
        }}
        speed={1200}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {rotatingImages.map((image, index) => (
          <SwiperSlide key={index}>
            <img
              src={image}
              alt={`slide-${index}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

export default ImageSlide;