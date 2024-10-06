import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar/Navbar";
import { AuthProvider } from "../hooks/useAuth";

// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function ApplicationWrapper() {
  return (
    <div>
      <AuthProvider>
        <Navbar />
        <Outlet />
      </AuthProvider>
    </div>
  );
}
