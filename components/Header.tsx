'use client';

import React from 'react';
import { Activity, User, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from './AuthContext';

interface HeaderProps {
  title: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export default function Header({ title, onProfileClick, onSettingsClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-10 lg:px-40 py-3 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-blue-500 flex items-center justify-center bg-blue-500/10 p-2 rounded-lg">
          <Activity className="size-6" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">
            PRP Performance
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{title}</p>
        </div>
      </div>
      <div className="flex flex-1 justify-end items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{user?.role === 'admin' ? 'Administrador' : 'Avaliador'}</span>
        </div>
        <button 
          onClick={onSettingsClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Configurações do Sistema"
        >
          <Settings className="size-5" />
        </button>
        <button 
          onClick={logout}
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Sair do Sistema"
        >
          <LogOut className="size-5" />
        </button>
        <div className="relative size-10 rounded-full border-2 border-blue-500/20 overflow-hidden cursor-pointer" onClick={onProfileClick}>
          <Image
            src={user?.role === 'admin' ? "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&h=400&fit=crop" : "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop"}
            alt="Foto de perfil"
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
