import React from "react";

function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "font-medium px-4 py-2 rounded-md transition text-sm";
  const variants = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white",
    secondary: "border border-gray-300 text-gray-600 hover:bg-gray-50",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
