-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT NOT NULL,
  dateApplied TEXT NOT NULL,
  lastUpdate TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Applied', 'Interview', 'Offer', 'Rejected')),
  source TEXT,
  salary TEXT,
  remotePolicy TEXT,
  notes TEXT,
  emailId TEXT,
  confidenceScore INTEGER DEFAULT 0,
  isDuplicate INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email connections table
CREATE TABLE IF NOT EXISTS email_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL DEFAULT 'default_user',
  email TEXT NOT NULL,
  accessToken TEXT NOT NULL,
  refreshToken TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  connected INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status history table
CREATE TABLE IF NOT EXISTS status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  applicationId TEXT NOT NULL,
  oldStatus TEXT,
  newStatus TEXT NOT NULL,
  changedAt TEXT NOT NULL,
  FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_dateApplied ON applications(dateApplied);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);
CREATE INDEX IF NOT EXISTS idx_status_history_applicationId ON status_history(applicationId);
CREATE INDEX IF NOT EXISTS idx_email_connections_userId ON email_connections(userId);
