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
import Dashboard from "./pages/app/dashboard/Dashboard";
import Settings from "./pages/app/settings/Settings";
import CalendarPage from "./pages/app/calendar/Calendar";
import RootLayout from "./layouts/RootLayout";
import CalendarLayout from "./layouts/CalendarLayout";

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
          { path: "dashboard", element: <Dashboard /> },
          { path: "settings", element: <Settings /> },
          { path: "calendar", element: <CalendarPage /> },
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
      {
        // path: "calendar",
        // element: <CalendarLayout />,
        // children: [
        //   { index: true, element: <CalendarPage /> },
        // { path: "prayers", element: <PrayersPage /> },
        // { path: "events", element: <EventsPage /> },
        // ],
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
