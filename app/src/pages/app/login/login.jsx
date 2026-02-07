import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Divider,
  alpha,
  useTheme,
} from "@mui/material";
import { ShieldCheck, MailQuestion } from "lucide-react";
import AppleIcon from "../../../assets/apple.svg";
import MicrosoftIcon from "../../../assets/microsoft.svg";
import GoogleIcon from "../../../assets/google.svg";
import CalIcon from "../../../assets/cal-com.svg";

const LoginPage = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState("info");
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const muiTheme = useTheme();

  const handleSendCode = () => {
    if (email && name) setStep("code");
  };

  const handleVerify = () => {
    if (code === "123456") {
      setUser({
        name,
        email,
        isLoggedIn: true,
        addresses: ["Main St"],
        timezone: "UTC+0",
        language: "English",
      });
      navigate("/calendar");
    } else {
      alert("Wrong code! Try 123456");
    }
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        py: 10,
        display: "flex",
        alignItems: "center",
        minHeight: "calc(100vh - 160px)",
      }}
    >
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
                sx={{ py: 1.5 }}
              >
                Send Verification Code
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
              sx={{ py: 1.5 }}
            >
              Verify & Continue
            </Button>
            <Button variant="text" size="small" onClick={() => setStep("info")}>
              Change Email
            </Button>
          </Stack>
        )}
      </Paper>
    </Container>
  );
};

export default LoginPage;
