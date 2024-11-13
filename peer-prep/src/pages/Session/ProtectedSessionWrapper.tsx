import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Question } from "../../types/question";
import { notifications } from "@mantine/notifications";

// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function ProtectedSessionWrapper() {
  const location = useLocation();
  const {
    questionReceived,
    roomIdReceived,
    otherUserIdReceived,
  }: {
    questionReceived: Question;
    roomIdReceived: string;
    otherUserIdReceived: string;
  } = location.state || {};

  if (!questionReceived || !roomIdReceived || !otherUserIdReceived) {
    notifications.show({
      title: "Error: Session not accessible",
      message:
        "Navigating to the session directly is not allowed. Redirecting to the Dashboard.",
      color: "red",
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div>
      <Outlet />
    </div>
  );
}
