-- Migration: add password and last_login to users
ALTER TABLE users
  ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '' AFTER email,
  ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER password;
