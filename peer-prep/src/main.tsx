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
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";

import ApplicationWrapper from "./components/ApplicationWrapper.tsx";
import ProtectedRouteWrapper from "./pages/ProtectedRouteWrapper.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import DashboardPage from "./pages/Dashboard/DashboardPage.tsx";
import SearchingPage from "./pages/Session/Search/SearchingPage.tsx";
import CreateSessionPage from "./pages/Session/Create/CreateSessionPage.tsx";
import QuestionsPage from "./pages/Questions/QuestionsPage.tsx";
import CreateQuestionPage from "./pages/Questions/CreateQuestionPage/CreateQuestionPage.tsx";
import EditQuestionPage from "./pages/Questions/EditQuestionPage/EditQuestionPage.tsx";
import { Notifications } from "@mantine/notifications";
import AdminRouteWrapper from "./pages/AdminRouteWrapper.tsx";
import SessionSummaryPage from "./pages/Session/Summary/SessionSummaryPage.tsx";
import ReadQuestionPage from "./pages/Questions/ReadQuestionPage/ReadQuestionPage.tsx";
import SessionPage from "./pages/Session/SessionPage/SessionPage.tsx";

import "@fontsource/inter";
import { AIProvider } from "./hooks/useAi.tsx";

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
          // admin-only routes
          {
            path: "/",
            element: <AdminRouteWrapper />,
            children: [
              {
                path: "/questions",
                children: [
                  {
                    path: "/questions",
                    element: <QuestionsPage />,
                    loader: async () =>
                      fetch(
                        `${
                          import.meta.env.VITE_API_URL_QUESTION
                        }/question-service`
                      ),
                    // fetch(
                    //   `https://virtserver.swaggerhub.com/PeerPrep/question-service/1.0.0/api/question-service`
                    // ),
                  },
                  {
                    path: "/questions/create",
                    element: <CreateQuestionPage />,
                  },
                  {
                    path: "/questions/edit/:id",
                    element: <EditQuestionPage />,
                  },
                  {
                    path: ":id",
                    element: <ReadQuestionPage />,
                    loader: async ({ params }) =>
                      fetch(
                        `${
                          import.meta.env.VITE_API_URL_QUESTION
                        }/question-service/id/${params.id}`
                      ),
                  },
                ],
              },
            ],
          },

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
                // loader: async () => {
                //   return await Promise.all([
                //     fetch(
                //       `${
                //         import.meta.env.VITE_API_URL
                //       }/question-service/categories`
                //     ),
                //   ]);
                // },
              },
              {
                path: "/session/search",
                element: <SearchingPage />,
              },
              {
                path: "/session/:roomId",
                element: <SessionPage />,
              },
              {
                path: "/session/summary/:roomId",
                element: <SessionSummaryPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

const theme = createTheme({
  fontFamily: "Inter, sans-serif",
  defaultRadius: "md",
  cursorType: "pointer",
  primaryColor: "cyan",
  components: {
    Button: {
      defaultProps: {
        variant: "light",
      },
    },
  },
});

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <MantineProvider theme={theme}>
    <Notifications />
    <AIProvider>
      <RouterProvider router={router}></RouterProvider>
    </AIProvider>
  </MantineProvider>

  // </StrictMode>
);
