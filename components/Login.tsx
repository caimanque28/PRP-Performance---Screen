'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Loader2, Dumbbell, ChevronRight } from 'lucide-react';
import { useAuth } from './AuthContext';
import Image from 'next/image';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'evaluator'>('evaluator');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      if (mode === 'login') {
        const success = await login(trimmedEmail, password);
        if (!success) {
          setError('Credenciais inválidas. Tente admin@prp.com / admin123');
        }
      } else {
        await register(name, trimmedEmail, role, password);
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <Image 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80" 
          alt="Gym Background"
          fill
          className="object-cover grayscale"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-600/20">
            <Dumbbell className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">PRP Performance</h1>
          <p className="text-slate-400 mt-2">
            {mode === 'login' ? 'Acesse sua plataforma de avaliação' : 'Crie sua conta de avaliador'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8 border border-white/5">
            <button 
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Nome Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">Cargo</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                >
                  <option value="evaluator">Avaliador</option>
                  <option value="admin">Administrador</option>
                </select>
              </motion.div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-sm font-medium text-slate-300">Senha</label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-blue-500 hover:text-blue-400 font-medium">Esqueceu a senha?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar no Sistema' : 'Criar Conta'}
                  <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">
                PRP Performance System
              </p>
              <p className="mt-2 text-slate-400 text-sm">
                Entre com suas credenciais para acessar a plataforma.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
