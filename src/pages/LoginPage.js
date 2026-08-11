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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await loginUser({ username, password });
      login(response.data.user, response.data.token);

      if (response.data.user.must_change_password) {
        navigate("/change-password");
      } else if (response.data.user.role === "admin") {
        navigate("/");
      } else {
        navigate("/my-profile");
      }
    } catch {
      setError("Invalid username or password");
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
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
      </Card>
    </div>
  );
}

export default LoginPage;
