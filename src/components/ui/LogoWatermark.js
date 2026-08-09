import React from "react";
import Logo from "./Logo";

function LogoWatermark() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <Logo className="w-[600px] h-[600px] opacity-[0.06]" />
    </div>
  );
}

export default LogoWatermark;
