import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router";
import { CssBaseline, Box } from "@mui/material";
import { ThemeProviderWrapper } from "./contexts/ThemeContext";
import { UserProvider } from "./contexts/UserContext";
import { CalendarProvider } from "./contexts/CalendarContext";
import NotFoundPage from "./pages/NotFoundPage";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/app/home/Home";
import Login from "./pages/app/login/Login";
import Register from "./pages/app/register/Register";
import Settings from "./pages/app/settings/settings";
import ManageSubscriptions from "./pages/app/subscriptions/ManageSubscriptions";
import ExportEvents from "./pages/app/export/ExportEvents";
import SubscriptionsHelp from "./pages/app/help/SubscriptionsHelp";
import CalendarPage from "./pages/app/calendar/Calendar";
import DataPolicy from "./pages/app/data-policy/DataPolicy";
import Features from "./pages/app/features/Features";
import Guide from "./pages/app/guide/Guide";
import Methods from "./pages/app/methods/Methods";
import Privacy from "./pages/app/privacy/Privacy";
import Terms from "./pages/app/terms/Terms";
import Learn from "./pages/learn/Learn";
import RootLayout from "./layouts/RootLayout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "",
        element: <MainLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "settings", element: <Settings /> },
          { path: "subscriptions", element: <ManageSubscriptions /> },
          { path: "export", element: <ExportEvents /> },
          { path: "help/subscriptions", element: <SubscriptionsHelp /> },
          { path: "calendar", element: <CalendarPage /> },
          { path: "calendar/:view/:year/:month/:day", element: <CalendarPage /> },
          { path: "calendar/:year/:month", element: <CalendarPage /> },
          { path: "learn", element: <Learn /> },
          { path: "features", element: <Features /> },
          { path: "guide", element: <Guide /> },
          { path: "methods", element: <Methods /> },
          { path: "privacy", element: <Privacy /> },
          { path: "terms", element: <Terms /> },
          { path: "data-policy", element: <DataPolicy /> },
        ],
      },
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          { path: "login", element: <Login /> },
          { path: "register", element: <Register /> },
        ],
      },
      { path: "login", element: <Navigate to="/auth/login" replace /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProviderWrapper>
      <UserProvider>
        <CalendarProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </CalendarProvider>
      </UserProvider>
    </ThemeProviderWrapper>
  );
}
