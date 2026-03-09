import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import APIClient from "../util/ApiClient";

export default function LoginPromptModal({ open, onClose, onGuestLogin }) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sign in to sync your calendar</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a free account to sync your Islamic calendar events across
          devices and keep them backed up securely.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
          If you continue as guest, your events stay local in your browser and
          are temporary until you sign in.
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
          onClick={() => onGuestLogin?.()}
        >
          Continue as Guest
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
