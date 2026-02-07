import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Calendar,
  Sun,
  Moon,
  Leaf,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  Clock,
  Star,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useAppTheme } from "../contexts/ThemeContext";

const Navbar = () => {
  const { user, login, logout } = useUser();
  const { themeMode, setThemeMode } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const navigate = useNavigate();

  const handleOpenUserMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorEl(null);
  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  const navLinks = [
    { name: "Calendar", path: "/calendar", icon: <Calendar size={18} /> },
    { name: "Prayers", path: "/calendar", icon: <Clock size={18} /> },
    { name: "Events", path: "/calendar", icon: <Star size={18} /> },
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
                <Tooltip title="Account settings">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              ) : (
                <Box sx={{ ml: 2, display: "flex", gap: 1 }}>
                  <Button variant="outlined" component={RouterLink} to="/login">
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    component={RouterLink}
                    to="/login"
                  >
                    Get Started
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Mobile Menu Icon */}
          {isMobile && (
            <IconButton color="inherit" onClick={toggleMobileDrawer}>
              <MenuIcon />
            </IconButton>
          )}

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseUserMenu}
            onClick={handleCloseUserMenu}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            PaperProps={{ elevation: 3, sx: { minWidth: 180, mt: 1.5 } }}
          >
            <MenuItem onClick={() => navigate("/settings")}>
              <ListItemIcon>
                <Settings size={18} />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={() => window.location.reload()}>
              <ListItemIcon>
                <LogOut size={18} color="red" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
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
