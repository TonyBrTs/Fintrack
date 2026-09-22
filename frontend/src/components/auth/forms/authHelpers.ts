export interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function getFriendlyAuthError(
  msg?: string,
  isEs = true,
  isLogin = false
): { message: string; field?: keyof FormErrors } {
  if (!msg) {
    return {
      message: isEs
        ? "Ocurrió un inconveniente. Por favor, intenta de nuevo."
        : "An error occurred. Please try again.",
    };
  }
  const lower = msg.toLowerCase();
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid username or password")
  ) {
    return {
      message: isEs
        ? "Correo electrónico o contraseña incorrectos."
        : "Invalid email or password.",
      field: "password",
    };
  }
  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user_already_exists") ||
    lower.includes("already in use")
  ) {
    return {
      message: isEs
        ? "Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o recupera tu contraseña."
        : "An account already exists with this email. Please sign in or reset your password.",
      field: "email",
    };
  }
  if (lower.includes("email not confirmed")) {
    return {
      message: isEs
        ? "Por favor confirma tu correo electrónico antes de ingresar."
        : "Please confirm your email address before signing in.",
      field: "email",
    };
  }
  if (
    lower.includes("password should be at least") ||
    lower.includes("password is too short")
  ) {
    if (isLogin) {
      return {
        message: isEs
          ? "Correo electrónico o contraseña incorrectos."
          : "Invalid email or password.",
        field: "password",
      };
    }
    return {
      message: isEs
        ? "La contraseña debe tener al menos 6 caracteres."
        : "Password must be at least 6 characters.",
      field: "password",
    };
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return {
      message: isEs
        ? "Demasiados intentos seguidos. Por favor espera unos momentos antes de reintentar."
        : "Too many requests. Please wait a moment before trying again.",
    };
  }
  return { message: msg };
}

export function calculatePasswordStrength(password: string, isEs = true) {
  if (!password) {
    return {
      score: 0,
      label: "",
      color: "bg-slate-700",
      textColor: "text-slate-500",
      barColor: "bg-slate-700",
    };
  }
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return {
      score: 1,
      label: isEs ? "Débil" : "Weak",
      color: "bg-rose-500",
      textColor: "text-rose-400",
      barColor: "bg-rose-500",
    };
  }
  if (score <= 3) {
    return {
      score: 2,
      label: isEs ? "Aceptable" : "Fair",
      color: "bg-amber-500",
      textColor: "text-amber-400",
      barColor: "bg-amber-500",
    };
  }
  return {
    score: 3,
    label: isEs ? "Segura" : "Strong",
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    barColor: "bg-emerald-400",
  };
}
