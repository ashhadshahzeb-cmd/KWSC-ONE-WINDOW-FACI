import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { VoiceProvider } from "@/contexts/VoiceContext";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import GeneralLedger from "./pages/GeneralLedger";
import BankAccounts from "./pages/BankAccounts";
import Transactions from "./pages/Transactions";
import BankEntries from "./pages/BankEntries";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import RegularEmployee from "./pages/book-section/RegularEmployee";
import RetiredEmployee from "./pages/book-section/RetiredEmployee";
import EmpDetails from "./pages/book-section/EmpDetails";
import AllEmployees from "./pages/book-section/AllEmployees";
import AllEmployeeDetail from "./pages/book-section/AllEmployeeDetail";
import Medical from "./pages/book-section/Medical";
import Contractor from "./pages/book-section/Contractor";
import SecurityDeposit from "./pages/book-section/SecurityDeposit";
import PolBills from "./pages/book-section/PolBills";
import Contingencies from "./pages/book-section/Contingencies";
import ChequeRecord from "./pages/book-section/ChequeRecord";
import BillDispatch from "./pages/book-section/BillDispatch";
import FileTracking from "./pages/book-section/FileTracking";
import FileRecordDetail from "./pages/book-section/FileRecordDetail";
import Books from "./pages/book-section/Books";
import Establishment from "./pages/book-section/Establishment";
import PublicTracking from "./pages/PublicTracking";
import CpFund from "./pages/regular-employee/CpFund";
import Placeholder from "./pages/Placeholder";
import UserManagement from "./pages/UserManagement";
import Messages from "./pages/Messages";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AuthPage from "./pages/Auth";
import RestrictedDashboard from "./pages/RestrictedDashboard";
import CollectionEntry from "./pages/CollectionEntry";
import AdminConfig from "./pages/AdminConfig";
import ActivityLog from "./pages/ActivityLog";
import FileAnalytics from "./pages/FileAnalytics";

const queryClient = new QueryClient();

const DashboardRedirect = () => {
  const { userRole } = useAuth();
  const isRestrictedAsstCFO = userRole?.startsWith('sub_cfo_') && userRole !== 'sub_cfo';
  const isEmpOperator = userRole === 'emp_operator';
  
  if (isRestrictedAsstCFO) {
    return <Navigate to="/book-section/file-tracking" replace />;
  }
  
  if (isEmpOperator) {
    return <Navigate to="/book-section/emp-details" replace />;
  }
  
  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <VoiceProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<AuthPage />} />
                <Route path="/public-track/:diaryNo/:receivingNo" element={<PublicTracking />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={
                            <ProtectedRoute>
                              <DashboardRedirect />
                            </ProtectedRoute>
                          } />
                          <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
                          <Route path="/general-ledger" element={<GeneralLedger />} />
                          <Route path="/bank-accounts" element={<BankAccounts />} />
                          <Route path="/transactions" element={<Transactions />} />
                          <Route path="/bank-entries" element={<BankEntries />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/book-section/regular-employee" element={<RegularEmployee />} />
                          <Route path="/book-section/retired-employee" element={<RetiredEmployee />} />
                          <Route path="/book-section/emp-details" element={<EmpDetails />} />
                          <Route path="/book-section/all-employees" element={<AllEmployees />} />
                          <Route path="/book-section/all-employees/:id" element={<AllEmployeeDetail />} />
                          <Route path="/book-section/medical" element={<Medical />} />
                          <Route path="/book-section/contractor" element={<Contractor />} />
                          <Route path="/book-section/security-deposit" element={<SecurityDeposit />} />
                          <Route path="/book-section/pol-bills" element={<PolBills />} />
                          <Route path="/book-section/contingencies" element={<Contingencies />} />
                          <Route path="/book-section/bill-dispatch" element={<BillDispatch />} />
                          <Route path="/book-section/file-tracking" element={<FileTracking />} />
                          <Route path="/book-section/file-record/:receivingNo" element={<FileRecordDetail />} />
                          <Route path="/restricted" element={<RestrictedDashboard />} />
                          <Route path="/collection-entry" element={<CollectionEntry />} />
                          <Route path="/user-management" element={<UserManagement />} />
                          <Route path="/admin-config" element={<AdminConfig />} />
                          <Route path="/activity-log" element={<ActivityLog />} />
                          <Route path="/file-analytics" element={<FileAnalytics />} />
                          <Route path="/messages" element={<Messages />} />
                          <Route path="/book-section/cheque-record" element={<ChequeRecord />} />
                          <Route path="/book-section/books" element={<Books />} />
                          <Route path="/book-section/establishment" element={<Establishment />} />
                          <Route path="/regular-employee/cp-fund" element={<CpFund />} />
                          <Route path="/regular-employee/supp-salary" element={<CpFund title="Supp Salary" />} />
                          <Route path="/regular-employee/house-building" element={<CpFund title="House Building" />} />
                          <Route path="/regular-employee/marriage-bike" element={<CpFund title="Marriage/Bike" />} />
                          <Route path="/regular-employee/medical-case" element={<CpFund title="Medical Case" />} />
                          <Route path="/regular-employee/over-time" element={<CpFund title="Over Time" />} />
                          <Route path="/regular-employee/tada" element={<CpFund title="TADA" />} />

                          <Route path="/retired-employee/fund" element={<CpFund title="Fund" />} />
                          <Route path="/retired-employee/lpr" element={<CpFund title="LPR" />} />
                          <Route path="/retired-employee/pension-gratuity" element={<CpFund title="Pension/Gratuity" />} />
                          <Route path="/retired-employee/pension-arrear" element={<CpFund title="Pension Arrear" />} />
                          <Route path="/retired-employee/financial-assist" element={<CpFund title="Financial Assist" />} />
                          <Route path="/retired-employee/funeral-charges" element={<CpFund title="Funeral Charges" />} />
                          <Route path="/retired-employee/group-insurance" element={<CpFund title="Group Insurance" />} />

                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </BrowserRouter>
          </VoiceProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
