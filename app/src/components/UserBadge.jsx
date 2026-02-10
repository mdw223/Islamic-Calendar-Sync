import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import { Settings, LogOut } from "lucide-react";

/**
 * Profile badge: avatar + dropdown menu (Settings, Sign Out).
 * @param {Object} user - User object with at least name and/or email
 * @param {() => void} onSettings - Called when Settings is clicked
 * @param {() => void} onSignOut - Called when Sign Out is clicked
 */
export default function UserBadge({ user, onSettings, onSignOut }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const displayName = user?.name?.trim() || user?.email || "?";
  const initial = displayName.charAt(0).toUpperCase();

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSettings = () => {
    handleClose();
    if (onSettings) onSettings();
    else navigate("/settings");
  };

  const handleSignOut = () => {
    handleClose();
    if (onSignOut) onSignOut();
  };

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleOpen}
          sx={{ p: 0, ml: 1 }}
          size="small"
          aria-haspopup="true"
          aria-expanded={Boolean(anchorEl)}
        >
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{ elevation: 3, sx: { minWidth: 180, mt: 1.5 } }}
      >
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Settings size={18} />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogOut size={18} color="red" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </>
  );
}
