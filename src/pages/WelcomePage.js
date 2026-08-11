import React from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

function WelcomePage() {
  return (
    <div className="text-center mt-24">
      <Link to="/" className="flex items-center gap-3">
        <Logo className="w-10 h-10" />
      </Link>
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome to the Cooperative Portal
      </h2>
      <p className="text-gray-500 mt-2">
        Manage your savings, loans, and contributions.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <Link to="/login">
          <Button variant="secondary">Login</Button>
        </Link>
      </div>
    </div>
  );
}

export default WelcomePage;
