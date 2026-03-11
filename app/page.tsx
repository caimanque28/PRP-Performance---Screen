'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import EvaluationForm from '@/components/EvaluationForm';
import EvaluationDashboard from '@/components/EvaluationDashboard';
import EvaluationList from '@/components/EvaluationList';
import SettingsModal from '@/components/SettingsModal';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthContext';
import Login from '@/components/Login';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [view, setView] = useState<'form' | 'dashboard' | 'summary'>('summary');
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSaving, setIsSaving] = useState(false);

  // Sync theme class with state
  useEffect(() => {
    // We do this in an effect to ensure it only runs on the client
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme && savedTheme !== theme) {
      setTheme(savedTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFormSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      // If Supabase is configured, save to database
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && user) {
        const { error } = await supabase.from('evaluations').insert([
          {
            evaluator_id: user.id,
            patient_name: data.name,
            patient_birth_date: data.birthDate || null,
            patient_age: parseInt(data.age) || null,
            patient_weight: parseFloat(data.weight) || null,
            patient_height: parseFloat(data.height) || null,
            patient_bmi: parseFloat(data.bmi) || null,
            patient_bmi_status: data.bmiStatus,
            patient_sport: data.sport,
            patient_level: data.level,
            patient_volume: data.volume,
            patient_dominance: data.dominance,
            patient_complaint: data.complaint,
            patient_history: data.history,
            patient_meds: data.meds,
            eva_score: data.eva,
            eval_type: data.evalType,
            scores: data.scores,
            observations: data.observations,
          },
        ]);

        if (error) {
          console.error('Error saving to Supabase:', error);
          // Fallback to local storage if DB fails
          const localEvals = JSON.parse(localStorage.getItem('prp_evaluations') || '[]');
          localEvals.push({ ...data, id: Date.now() });
          localStorage.setItem('prp_evaluations', JSON.stringify(localEvals));
        }
      } else {
        // Fallback for demo
        const localEvals = JSON.parse(localStorage.getItem('prp_evaluations') || '[]');
        localEvals.push({ ...data, id: Date.now() });
        localStorage.setItem('prp_evaluations', JSON.stringify(localEvals));
      }

      setEvaluationData(data);
      setView('dashboard');
    } catch (err) {
      console.error('Unexpected error saving evaluation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectEvaluation = (ev: any) => {
    // Map database fields back to form data structure for the dashboard
    const mappedData = {
      name: ev.patient_name,
      birthDate: ev.patient_birth_date,
      age: ev.patient_age,
      weight: ev.patient_weight,
      height: ev.patient_height,
      bmi: ev.patient_bmi,
      bmiStatus: ev.patient_bmi_status,
      sport: ev.patient_sport,
      level: ev.patient_level,
      volume: ev.patient_volume,
      dominance: ev.patient_dominance,
      complaint: ev.patient_complaint,
      history: ev.patient_history,
      meds: ev.patient_meds,
      eva: ev.eva_score,
      evalType: ev.eval_type,
      scores: ev.scores,
      observations: ev.observations,
      patientId: ev.id.substring(0, 8),
      evaluationDate: new Date(ev.created_at).toLocaleDateString('pt-BR'),
    };
    setEvaluationData(mappedData);
    setView('dashboard');
  };

  const handleBackToSummary = () => {
    setView('summary');
  };

  const handleNewEvaluation = () => {
    setView('form');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="fixed inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0">
        <Image 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80" 
          alt="Background Texture"
          fill
          className="object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="relative z-10">
        <Header 
        title={view === 'form' ? 'Nova Avaliação' : view === 'summary' ? 'Histórico de Atletas' : 'Dashboard de Performance'} 
        onProfileClick={() => setView('summary')}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      
      <AnimatePresence mode="wait">
        {view === 'form' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-[300px] w-full overflow-hidden border-t-4 border-blue-600"
          >
            <div className="absolute inset-0 bg-slate-900/40 z-10"></div>
            <Image 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80" 
              alt="Gym Background"
              fill
              className="object-cover"
              priority
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white text-4xl md:text-5xl font-black uppercase tracking-tighter drop-shadow-lg"
              >
                PRP Performance
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/90 text-lg font-medium mt-2 max-w-2xl drop-shadow-md"
              >
                Excelência em Avaliação e Performance Esportiva
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto">
        <AnimatePresence mode="wait">
          {view === 'summary' ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EvaluationList 
                onSelect={handleSelectEvaluation} 
                onNew={handleNewEvaluation} 
              />
            </motion.div>
          ) : view === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <EvaluationForm onSubmit={handleFormSubmit} isSaving={isSaving} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <EvaluationDashboard 
                data={evaluationData} 
                onBack={handleBackToSummary} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        theme={theme}
        onThemeChange={handleThemeChange}
      />
      </div>
    </main>
  );
}
