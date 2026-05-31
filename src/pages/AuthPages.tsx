import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ChefHat, Truck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await signIn(email, password);

    if (error) {
      setError('Email ou senha incorretos');
      setLoading(false);
    } else {
      setTimeout(() => {
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else if (profile?.role === 'restaurant_owner') {
          navigate('/restaurant-dashboard');
        } else if (profile?.role === 'delivery_partner') {
          navigate('/delivery-dashboard');
        } else {
          navigate('/');
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">iF</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Bem-vindo de volta!</h1>
          <p className="text-gray-600 mt-2">Entre para pedir seus pratos favoritos</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <div className="relative">
              <Input
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} fullWidth>
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-red-500 hover:text-red-600 font-semibold">
                Cadastre-se
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant_owner' | 'delivery_partner'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    const { error } = await signUp(email, password, name, role);

    if (error) {
      setError(error.message || 'Erro ao criar conta');
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">iF</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Criar Conta</h1>
          <p className="text-gray-600 mt-2">Junte-se a nós</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 1 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <div className={`h-1 w-12 ${step >= 2 ? 'bg-red-500' : 'bg-gray-200'}`} />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= 2 ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Eu sou...
                  </label>

                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`w-full p-4 rounded-xl border-2 flex items-center space-x-3 transition-all ${
                      role === 'customer'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Cliente</p>
                      <p className="text-sm text-gray-500">Quero pedir comida</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('restaurant_owner')}
                    className={`w-full p-4 rounded-xl border-2 flex items-center space-x-3 transition-all ${
                      role === 'restaurant_owner'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <ChefHat className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Dono de Restaurante</p>
                      <p className="text-sm text-gray-500">Quero vender meus pratos</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('delivery_partner')}
                    className={`w-full p-4 rounded-xl border-2 flex items-center space-x-3 transition-all ${
                      role === 'delivery_partner'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Entregador</p>
                      <p className="text-sm text-gray-500">Quero fazer entregas</p>
                    </div>
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Input
                  label="Nome completo"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  icon={<User className="w-5 h-5" />}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  icon={<Mail className="w-5 h-5" />}
                  required
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    icon={<Lock className="w-5 h-5" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Input
                  label="Confirmar senha"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  icon={<ShieldCheck className="w-5 h-5" />}
                  required
                />
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              {step === 2 && (
                <Button type="button" variant="secondary" onClick={() => setStep(1)} fullWidth>
                  Voltar
                </Button>
              )}
              <Button type="submit" loading={loading} fullWidth>
                {step === 1 ? 'Continuar' : 'Criar Conta'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-red-500 hover:text-red-600 font-semibold">
                Entrar
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
