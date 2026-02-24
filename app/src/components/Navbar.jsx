import React, { useState, useContext } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Calendar,
  Sun,
  Moon,
  Leaf,
  Menu as MenuIcon,
  X,
  Clock,
  Star,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { ThemeContext } from "../contexts/ThemeContext";
import UserBadge from "./UserBadge";

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };
  const { themeMode, setThemeMode } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  const navLinks = [
    { name: "Calendar", path: "/calendar", icon: <Calendar size={18} /> },
    { name: "Prayers", path: "/prayers", icon: <Clock size={18} /> },
    { name: "Events", path: "/events", icon: <Star size={18} /> },
  ];

  const handleThemeToggle = (event, newTheme) => {
    if (newTheme !== null) setThemeMode(newTheme);
  };

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(8px)",
        backgroundColor: "background.paper",
        opacity: 0.95,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* Logo */}
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 800, color: "primary.main", mr: 1 }}
            >
              🌙
            </Typography>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 700, display: { xs: "none", sm: "block" } }}
            >
              Islamic Calendar Sync
            </Typography>
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {navLinks.map((link) => (
                <Button
                  key={link.name}
                  component={RouterLink}
                  to={link.path}
                  startIcon={link.icon}
                  sx={{
                    color: "text.secondary",
                    "&:hover": { color: "primary.main" },
                  }}
                >
                  {link.name}
                </Button>
              ))}

              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

              <ToggleButtonGroup
                value={themeMode}
                exclusive
                onChange={handleThemeToggle}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    border: "none",
                    borderRadius: "50% !important",
                    m: 0.5,
                  },
                }}
              >
                <ToggleButton value="light" aria-label="light theme">
                  <Sun size={18} />
                </ToggleButton>
                <ToggleButton value="dark" aria-label="dark theme">
                  <Moon size={18} />
                </ToggleButton>
                <ToggleButton value="green" aria-label="green theme">
                  <Leaf size={18} />
                </ToggleButton>
              </ToggleButtonGroup>

              {user.isLoggedIn ? (
                <UserBadge
                  user={user}
                  onSettings={() => navigate("/settings")}
                  onSignOut={handleSignOut}
                />
              ) : (
                <Box sx={{ ml: 2, display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/auth/login"
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/auth/login"
                  >
                    Get Started
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Mobile: menu icon and profile or sign-in */}
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {user.isLoggedIn ? (
                <UserBadge
                  user={user}
                  onSettings={() => navigate("/settings")}
                  onSignOut={handleSignOut}
                />
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  component={RouterLink}
                  to="/auth/login"
                >
                  Sign In
                </Button>
              )}
              <IconButton color="inherit" onClick={toggleMobileDrawer}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={toggleMobileDrawer}>
        <Box sx={{ width: 250, p: 2 }} role="presentation">
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <IconButton onClick={toggleMobileDrawer}>
              <X />
            </IconButton>
          </Box>
          <List>
            {navLinks.map((link) => (
              <ListItem
                component="div"
                button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  toggleMobileDrawer();
                }}
              >
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.name} />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ px: 2 }}>
            Theme
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-around", p: 1 }}>
            <IconButton
              onClick={() => setThemeMode("light")}
              color={themeMode === "light" ? "primary" : "default"}
            >
              <Sun />
            </IconButton>
            <IconButton
              onClick={() => setThemeMode("dark")}
              color={themeMode === "dark" ? "primary" : "default"}
            >
              <Moon />
            </IconButton>
            <IconButton
              onClick={() => setThemeMode("green")}
              color={themeMode === "green" ? "primary" : "default"}
            >
              <Leaf />
            </IconButton>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
