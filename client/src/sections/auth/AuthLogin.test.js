'use client';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthLogin from './AuthLogin';
import { useAuth } from '@/hooks/useAuth';

// Mock useAuth hook
const mockLogin = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false
  })
}));

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('AuthLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<AuthLogin />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows validation errors when fields are empty and submit is clicked', async () => {
    render(<AuthLogin />);
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getAllByText(/required|bắt buộc|không được để trống/i).length).toBeGreaterThan(0);
    });
  });

  it('calls login and redirects on successful login', async () => {
    mockLogin.mockResolvedValueOnce({
      success: true,
      data: { redirectUrl: '/dashboard' }
    });

    render(<AuthLogin />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error alert when login fails', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      message: 'Sai thông tin đăng nhập'
    });

    render(<AuthLogin />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/sai thông tin đăng nhập/i)).toBeInTheDocument();
    });
  });
});
