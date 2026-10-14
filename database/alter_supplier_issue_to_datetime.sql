USE se212_smartstock;

-- Preserve existing issue dates and store creation times for new supplier issues.
-- Existing DATE values are converted to DATETIME at 00:00:00.
ALTER TABLE supplier_issue
    MODIFY issue_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
