import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login button clicked, attempting request...");
    setError("");
    try {
      const response = await loginUser({ email, password });
      login(response.data.user, response.data.token); // ← this line was missing

      if (response.data.user.role === "admin") {
        navigate("/");
      } else {
        navigate("/my-profile");
      }
    } catch (err) {
      console.log("Login error caught:", err);
      console.log("Error response:", err.response);
      console.log("Error message:", err.message);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <div className="flex justify-center mb-6">
        <Logo className="w-16 h-16" />
      </div>
      <Card>
        <h2 className="text-xl font-bold mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary-600 hover:underline">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default LoginPage;
