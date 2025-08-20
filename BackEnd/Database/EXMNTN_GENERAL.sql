-- Create the database
CREATE DATABASE examnation;

-- Connect to the database
\c examnation;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    options TEXT[], -- Array of options for multiple choice
    correct_answer VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create answers table
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    question_id INTEGER REFERENCES questions(id),
    answer_text VARCHAR(255) NOT NULL,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create roles table (optional, if you want role management)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('student'), ('parent'), ('educator'), ('admin');

INSERT INTO users (email, username, first_name, last_name, password_hash, role)
VALUES
    ('student@example.com', 'student1', 'John', 'Doe', 'hashed_password_1', 'student'),
    ('parent@example.com', 'parent1', 'Jane', 'Doe', 'hashed_password_2', 'parent'),
    ('educator@example.com', 'educator1', 'Jim', 'Beam', 'hashed_password_3', 'educator'),
    ('admin@example.com', 'admin1', 'Jack', 'Daniels', 'hashed_password_4', 'admin'),
    ('student1@example.com', 'student2', 'Alice', 'Smith', 'hashed_password_5', 'student'),
    ('student2@example.com', 'student3', 'Bob', 'Johnson', 'hashed_password_6', 'student'),
    ('parent1@example.com', 'parent2', 'Carol', 'Williams', 'hashed_password_7', 'parent'),
    ('educator1@example.com', 'educator2', 'David', 'Brown', 'hashed_password_8', 'educator'),
    ('admin1@example.com', 'admin2', 'Eve', 'Davis', 'hashed_password_9', 'admin');
