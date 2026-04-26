import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Mail } from "lucide-react";
import InfoPageLayout from "../common/InfoPageLayout";
import APIClient from "../../../util/ApiClient";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await APIClient.submitContactForm(form);
      setSuccess(response?.message || "Your message has been sent.");
      setForm(initialForm);
    } catch (submitError) {
      if (submitError?.status === 429) {
        setError("Daily limit reached for this email. Please try again tomorrow.");
      } else {
        setError(submitError?.message || "Unable to send your message. Please try again later.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InfoPageLayout
      chipLabel="Connect"
      chipIcon={<Mail size={14} />}
      title="Contact Us"
      subtitle="Need help, have feedback, or want to report an issue? Send us a message and we will get back to you."
      footerNote="To reduce spam and abuse, submissions are limited to one per day per email."
    >
      <Typography variant="body2" color="text.secondary">
        Required fields: name, email, and message. Subject is optional.
      </Typography>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <TextField
          required
          label="Name"
          value={form.name}
          onChange={handleFieldChange("name")}
          inputProps={{ maxLength: 120 }}
        />
        <TextField
          required
          type="email"
          label="Email"
          value={form.email}
          onChange={handleFieldChange("email")}
          inputProps={{ maxLength: 255 }}
        />
        <TextField
          label="Subject (optional)"
          value={form.subject}
          onChange={handleFieldChange("subject")}
          inputProps={{ maxLength: 200 }}
        />
        <TextField
          required
          multiline
          minRows={5}
          label="Message"
          value={form.message}
          onChange={handleFieldChange("message")}
          inputProps={{ maxLength: 5000 }}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Send Message"}
        </Button>
      </Stack>
    </InfoPageLayout>
  );
}
