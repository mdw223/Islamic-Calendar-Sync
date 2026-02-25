import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import APIClient from "../util/ApiClient";

export default function LoginPromptModal({ open, onClose }) {
  const navigate = useNavigate();

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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
