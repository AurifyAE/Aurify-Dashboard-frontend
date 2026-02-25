import React from "react";

const Loader: React.FC = () => {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes segmentFill {
          0%, 100% { opacity: 0.1; }
          25%, 75% { opacity: 1; }
        }

        .loader-part {
          opacity: 0.1;
          animation: segmentFill 1.6s ease-in-out infinite;
        }

        .part-top { animation-delay: 0s; }
        .part-right { animation-delay: 0.4s; }
        .part-bottom { animation-delay: 0.8s; }
        .part-left { animation-delay: 1.2s; }
      `}</style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="47"
        height="50"
        viewBox="0 0 47 50"
        fill="none"
      >
        <defs>
          <linearGradient
            id="paint0"
            x1="20.4453"
            y1="0.0087"
            x2="20.4453"
            y2="13.8638"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#306EBB" />
            <stop offset="0.205952" stopColor="#3070BC" />
            <stop offset="0.571429" stopColor="#3A96D2" />
            <stop offset="0.792857" stopColor="#42BCE9" />
            <stop offset="1" stopColor="#53CABB" />
          </linearGradient>

          <linearGradient
            id="paint1"
            x1="25.7978"
            y1="24.5417"
            x2="46.6015"
            y2="24.5417"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#306EBB" />
            <stop offset="0.205952" stopColor="#3070BC" />
            <stop offset="0.571429" stopColor="#3A96D2" />
            <stop offset="0.792857" stopColor="#42BCE9" />
            <stop offset="1" stopColor="#53CABB" />
          </linearGradient>

          <linearGradient
            id="paint2"
            x1="11.3972"
            y1="10.6431"
            x2="11.3972"
            y2="38.5029"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#306EBB" />
            <stop offset="0.205952" stopColor="#3070BC" />
            <stop offset="0.571429" stopColor="#3A96D2" />
            <stop offset="0.792857" stopColor="#42BCE9" />
            <stop offset="1" stopColor="#53CABB" />
          </linearGradient>

          <linearGradient
            id="paint3"
            x1="20.6725"
            y1="35.553"
            x2="20.6724"
            y2="49.5842"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#306EBB" />
            <stop offset="0.205952" stopColor="#3070BC" />
            <stop offset="0.571429" stopColor="#3A96D2" />
            <stop offset="0.792857" stopColor="#42BCE9" />
            <stop offset="1" stopColor="#53CABB" />
          </linearGradient>
        </defs>

        {/* TOP */}
        <g className="loader-part part-top">
          <path
            d="M9.51172 5.48387L24.7512 13.8742C26.4127 11.4613 28.7616 9.54194 31.397 8.11613L18.0481 0.767736C17.1315 0.219352 16.1575 0 15.1836 0C12.2617 0 9.51172 2.30323 9.51172 5.48387Z"
            fill="url(#paint0)"
          />
        </g>

        {/* RIGHT */}
        <g className="loader-part part-right">
          <path
            d="M25.7812 14.4217L44.1145 24.5668L40.1614 26.7604C40.1614 26.7604 33.3437 30.7636 26.1823 34.9314C27.901 37.2346 30.25 39.0443 32.9427 40.2507L45.0885 33.5055C46.0624 30.8184 46.578 27.912 46.578 24.841C46.578 21.6055 45.9478 18.4249 44.8593 15.5733L32.6562 8.82812C29.9062 10.0894 27.5573 12.0636 25.7812 14.4217Z"
            fill="url(#paint1)"
          />
        </g>

        {/* LEFT */}
        <g className="loader-part part-left">
          <path
            d="M0 14.4774L18.3333 24.5677L14.3801 26.7613C14.3801 26.7613 7.56247 30.7645 0.401043 34.9322L0.458333 34.9871C3.26561 38.6064 8.53642 39.5387 12.6041 37.2903L22.7447 31.6419C21.828 29.4484 21.3124 27.1451 21.3124 24.6225C21.3124 22.1548 21.828 19.7419 22.7447 17.6032L12.3749 11.8451C10.8854 11.0225 9.28121 10.6387 7.67705 10.6387C4.75519 10.6387 1.83333 12.0096 0 14.4774Z"
            fill="url(#paint2)"
          />
        </g>

        {/* BOTTOM */}
        <g className="loader-part part-bottom">
          <path
            d="M9.625 44.6384C9.625 48.4223 13.9791 50.8352 17.4166 48.9158L31.6822 40.9642C29.1041 39.7029 26.8124 37.8384 25.151 35.5352C17.8177 39.8126 10.4271 44.1448 9.625 44.6384Z"
            fill="url(#paint3)"
          />
        </g>
      </svg>
    </div>
  );
};

const styles: { container: React.CSSProperties } = {
  container: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(2px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default Loader;
