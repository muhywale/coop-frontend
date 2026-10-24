import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Auth
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);

// Members
export const getMembers = () => api.get("/members");
export const getMember = (id) => api.get(`/members/${id}`);
export const createMember = (data) => api.post("/members", data);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);

// Contributions
export const getContributions = () => api.get("/contributions");
export const getMyContributions = () => api.get("/contributions/mine");
export const createContribution = (data) => api.post("/contributions", data);

// Loans
export const getLoans = () => api.get("/loans");
export const getMyLoans = () => api.get("/loans/mine");
export const createLoan = (data) => api.post("/loans", data);
export const recordRepayment = (loanId, data) =>
  api.post(`/loans/${loanId}/repayments`, data);
export const getRepayments = (loanId) => api.get(`/loans/${loanId}/repayments`);
// in api.js
//export const getMemberBalance = (memberId) =>
//api.get(`/contributions/balance/${memberId}`);

export const getMemberDetail = (id) => api.get(`/members/${id}/detail`);
//individual member
export const getMyDetail = () => api.get("/members/me/detail");
export const getProducts = () => api.get("/products");
export const createProduct = (data) => api.post("/products", data);

export const getMemberTransactions = (id) =>
  api.get(`/members/${id}/transactions`);
export const getMyTransactions = () => api.get("/members/me/transactions");
export const getContributionsSummary = () =>
  api.get("/dashboard/contributions-summary");
export const getLoansSummary = () => api.get("/dashboard/loans-summary");
export const getBalancesByProduct = () => api.get("/dashboard/member-balances");
export const getMemberLedger = (id) => api.get(`/members/${id}/ledger`);
export const getMyLedger = () => api.get("/members/me/ledger");
export const getPaymentsLedger = (search, from, to) =>
  api.get("/dashboard/payments-ledger", { params: { search, from, to } });
export const distributePayment = (data) =>
  api.post("/payments/distribute", data);
export const getMemberLoans = (memberId) =>
  api.get(`/loans/member/${memberId}`);
export const createMemberLogin = (data) => api.post("/auth/create-login", data);
export const changePassword = (data) => api.post("/auth/change-password", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deactivateProduct = (id) => api.delete(`/products/${id}`);
export const getAccounts = () => api.get("/journal/accounts");
export const createJournalEntry = (data) => api.post("/journal/entries", data);
export const getTrialBalance = () => api.get("/journal/trial-balance");
export const getIncomeExpenditure = () =>
  api.get("/journal/income-expenditure");
export const getBalanceSheet = () => api.get("/journal/balance-sheet");
export default api;
export const getMemberPaymentsLedger = (memberId, from, to) =>
  api.get(`/dashboard/member/${memberId}/payments-ledger`, {
    params: { from, to },
  });
export const getMyPaymentsLedger = (from, to) =>
  api.get(`/dashboard/my-payments-ledger`, { params: { from, to } });
export const getAccountLedger = (accountId, year) =>
  api.get(`/journal/accounts/${accountId}/ledger`, { params: { year } });
export const withdrawFunds = (data) => api.post("/payments/withdraw", data);
export const getMemberBalance = (memberId, productId) =>
  api.get(`/contributions/balance/${memberId}`, { params: { productId } });
export const correctContribution = (id) =>
  api.delete(`/payments/contributions/${id}/correct`);
export const getMemberAccountsLedger = (id, groupBy, year) =>
  api.get(`/members/${id}/accounts-ledger`, { params: { groupBy, year } });
export const getMyAccountsLedger = (groupBy, year) =>
  api.get(`/members/me/accounts-ledger`, { params: { groupBy, year } });
export const bulkImportPayments = (data) =>
  api.post("/payments/bulk-import", data);

export const bulkImportLoanRepayments = (data) =>
  api.post("/payments/bulk-import-loan-repayments", data);

export const bulkImportLoans = (data) =>
  api.post("/payments/bulk-import-loans", data);

export const bulkImportOpeningBalances = (data) =>
  api.post("/payments/bulk-import-opening-balances", data);
export const createCooperative = (data) =>
  api.post("/super-admin/cooperatives", data);
export const getCooperatives = () => api.get("/super-admin/cooperatives");
export const bulkImportOpeningTrialBalance = (data) =>
  api.post("/payments/bulk-import-opening-trial-balance", data);
export const bulkImportMembers = (data) =>
  api.post("/payments/bulk-import-members", data);
export const editContributionAmount = (id, newAmount) =>
  api.put(`/payments/contributions/${id}/edit-amount`, {
    new_amount: newAmount,
  });
export const getDashboardStats = (year) =>
  api.get("/dashboard/stats", { params: { year } });
export const editRepaymentAmount = (id, newAmount) =>
  api.put(`/payments/repayments/${id}/edit-amount`, { new_amount: newAmount });
export const deleteRepayment = (id) =>
  api.delete(`/payments/repayments/${id}/delete`);
export const runInterestAccrual = (asAtDate) =>
  api.post("/loans/run-interest-accrual", { as_at_date: asAtDate });
export const getLoanPerformanceReport = () =>
  api.get("/loans/performance-report");
export const editLoan = (id, data) => api.put(`/loans/${id}/edit`, data);
export const deleteMemberDayRecords = (memberId, date) =>
  api.delete("/payments/member-day-records", {
    data: { member_id: memberId, date },
  });
export const deleteLoan = (id) => api.delete(`/loans/${id}`);
export const getChartOfAccounts = (includeInactive) =>
  api.get("/chart-of-accounts", {
    params: { include_inactive: includeInactive ? "true" : undefined },
  });
export const createAccount = (data) => api.post("/chart-of-accounts", data);
export const updateAccount = (id, data) =>
  api.put(`/chart-of-accounts/${id}`, data);
export const deactivateAccount = (id) =>
  api.put(`/chart-of-accounts/${id}/deactivate`);
export const reactivateAccount = (id) =>
  api.put(`/chart-of-accounts/${id}/reactivate`);
export const deleteAccount = (id) => api.delete(`/chart-of-accounts/${id}`);
export const getPaymentSchedule = (periodType, date) =>
  api.get("/schedule", { params: { period_type: periodType, date } });
export const bulkImportChartOfAccounts = (data) =>
  api.post("/payments/bulk-import-chart-of-accounts", data);
export const bulkImportProducts = (data) =>
  api.post("/payments/bulk-import-products", data);
export const getMyCooperative = () => api.get("/cooperative");
export const updateMyCooperative = (data) => api.put("/cooperative", data);
export const matchBankList = (rows) => api.post("/bank-import/match", { rows });
export const importBankLoans = (data) => api.post("/bank-import/loans", data);
export const getAccountCarryForward = () => api.get("/carry-forward/accounts");
export const saveAccountCarryForward = (data) =>
  api.put("/carry-forward/accounts", data);
export const getMemberCarryForward = () => api.get("/carry-forward/members");
export const saveMemberCarryForward = (data) =>
  api.put("/carry-forward/members", data);
export const recordBulkPayments = (data) => api.post("/bulk-payments", data);
export const getUsers = () => api.get("/users");
export const createUser = (data) => api.post("/users", data);
export const updateUserRole = (id, role) =>
  api.put(`/users/${id}/role`, { role });
export const resetUserPassword = (id, temp_password) =>
  api.put(`/users/${id}/reset-password`, { temp_password });
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getBackupExport = (scope) =>
  api.get("/backup/export", { params: { scope } });
export const getAccountStatement = (accountId, year) =>
  api.get(`/statements/account/${accountId}`, { params: { year } });
export const getMemberStatement = (memberId, year) =>
  api.get(`/statements/member/${memberId}`, { params: { year } });
export const getMyStatement = (year) =>
  api.get("/statements/me", { params: { year } });
