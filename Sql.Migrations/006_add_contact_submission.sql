CREATE TABLE IF NOT EXISTS ContactSubmission (
    ContactSubmissionId BIGSERIAL PRIMARY KEY,
    NormalizedEmail VARCHAR(255) NOT NULL,
    SubmittedAt TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contactsubmission_email_submittedat
    ON ContactSubmission (NormalizedEmail, SubmittedAt DESC);
