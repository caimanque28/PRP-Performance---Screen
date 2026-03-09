'use client';

import React from 'react';
import { X, Moon, Sun, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

export default function SettingsModal({ isOpen, onClose, theme, onThemeChange }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Configurações do Sistema</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            <div className="space-y-4">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500">Tema do Sistema</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => onThemeChange('light')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Sun className="size-6" />
                  </div>
                  <span className={`font-bold text-sm ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Claro</span>
                </button>

                <button 
                  onClick={() => onThemeChange('dark')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Moon className="size-6" />
                  </div>
                  <span className={`font-bold text-sm ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>Escuro</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                PRP Performance - Screen v1.0.0<br/>
                Desenvolvido para Performance de Elite.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Concluído
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
