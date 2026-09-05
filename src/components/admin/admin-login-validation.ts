export type AdminLoginValues = {
  email: string;
  password: string;
};

export type AdminLoginErrors = {
  email?: string;
  password?: string;
};

export function validateAdminLogin({
  email,
  password,
}: AdminLoginValues): AdminLoginErrors {
  const errors: AdminLoginErrors = {};
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    errors.email = "Enter your work email.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Use a valid work email.";
  }

  if (!password.trim()) {
    errors.password = "Enter your password.";
  }

  return errors;
}
