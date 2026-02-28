import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import APIClient from "../util/ApiClient";

export default function LoginPromptModal({ open, onClose, onGuestLogin }) {
  const navigate = useNavigate();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleContinueAsGuest = async () => {
    setGuestLoading(true);
    try {
      const data = await APIClient.createGuestSession();
      if (data?.success && data?.user) {
        onGuestLogin?.(data.user);
      }
    } catch {
      // Guest creation failed — user can retry or pick another option
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sign in to sync your calendar</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a free account to sync your Islamic calendar events across
          devices and keep them backed up securely.
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            window.location.href = APIClient.getGoogleLoginUrl();
          }}
          sx={{ mb: 1 }}
        >
          Continue with Google
        </Button>
        <Button
          variant="text"
          fullWidth
          onClick={() => {
            onClose();
            navigate("/login");
          }}
        >
          Sign in with Email
        </Button>
        <Divider sx={{ my: 1.5 }}>or</Divider>
        <Button
          variant="text"
          fullWidth
          onClick={handleContinueAsGuest}
          disabled={guestLoading}
        >
          {guestLoading ? "Setting up…" : "Continue as Guest"}
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
