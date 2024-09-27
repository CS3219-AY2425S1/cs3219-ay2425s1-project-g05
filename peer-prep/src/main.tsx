import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import App from "./App.tsx";
import "./index.css";
import {
  BrowserRouter,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/Home/HomePage.tsx";
import LoginOrRegisterPage from "./pages/Login/LoginPage.tsx";
import { Button, createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

import ApplicationWrapper from "./components/ApplicationWrapper.tsx";
import ProtectedRouteWrapper from "./pages/ProtectedRouteWrapper.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.tsx";
import SearchingPage from "./pages/Session/Search/SearchingPage.tsx";
import CreateSessionPage from "./pages/Session/Create/CreateSessionPage.tsx";
const router = createBrowserRouter([
  {
    path: "/",
    element: <ApplicationWrapper />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/login",
        element: <LoginOrRegisterPage />,
      },

      // Protected routes below
      {
        path: "/",
        element: <ProtectedRouteWrapper />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/learn",
            element: <Button>learn!</Button>,
          },
          {
            path: "/session",
            children: [
              {
                path: "/session/create",
                element: <CreateSessionPage />,
              },
              {
                path: "/session/search",
                element: <SearchingPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

const theme = createTheme({
  fontFamily: "Montserrat, sans-serif",
  defaultRadius: "md",
  cursorType: "pointer",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <RouterProvider router={router}></RouterProvider>
    </MantineProvider>
    {/* <BrowserRouter>
      <App />
    </BrowserRouter> */}
  </StrictMode>
);