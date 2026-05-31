import { LayoutDashboard, LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { PosProvider } from "../context/PosContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { CartLine } from "../types/models";

export function PosLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [suspendedSales, setSuspendedSales] = useState<
    Array<{
      id: number;
      cart: CartLine[];
      createdAt: string;
    }>
  >([]);

  return (
    <PosProvider>
      <div className="min-h-screen bg-paper text-ink">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase text-till">POS</p>
            <h1 className="text-lg font-black">Checkout Terminal</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "ADMIN" && (
              <Button variant="secondary" onClick={() => navigate("/admin")}>
                <LayoutDashboard size={17} />
                Admin
              </Button>
            )}
            <Button variant="ghost" onClick={logout}>
              <LogOut size={17} />
              Logout
            </Button>
          </div>
        </header>
        <Outlet />
      </div>
    </PosProvider>
  );
}
