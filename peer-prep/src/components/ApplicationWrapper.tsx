import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar/Navbar";
import { AuthProvider } from "../hooks/useAuth";

import { NativeEventSource, EventSourcePolyfill } from "event-source-polyfill";
import { AIProvider } from "../hooks/useAi";
const EventSource = NativeEventSource || EventSourcePolyfill;
// https://stackoverflow.com/questions/70833727/using-react-router-v6-i-need-a-navbar-to-permanently-be-there-but-cant-display
export default function ApplicationWrapper() {
  // @ts-ignore
  globalThis.EventSource = EventSource;
  return (
    <div>
      <AuthProvider>
        <AIProvider>
          <Navbar />
          <Outlet />
        </AIProvider>
      </AuthProvider>
    </div>
  );
}
