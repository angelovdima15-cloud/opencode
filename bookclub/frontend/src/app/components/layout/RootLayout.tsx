import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { BottomTabBar } from "../shared/BottomTabBar";
import { Toaster } from "../ui/sonner";

function isSubFlowRoute(pathname: string) {
  return pathname.includes("/club/");
}

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const showTabBar = !isSubFlowRoute(location.pathname);

  return (
    <div className="fixed inset-0 flex justify-center items-start overflow-hidden" style={{ background: "#0F0F0F" }}>
      <div
        className="relative w-full h-full flex flex-col overflow-hidden"
        style={{ maxWidth: "430px", background: "#0F0F0F" }}
      >
        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: showTabBar ? "68px" : "0" }}>
          <Outlet />
        </main>
        {showTabBar && <BottomTabBar />}
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}
