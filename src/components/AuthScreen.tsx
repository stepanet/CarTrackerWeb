import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

type Mode = 'signin' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isSignIn = mode === 'signin';
  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignIn) {
        await signIn(email.trim(), password);
        // Успех — useAuth автоматически обновит состояние,
        // App.tsx перерисуется и покажет основное приложение
      } else {
        await signUp(email.trim(), password);
        setSuccessMessage(
          'Аккаунт создан. Проверьте почту и подтвердите email.',
        );
        // Если подтверждение email отключено — пользователь сразу войдёт
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(translateAuthError(message));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isSignIn ? 'signup' : 'signin');
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl">
            🚗
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CarTracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSignIn
              ? 'Войдите, чтобы синхронизировать данные'
              : 'Создайте аккаунт для синхронизации'}
          </p>
        </div>

        {/* Форма */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Пароль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete={isSignIn ? 'current-password' : 'new-password'}
              disabled={isLoading}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            {!isSignIn && password.length > 0 && password.length < 6 && (
              <p className="text-xs text-red-500 mt-1">
                Пароль должен быть не менее 6 символов
              </p>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Успех */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              {successMessage}
            </div>
          )}

          {/* Кнопка */}
          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              isValid && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading
              ? 'Подождите...'
              : isSignIn
                ? 'Войти'
                : 'Создать аккаунт'}
          </button>

          {/* Переключение режима */}
          <div className="text-center pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={switchMode}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {isSignIn
                ? 'Нет аккаунта? Создать'
                : 'Уже есть аккаунт? Войти'}
            </button>
          </div>
        </form>

        {/* Подсказка внизу */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Ваши данные защищены и видны только вам
        </p>
      </div>
    </div>
  );
}

// ─── Перевод ошибок Supabase ─────────────────

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Неверный email или пароль';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email не подтверждён. Проверьте почту.';
  }
  if (lower.includes('user already registered')) {
    return 'Пользователь с таким email уже зарегистрирован';
  }
  if (lower.includes('password should be at least')) {
    return 'Пароль слишком короткий (минимум 6 символов)';
  }
  if (lower.includes('unable to validate email')) {
    return 'Некорректный email';
  }
  if (lower.includes('email rate limit exceeded')) {
    return 'Слишком много попыток. Попробуйте позже.';
  }

  return message;
}