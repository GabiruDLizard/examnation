import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SetUp from '../../AccountSetUp/SetUp.js';

// Mock questions
jest.mock('../../AccountSetUp/SetupQuestions.js', () => [
  {
    id: 1,
    key: 'role',
    text: 'What is your role?',
    type: 'select',
    options: ['Student', 'Parent', 'Educator'],
    roles: ['student', 'parent', 'educator'],
    required: true,
  },
  {
    id: 2,
    key: 'name',
    text: 'What is your name?',
    type: 'text',
    roles: ['student', 'parent', 'educator'],
    required: true,
  },
]);

describe('SetUp Component', () => {
  test('renders welcome article and first question', () => {
    render(
      <MemoryRouter>
        <SetUp />
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome to Examnation!/i)).toBeInTheDocument();
    expect(screen.getByText(/What is your role?/i)).toBeInTheDocument();
  });

  test('shows select options as buttons for role', () => {
    render(
      <MemoryRouter>
        <SetUp />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Student/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Parent/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Educator/i })).toBeInTheDocument();
  });

  test('cycles to next question after selecting role and clicking Next', () => {
    render(
      <MemoryRouter>
        <SetUp />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Student/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText(/What is your name?/i)).toBeInTheDocument();
  });

  test('shows Back button on second question', () => {
    render(
      <MemoryRouter>
        <SetUp />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Student/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByRole('button', { name: /← Back/i })).toBeInTheDocument();
  });

  test('handles text input for name', () => {
    render(
      <MemoryRouter>
        <SetUp />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Student/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    // The label and input are not associated via htmlFor/id; use getByRole instead.
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Alice' } });
    expect(nameInput.value).toBe('Alice');
  });
});