import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function ProtectedRouteWrapper() {
  const { user } = useAuth();
  if (!user) {
    // user is not authenticated
    return <Navigate to="/login" />;
  }
  return (
    <div>
      <Outlet />
    </div>
  );
}
