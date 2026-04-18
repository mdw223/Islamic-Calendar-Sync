import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
  alpha,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ShieldCheck, MailQuestion } from "lucide-react";
import AppleIcon from "../../../assets/apple.svg";
import MicrosoftIcon from "../../../assets/microsoft.svg";
import GoogleIcon from "../../../assets/google.svg";
import CalIcon from "../../../assets/cal-com.svg";
import APIClient from "../../../util/ApiClient";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("request");
  const navigate = useNavigate();
  const muiTheme = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendMagicLink = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await APIClient.requestMagicLink(email);
      setStep("sent");
    } catch (err) {
      setError(err.message || "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      elevation={12}
      sx={{ p: 4, borderRadius: 5, width: "100%", textAlign: "center" }}
    >
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: alpha(muiTheme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <ShieldCheck size={32} color={muiTheme.palette.primary.main} />
        </Box>
        <Typography variant="h5" fontWeight={800}>
          Welcome Back
        </Typography>
        <Typography color="text.secondary">
          Securely sync your faith.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {step === "request" ? (
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={
                <img
                  src={GoogleIcon}
                  alt="Google"
                  style={{ width: 20, height: 20 }}
                />
              }
              fullWidth
              sx={{ borderRadius: 2 }}
              onClick={() => {
                window.location.href = APIClient.getGoogleLoginUrl();
              }}
            >
              Google
            </Button>
            <Button
              variant="outlined"
              startIcon={
                <img
                  src={MicrosoftIcon}
                  alt="Microsoft"
                  style={{ width: 20, height: 20 }}
                />
              }
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Microsoft
            </Button>
            <Button
              variant="outlined"
              startIcon={
                <img
                  src={AppleIcon}
                  alt="Apple"
                  style={{ width: 20, height: 20 }}
                />
              }
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Apple
            </Button>
            <Button
              variant="outlined"
              startIcon={
                <img
                  src={CalIcon}
                  alt="Cal.com"
                  style={{ width: 20, height: 20 }}
                />
              }
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Cal.com
            </Button>
          </Stack>

          <Divider>
            <Typography variant="caption" color="text.disabled">
              OR
            </Typography>
          </Divider>

          <Stack spacing={2}>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSendMagicLink}
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(muiTheme.palette.primary.main, 0.05),
              borderRadius: 3,
            }}
          >
            <MailQuestion size={24} color={muiTheme.palette.primary.main} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Check your email <b>{email}</b> for a sign-in link.
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => navigate("/")}
            sx={{ py: 1.5 }}
          >
            Continue
          </Button>
          <Button variant="text" size="small" onClick={() => setStep("request")}>
            Change Email
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default LoginPage;
