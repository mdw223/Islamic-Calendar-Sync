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
import { useUser } from "../../../contexts/UserContext";
import APIClient from "../../../util/ApiClient";
import { setToken } from "../../../util/AuthToken";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState("info");
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { login } = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async () => {
    // TODO: finish when I add email verification
    if (!email || !name) {
      setError("Please enter both email and name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await APIClient.sendVerificationCode(email, name);
      setStep("code");
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    // TODO: finish when I add email verification
    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const data = await APIClient.verifyCode(email, code);
      if (data?.token) setToken(data.token);
      if (data?.success && data?.user) login(data.user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Invalid verification code");
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

      {step === "info" ? (
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
              label="Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
            />
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
              onClick={handleSendCode}
              disabled={isLoading}
              sx={{ py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} />
              ) : (
                "Send Verification Code"
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
              Check your email <b>{email}</b> for a 6-digit code.
            </Typography>
          </Box>
          <TextField
            placeholder="000000"
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputProps={{
              sx: {
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: 8,
                fontWeight: 700,
              },
            }}
          />
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleVerify}
            disabled={isLoading}
            sx={{ py: 1.5 }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Verify & Continue"}
          </Button>
          <Button variant="text" size="small" onClick={() => setStep("info")}>
            Change Email
          </Button>
        </Stack>
      )}
    </Paper>
  );
};

export default LoginPage;
