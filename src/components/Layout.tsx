import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Shield, 
  Lock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  Menu, 
  X,
  Sun,
  Moon,
  ListTree,
  Stethoscope,
  Briefcase,
  FileText,
  AlertCircle,
  ArrowLeftRight,
  BookOpen,
  Users,
  Search,
  Landmark,
  Settings2,
  Activity,
  MessageCircle,
  BarChart3
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import NotificationListener from "@/components/NotificationListener";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>("book-section");
  const location = useLocation();
  const { signOut, userRole, isAdmin, userName } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);

  const isCFORole = userRole === 'cfo' || userRole === 'admin' || userRole === 'sub_cfo' || userRole?.startsWith('sub_cfo_') || isAdmin;
  const isRestrictedAsstCFO = userRole?.startsWith('sub_cfo_') && userRole !== 'sub_cfo';
  const isEmpOperator = userRole === 'emp_operator';

  const [showSplash, setShowSplash] = useState(() => {
    if (!isCFORole) return false;
    return true;
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const topNavItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", visible: !isRestrictedAsstCFO && !isEmpOperator },
    { to: "/book-section/file-tracking", icon: Shield, label: "File Tracking", visible: !isEmpOperator },
    { to: "/restricted", icon: Lock, label: "Restrict Dashboard", visible: !isRestrictedAsstCFO && !isEmpOperator },
    { to: "/collection-entry", icon: Plus, label: "Collection Entry", visible: !isRestrictedAsstCFO && !isEmpOperator },
    { to: "/bank-entries", icon: Landmark, label: "Bank Entries", visible: !isEmpOperator },
    { to: "/messages", icon: MessageCircle, label: "Messages", visible: true },
    { to: "/user-management", icon: Users, label: "User Management", visible: userRole === 'admin' },
    { to: "/admin-config", icon: Settings2, label: "Admin Config", visible: userRole === 'admin' },
    { to: "/activity-log", icon: Activity, label: "Activity Log", visible: userRole === 'admin' },
    { to: "/file-analytics", icon: BarChart3, label: "File Analytics", visible: userRole === 'admin' || userRole === 'cfo' },
  ].filter(item => item.visible);

  const categories = (userRole || isAdmin) && !isRestrictedAsstCFO ? [
    {
      id: "book-section",
      label: "Sections Management",
      items: [
        { to: "/book-section/emp-details", label: "Employee Details", icon: ListTree, visible: isCFORole || isEmpOperator },
        { to: "/book-section/all-employees", label: "Search All Employees", icon: Search, visible: isCFORole || isEmpOperator },
        { to: "/book-section/medical", label: "Medical Section", icon: Stethoscope, visible: isCFORole && !isEmpOperator },
        { to: "/book-section/contractor", label: "Contractor Section", icon: Briefcase, visible: isCFORole && !isEmpOperator },
        { to: "/book-section/security-deposit", label: "Security Deposit", icon: Lock, visible: isCFORole && !isEmpOperator },
        { to: "/book-section/pol-bills", label: "POL Bills", icon: FileText, visible: isCFORole && !isEmpOperator },
        { to: "/book-section/contingencies", label: "Contingencies", icon: AlertCircle, visible: isCFORole && !isEmpOperator },
        { to: "/book-section/bill-dispatch", label: "Bill Dispatch", icon: ArrowLeftRight, visible: false },
        { to: "/book-section/books", label: "Books", icon: BookOpen, visible: (isCFORole || userRole === 'books') && !isEmpOperator },
        { to: "/book-section/establishment", label: "Establishment", icon: Users, visible: (isCFORole || userRole === 'establishment') && !isEmpOperator },
      ].filter(item => item.visible)
    }
  ] : [];

  const sections = [
    { id: 'emp_details', name: 'Employee Details' },
    { id: 'medical', name: 'Medical Section' },
    { id: 'contractor', name: 'Contractor Section' },
    { id: 'security_deposit', name: 'Security Deposit' },
    { id: 'pol_bills', name: 'POL Bills' },
    { id: 'contingencies', name: 'Contingencies' },
    { id: 'bill_dispatch', name: 'Bill Dispatch' },
    { id: 'books', name: 'Books' },
    { id: 'establishment', name: 'Establishment' },
  ];

  useGSAP(() => {
    if (mainRef.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 relative z-30",
        collapsed ? "w-20" : "w-72"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-border/50">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0 shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
                <span className="text-[10px] font-black text-primary tracking-widest leading-none">KW<br/>SC</span>
              </div>
              <span className="font-bold text-lg tracking-tight">KW&SC FINANCE</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-6">
            <div className="space-y-1">
              {topNavItems.map((item) => (
                <Link key={item.to} to={item.to} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                  location.pathname === item.to ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              ))}
            </div>

            {categories.map((category) => (
              <div key={category.id} className="space-y-2 pt-4 border-t border-border/50">
                {!collapsed && <h3 className="px-3 text-xs font-semibold text-primary uppercase tracking-wider mb-2">{category.label}</h3>}
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link key={item.to} to={item.to} className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                      location.pathname === item.to ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 space-y-2">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">Welcome back,</h2>
            <p className="text-lg font-black text-primary italic uppercase tracking-wider">
              {userName || sections.find(s => s.id === userRole)?.name || userRole}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-tighter">
              {userRole === 'admin' ? 'System Administrator' : 'Active Department'}
            </div>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <OfflineIndicator />
          <NotificationListener />
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card/80 backdrop-blur-xl border-t border-border/50 flex md:hidden items-center justify-around px-6 pb-2 z-50">
        {!isEmpOperator ? (
          <>
            <Link to="/" className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              location.pathname === "/" ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <LayoutDashboard className="w-6 h-6" />
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link to="/book-section/file-tracking" className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              location.pathname === "/book-section/file-tracking" ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <Shield className="w-6 h-6" />
              <span className="text-[10px] font-medium">Tracking</span>
            </Link>
            
            <div className="relative -top-6">
              <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background">
                 <Shield className="w-7 h-7 text-white" />
              </div>
            </div>

            <Link to="/restricted" className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              location.pathname === "/restricted" ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <Lock className="w-6 h-6" />
              <span className="text-[10px] font-medium">Admin</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/book-section/emp-details" className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              location.pathname === "/book-section/emp-details" ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <ListTree className="w-6 h-6" />
              <span className="text-[10px] font-medium">Details</span>
            </Link>
            
            <div className="relative -top-6">
              <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center border-4 border-background">
                 <Users className="w-7 h-7 text-white" />
              </div>
            </div>

            <Link to="/book-section/all-employees" className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              location.pathname === "/book-section/all-employees" ? "text-primary scale-110" : "text-muted-foreground"
            )}>
              <Search className="w-6 h-6" />
              <span className="text-[10px] font-medium">Search</span>
            </Link>
          </>
        )}
        <button onClick={() => signOut()} className="flex flex-col items-center gap-1 text-red-400">
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
      </nav>

      {/* Splash Layer */}
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background pointer-events-none animate-out fade-out duration-1000 fill-mode-forwards delay-1000">
           <div className="relative flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 animate-pulse">
                <Shield className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tighter">KW&SC FINANCE</h1>
           </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
