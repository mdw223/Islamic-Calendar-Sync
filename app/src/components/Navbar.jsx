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
  Tooltip,
} from "@mui/material";
import {
  Calendar,
  Download,
  Sun,
  Moon,
  Leaf,
  Menu as MenuIcon,
  X,
  Star,
  Settings as SettingsIcon,
  GraduationCap,
  Share2,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { ThemeContext } from "../contexts/ThemeContext";
import UserBadge from "./UserBadge";
import GlobalSearch from "./GlobalSearch";

const Navbar = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };
  const { themeMode, setThemeMode } = useContext(ThemeContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "Islamic Calendar Sync",
      text: "Sync Islamic/Hijri dates directly to your calendar app — holidays, events, and more with their meanings. Check it out!",
      url: "https://islamiccalendarsync.com",
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled or share failed — no action needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          shareData.text + "\n" + shareData.url,
        );
      } catch {
        // clipboard access denied — snackbar still shows so user sees something
      }
    }
  };
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));

  const toggleMobileDrawer = () => setMobileOpen(!mobileOpen);

  const navLinks = [
    { name: "Learn", path: "/learn", icon: <GraduationCap size={18} /> },
    { name: "Calendar", path: "/calendar", icon: <Calendar size={18} /> },
    { name: "Export", path: "/export", icon: <Download size={18} /> },
    { name: "Subscriptions", path: "/subscriptions", icon: <Star size={18} /> },
    { name: "Settings", path: "/settings", icon: <SettingsIcon size={18} /> },
  ];

  const themes = ["light", "dark", "green"];
  const themeIcons = { light: <Sun size={18} />, dark: <Moon size={18} />, green: <Leaf size={18} /> };
  const themeLabels = { light: "Light theme", dark: "Dark theme", green: "Green theme" };

  const cycleTheme = () => {
    const next = themes[(themes.indexOf(themeMode) + 1) % themes.length];
    setThemeMode(next);
  };

  return (
    <>
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
        <Container maxWidth={false} disableGutters sx={{ px: 0 }}>
          <Toolbar
            disableGutters
            sx={{
              justifyContent: "space-between",
              px: 3,
              pr: { xs: 1, sm: 2 },
            }}
          >
            {/* Logo */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                flexGrow: 1,
                minWidth: 0,
              }}
            >
              <img
                src="/ics-logo.png"
                alt="ICS Logo"
                width={32}
                height={32}
                style={{ marginRight: 8 }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  display: { xs: "block", md: "none" },
                  textAlign: "left",
                }}
              >
                ICS
              </Typography>
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  display: { xs: "none", md: "block" },
                  textAlign: "left",
                }}
              >
                Islamic Calendar Sync
              </Typography>
            </Box>

            {/* Desktop Nav */}
            {!isMobile && (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Tooltip title="Share with friends">
                  <IconButton
                    onClick={handleShare}
                    color="inherit"
                    aria-label="Share"
                  >
                    <Share2 size={20} />
                  </IconButton>
                </Tooltip>
                <GlobalSearch />
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

                <Tooltip title={themeLabels[themeMode]}>
                  <IconButton onClick={cycleTheme} color="inherit" aria-label="cycle theme">
                    {themeIcons[themeMode]}
                  </IconButton>
                </Tooltip>

                {user.isLoggedIn ? (
                  <UserBadge
                    user={user}
                    onSettings={() => navigate("/settings")}
                    onSignOut={handleSignOut}
                  />
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/auth/login"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Sign In
                    </Button>
                  </Box>
                )}
              </Box>
            )}

            {/* Mobile: menu icon and profile or sign-in */}
            {isMobile && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Tooltip title="Share with friends">
                  <IconButton
                    onClick={handleShare}
                    color="inherit"
                    aria-label="Share"
                  >
                    <Share2 size={20} />
                  </IconButton>
                </Tooltip>
                <GlobalSearch />
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
    </>
  );
};

export default Navbar;
