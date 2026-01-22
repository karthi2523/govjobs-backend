-- Create database if not exists
CREATE DATABASE IF NOT EXISTS govapp;
USE govapp;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id VARCHAR(36) PRIMARY KEY,
  category_id VARCHAR(36) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  post_name VARCHAR(255) NOT NULL,
  vacancies VARCHAR(100) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  last_date DATE NOT NULL,
  full_details_url TEXT,
  notification_url TEXT,
  apply_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create results table
CREATE TABLE IF NOT EXISTS results (
  id VARCHAR(36) PRIMARY KEY,
  exam_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  result_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admit_cards table
CREATE TABLE IF NOT EXISTS admit_cards (
  id VARCHAR(36) PRIMARY KEY,
  exam_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  exam_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create syllabus table
CREATE TABLE IF NOT EXISTS syllabus (
  id VARCHAR(36) PRIMARY KEY,
  exam_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create previous_papers table
CREATE TABLE IF NOT EXISTS previous_papers (
  id VARCHAR(36) PRIMARY KEY,
  exam_name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  paper_type VARCHAR(255) NOT NULL,
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id VARCHAR(36) PRIMARY KEY,
  organization VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

