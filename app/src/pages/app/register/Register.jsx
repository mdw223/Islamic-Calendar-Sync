import React from "react";
import { Link as RouterLink } from "react-router";
import { Typography, Paper, Box, Button } from "@mui/material";

const Register = () => {
  return (
    <Paper
      elevation={12}
      sx={{ p: 4, borderRadius: 5, width: "100%", textAlign: "center" }}
    >
      <Typography variant="h5" fontWeight={800} gutterBottom>
        Create Account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Registration coming soon.
      </Typography>
      <Button component={RouterLink} to="/auth/login" variant="contained">
        Go to Login
      </Button>
    </Paper>
  );
};

export default Register;
