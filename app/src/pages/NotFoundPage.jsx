import React from "react";
import { Link } from "react-router";
import { Button, Container, Typography, Box } from "@mui/material";

const NotFoundPage = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ px: { xs: 2, md: 3, lg: 4 }, py: 8, textAlign: "center" }}>
        <Typography
          variant="h1"
          sx={{ mb: 3, fontSize: "6rem", fontWeight: "bold" }}
        >
          404
        </Typography>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          Page Not Found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mx: "auto", mb: 4, maxWidth: "md" }}
        >
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button variant="contained" component={Link} to="/" size="large">
          Return Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
