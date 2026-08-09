import React from "react";

function Logo({ className = "w-10 h-10" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" fill="#2f7ed8" />
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="#1a5296"
        strokeWidth="2"
      />
      {/* Three interlocking figures representing cooperation */}
      <circle cx="35" cy="38" r="9" fill="#ffffff" />
      <circle cx="65" cy="38" r="9" fill="#ffffff" />
      <circle cx="50" cy="30" r="9" fill="#eef7ff" />
      <path
        d="M 25 68 Q 25 50 40 50 Q 50 50 50 60 Q 50 50 60 50 Q 75 50 75 68 Z"
        fill="#ffffff"
      />
      <path d="M 50 30 Q 35 30 35 45 L 65 45 Q 65 30 50 30 Z" fill="#eef7ff" />
    </svg>
  );
}

export default Logo;
