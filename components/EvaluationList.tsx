'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, User, Calendar, BarChart3, ChevronRight, 
  Filter, ArrowUpDown, Loader2, AlertCircle, Trash2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface EvaluationListProps {
  onSelect: (evaluation: any) => void;
  onNew: () => void;
}

export default function EvaluationList({ onSelect, onNew }: EvaluationListProps) {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'FMS' | 'PRP'>('ALL');

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEvaluations(data || []);
    } catch (err: any) {
      console.error('Error fetching evaluations:', err);
      setError('Não foi possível carregar as avaliações. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta avaliação?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setEvaluations(evaluations.filter(ev => ev.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir avaliação: ' + err.message);
    }
  };

  const filteredEvaluations = evaluations.filter(ev => {
    const matchesSearch = ev.patient_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || ev.eval_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="size-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Histórico de Avaliações</h2>
          <p className="text-slate-500 mt-1">Gerencie e visualize o desempenho de todos os atletas avaliados.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <BarChart3 className="size-5" />
          Nova Avaliação
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar atleta pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm font-bold"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="FMS">FMS</option>
              <option value="PRP">PRP Performance</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-10 text-center">
            <AlertCircle className="size-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-bold">{error}</p>
            <button onClick={fetchEvaluations} className="mt-4 text-blue-600 hover:underline font-bold">Tentar novamente</button>
          </div>
        )}

        {!error && filteredEvaluations.length === 0 ? (
          <div className="p-20 text-center">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="size-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nenhuma avaliação encontrada</h3>
            <p className="text-slate-500 mt-2">Comece realizando sua primeira avaliação funcional.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Atleta</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEvaluations.map((ev) => {
                  // Calculate total score for display
                  let total = 0;
                  const scores = ev.scores || {};
                  Object.values(scores).forEach((s: any) => {
                    if (typeof s === 'number') total += s;
                    else if (s && typeof s === 'object') {
                      total += Math.min(Number(s.L || 0), Number(s.R || 0));
                    }
                  });

                  return (
                    <motion.tr 
                      key={ev.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => onSelect(ev)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            {ev.patient_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{ev.patient_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-medium">{ev.patient_sport || 'Sem esporte'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          ev.eval_type === 'FMS' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {ev.eval_type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="size-4" />
                          {new Date(ev.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{ev.total_score ?? total}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Pts</span>
                          </div>
                          {ev.risk_status && (
                            <span className={`text-[10px] font-bold ${ev.risk_status === 'Risco Baixo' ? 'text-green-600' : 'text-red-600'}`}>
                              {ev.risk_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => handleDelete(ev.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="size-5" />
                          </button>
                          <ChevronRight className="size-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
