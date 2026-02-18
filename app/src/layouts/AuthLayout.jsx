import React from "react";
import { Outlet } from "react-router";
import { Container, Box } from "@mui/material";

const AuthLayout = () => {
  return (
    <Container
      maxWidth="xs"
      sx={{
        py: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Outlet />
      </Box>
    </Container>
  );
};

export default AuthLayout;
