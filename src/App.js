import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import WelcomePage from "./pages/WelcomePage";
import ContributionsPage from "./pages/ContributionsPage";
import LoansPage from "./pages/LoansPage";
import MyLoansPage from "./pages/MyLoansPage";
import RegisterPage from "./pages/RegisterPage";
import MemberDetailPage from "./pages/MemberDetailPage";
import MembersPage from "./pages/MemberPage";
import MyProfilePage from "./pages/MyProfilePage";
import DashboardPage from "./pages/DashboardPage";
import Logo from "./components/ui/Logo";
import LogoWatermark from "./components/ui/LogoWatermark";
import PaymentsLedgerPage from "./pages/PaymentsLedgerPage";
import PaymentDistributionPage from "./pages/PaymentDistributionPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ProductsPage from "./pages/ProductsPage";

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <LogoWatermark />
      <header className="relative z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <Link to="/" className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
        </Link>
        {user && (
          <div className="flex items-center gap-2 sm:gap-4">
            <Navigation isAdmin={user.role === "admin"} />
            <button
              onClick={logout}
              className="text-xs sm:text-sm text-gray-500 hover:text-red-600 border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute adminOnly>
                <MembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contributions"
            element={
              <ProtectedRoute adminOnly>
                <ContributionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute adminOnly>
                <LoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members/:id"
            element={
              <ProtectedRoute adminOnly>
                <MemberDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/register" element={<RegisterPage />} />;
          <Route
            path="/my-loans"
            element={
              <ProtectedRoute>
                <MyLoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                <MyProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments-ledger"
            element={
              <ProtectedRoute adminOnly>
                <PaymentsLedgerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-entry"
            element={
              <ProtectedRoute adminOnly>
                <PaymentDistributionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute adminOnly>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
