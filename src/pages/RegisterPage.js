import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

function RegisterPage() {
  const [formData, setFormData] = useState({
    phone: "",
    member_email: "",
    login_email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await registerUser(formData);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="flex justify-center mb-6">
        <Logo className="w-16 h-16" />
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-2">Register</h2>
        <p className="text-sm text-gray-500 mb-6">
          Use the phone and email the cooperative has on file for you.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            name="phone"
            placeholder="Phone number on file"
            value={formData.phone}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="member_email"
            type="email"
            placeholder="Email on file"
            value={formData.member_email}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <hr className="mb-4 border-gray-200" />
          <input
            name="login_email"
            type="email"
            placeholder="Email to login with"
            value={formData.login_email}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className={inputClass}
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          {success && (
            <p className="text-green-600 text-sm mb-4">
              Account created! Redirecting...
            </p>
          )}
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-600 hover:underline">
            Login here
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default RegisterPage;
