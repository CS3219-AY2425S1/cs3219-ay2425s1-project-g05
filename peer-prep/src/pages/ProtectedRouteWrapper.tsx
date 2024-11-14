import { Navigate, Outlet } from "react-router-dom";
import { AUTH_STATUS, useAuth } from "../hooks/useAuth";

// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function ProtectedRouteWrapper() {
  const { user, authStatus } = useAuth();

  if (authStatus === AUTH_STATUS.LOADING) {
    return <></>;
  }

  if (authStatus === AUTH_STATUS.LOGGED_OUT) {
    // user is not authenticated
    return <Navigate to="/login" />;
  }
  return (
    <div>
      <Outlet />
    </div>
  );
}
