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
import NotFoundPage from "./pages/NotFoundPage";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Home from "./pages/app/home/Home";
import Login from "./pages/app/login/Login";
import Register from "./pages/app/register/Register";
import Dashboard from "./pages/app/dashboard/Dashboard";
import Settings from "./pages/app/settings/Settings";
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
          { path: "dashboard", element: <Dashboard /> },
          { path: "settings", element: <Settings /> },
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

export default App = () => {
  return (
    <ThemeProviderWrapper>
      <UserProvider>
        <CssBaseline />
        <RouterProvider router={router} />
      </UserProvider>
    </ThemeProviderWrapper>
  );
};
