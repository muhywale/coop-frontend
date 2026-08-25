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
import JournalEntryPage from "./pages/JournalEntryPage";
import TrialBalancePage from "./pages/TrialBalancePage";
import IncomeExpenditurePage from "./pages/IncomeExpenditurePage";
import BalanceSheetPage from "./pages/BalanceSheetPage";
import Sidebar from "./components/Sidebar";
import ScrollToTop from "./components/ScrollToTop";
import AccountLedgerPage from "./pages/AccountLedgerPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import ExcelImportPage from "./pages/ExcelImportPage";
import SuperAdminPage from "./pages/SuperAdminPage";

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 relative lg:flex">
      <LogoWatermark />
      {user && (
        <Sidebar
          isAdmin={user.role === "admin" || user.role === "super_admin"}
          onLogout={logout}
          userLabel={user.username || user.email}
          user={user}
        />
      )}

      <main className="relative z-10 flex-1 min-w-0 p-4 sm:p-6">
        {" "}
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
          <Route
            path="/journal-entry"
            element={
              <ProtectedRoute adminOnly>
                <JournalEntryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trial-balance"
            element={
              <ProtectedRoute adminOnly>
                <TrialBalancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/income-expenditure"
            element={
              <ProtectedRoute adminOnly>
                <IncomeExpenditurePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/balance-sheet"
            element={
              <ProtectedRoute adminOnly>
                <BalanceSheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account-ledger"
            element={
              <ProtectedRoute adminOnly>
                <AccountLedgerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/withdrawal"
            element={
              <ProtectedRoute adminOnly>
                <WithdrawalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/excel-import"
            element={
              <ProtectedRoute adminOnly>
                <ExcelImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute superAdmin>
                <SuperAdminPage />
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
        <ScrollToTop />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
