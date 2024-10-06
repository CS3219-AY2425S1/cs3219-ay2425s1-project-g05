import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { notifications } from "@mantine/notifications";

// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function AdminRouteWrapper() {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user || !user.isAdmin) {
    // user is not admin
    // show an error admin message
    notifications.show({
      message: "You are not authorized to view this page!",
      title: "Authorization error!",
      color: "red",
    });

    // navigate to previous page
    // navigate(-1);
    // return;
    return <Navigate to="/" />;
  }
  return (
    <div>
      <Outlet />
    </div>
  );
}
