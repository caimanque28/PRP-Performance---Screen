'use client';

import React, { useState } from 'react';
import { User, Save, BarChart3 } from 'lucide-react';

interface EvaluationFormProps {
  onSubmit: (data: any) => void;
  isSaving?: boolean;
}

const FMS_ITEMS = [
  { id: 'deep_squat', label: 'Deep Squat', unilateral: false },
  { id: 'hurdle_step', label: 'Hurdle Step', unilateral: true },
  { id: 'inline_lunge', label: 'In-Line Lunge', unilateral: true },
  { id: 'shoulder_mobility', label: 'Shoulder Mobility', unilateral: true },
  { id: 'straight_leg_raise', label: 'Active Straight Leg Raise', unilateral: true },
  { id: 'trunk_stability', label: 'Trunk Stability Push-Up', unilateral: false },
  { id: 'rotary_stability', label: 'Rotary Stability', unilateral: true },
];

const PRP_ITEMS = [
  { id: 'deep_squat', label: 'Agachamento Profundo', unilateral: false, category: 'Screening' },
  { id: 'lunge', label: 'Afundo', unilateral: true, category: 'Screening' },
  { id: 'ankle_mobility', label: 'Mobilidade de Tornozelo', unilateral: true, category: 'Mobilidade' },
  { id: 'shoulder_mobility', label: 'Mobilidade de Ombro', unilateral: true, category: 'Mobilidade' },
  { id: 'straight_leg_raise', label: 'Elevação da Perna Reta', unilateral: true, category: 'Mobilidade' },
  { id: 'pelvic_bridge', label: 'Elevação da Pélvis', unilateral: false, category: 'Estabilidade' },
  { id: 'side_plank', label: 'Prancha Lateral', unilateral: true, category: 'Estabilidade' },
  { id: 'bird_dog', label: 'Estabilidade Rotacional (Bird Dog)', unilateral: true, category: 'Estabilidade' },
  { id: 'single_leg_squat', label: 'Agachamento Unilateral', unilateral: true, category: 'Força' },
  { id: 'lateral_slr', label: 'SLR Lateral', unilateral: true, category: 'Resistência' },
  { id: 'calf_raise', label: 'Elevação Unilateral de Panturrilha', unilateral: true, category: 'Resistência' },
];

export default function EvaluationForm({ onSubmit, isSaving = false }: EvaluationFormProps) {
  const [eva, setEva] = useState(0);
  const [evalType, setEvalType] = useState<'FMS' | 'PRP'>('FMS');
  
  const getInitialScores = (type: 'FMS' | 'PRP') => {
    const items = type === 'FMS' ? FMS_ITEMS : PRP_ITEMS;
    return items.reduce((acc, item) => ({ 
      ...acc, 
      [item.id]: item.unilateral ? { L: null, R: null } : null 
    }), {});
  };

  const getInitialObservations = (type: 'FMS' | 'PRP') => {
    const items = type === 'FMS' ? FMS_ITEMS : PRP_ITEMS;
    return items.reduce((acc, item) => ({ ...acc, [item.id]: '' }), {});
  };

  const [formData, setFormData] = useState<any>({
    name: '',
    birthDate: '',
    age: '',
    weight: '',
    height: '',
    bmi: '',
    bmiStatus: '',
    sport: '',
    level: 'Sedentário',
    volume: '',
    dominance: 'Destro',
    complaint: '',
    history: '',
    meds: '',
    scores: getInitialScores('FMS'),
    observations: getInitialObservations('FMS'),
  });

  const handleEvalTypeChange = (type: 'FMS' | 'PRP') => {
    setEvalType(type);
    setFormData((prev: any) => ({
      ...prev,
      scores: getInitialScores(type),
      observations: getInitialObservations(type),
    }));
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const calculateBMI = (weight: string, height: string) => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m
    if (!w || !h) return { bmi: '', status: '' };
    
    const bmi = w / (h * h);
    const bmiFixed = bmi.toFixed(1);
    
    let status = '';
    if (Number(bmi) < 18.5) status = 'Abaixo do peso';
    else if (Number(bmi) < 25) status = 'Peso normal';
    else if (Number(bmi) < 30) status = 'Sobrepeso';
    else status = 'Obesidade';
    
    return { bmi: bmiFixed, status };
  };

  const handleBirthDateChange = (date: string) => {
    const age = calculateAge(date);
    setFormData({ ...formData, birthDate: date, age });
  };

  const handleBodyMetricsChange = (field: 'weight' | 'height', value: string) => {
    const newWeight = field === 'weight' ? value : formData.weight;
    const newHeight = field === 'height' ? value : formData.height;
    const { bmi, status } = calculateBMI(newWeight, newHeight);
    setFormData({ ...formData, [field]: value, bmi, bmiStatus: status });
  };

  const handleScoreChange = (itemId: string, score: number, side?: 'L' | 'R') => {
    setFormData((prev: any) => {
      const items = evalType === 'FMS' ? FMS_ITEMS : PRP_ITEMS;
      const item = items.find(i => i.id === itemId);
      if (item?.unilateral && side) {
        return {
          ...prev,
          scores: { 
            ...prev.scores, 
            [itemId]: { ...prev.scores[itemId], [side]: score } 
          }
        };
      }
      return {
        ...prev,
        scores: { ...prev.scores, [itemId]: score }
      };
    });
  };

  const handleObservationChange = (itemId: string, obs: string) => {
    setFormData((prev: any) => ({
      ...prev,
      observations: { ...prev.observations, [itemId]: obs }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const patientId = Math.floor(Math.random() * 90000) + 10000;
    const evaluationDate = new Date().toLocaleDateString('pt-BR');
    onSubmit({ ...formData, eva, patientId, evaluationDate, evalType });
  };

  const currentItems = evalType === 'FMS' ? FMS_ITEMS : PRP_ITEMS;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 py-12 px-6">
      <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="text-blue-500 size-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Protocolo de Avaliação</h3>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => handleEvalTypeChange('FMS')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                evalType === 'FMS' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              FMS (Functional)
            </button>
            <button
              type="button"
              onClick={() => handleEvalTypeChange('PRP')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                evalType === 'PRP' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              PRP Performance
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</span>
            <input 
              className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
              placeholder="Ex: João Silva" 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Data de Nasc.</span>
              <input 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Idade</span>
              <input 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 h-11 px-3 cursor-not-allowed" 
                type="text"
                value={formData.age}
                readOnly
                placeholder="Auto"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Peso (kg)</span>
              <input 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
                placeholder="Ex: 75.5" 
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleBodyMetricsChange('weight', e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Altura (cm)</span>
              <input 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
                placeholder="Ex: 175" 
                type="number"
                value={formData.height}
                onChange={(e) => handleBodyMetricsChange('height', e.target.value)}
              />
            </label>
          </div>

          <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">IMC</span>
              <div className="flex items-center gap-3">
                <div className="h-11 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-900 dark:text-white min-w-[80px]">
                  {formData.bmi || '--'}
                </div>
                {formData.bmiStatus && (
                  <div className={`h-11 px-4 rounded-lg flex items-center justify-center text-xs font-bold uppercase tracking-wider ${
                    formData.bmiStatus === 'Peso normal' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                    formData.bmiStatus === 'Abaixo do peso' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    formData.bmiStatus === 'Sobrepeso' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                    'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {formData.bmiStatus}
                  </div>
                )}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Esporte</span>
              <input 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
                placeholder="Ex: CrossFit / Futebol" 
                type="text"
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nível</span>
              <select 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option>Sedentário</option>
                <option>Recreacional</option>
                <option>Amador Competitivo</option>
                <option>Profissional</option>
              </select>
            </label>
          </div>
          
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Volume (h/semana)</span>
            <input 
              className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
              placeholder="Ex: 5h" 
              type="text"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dominância</span>
            <div className="flex gap-4 h-11 items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  className="text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" 
                  name="dominance" 
                  type="radio" 
                  checked={formData.dominance === 'Destro'}
                  onChange={() => setFormData({ ...formData, dominance: 'Destro' })}
                />
                <span className="ml-2 text-slate-700 dark:text-slate-300">Destro</span>
              </label>
              <label className="inline-flex items-center cursor-pointer">
                <input 
                  className="text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700" 
                  name="dominance" 
                  type="radio"
                  checked={formData.dominance === 'Canhoto'}
                  onChange={() => setFormData({ ...formData, dominance: 'Canhoto' })}
                />
                <span className="ml-2 text-slate-700 dark:text-slate-300">Canhoto</span>
              </label>
            </div>
          </label>

          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Queixa Principal</span>
              <textarea 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-24 p-3" 
                placeholder="Descreva o motivo da consulta..."
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
              ></textarea>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">História Pregressa</span>
              <textarea 
                className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-24 p-3" 
                placeholder="Lesões anteriores, cirurgias..."
                value={formData.history}
                onChange={(e) => setFormData({ ...formData, history: e.target.value })}
              ></textarea>
            </label>
          </div>

          <div className="col-span-full md:col-span-2 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Escala Visual Analógica de Dor (EVA)</span>
              <span className="text-blue-500 font-bold text-lg">{eva}</span>
            </div>
            <input 
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
              max="10" 
              min="0" 
              step="1" 
              type="range" 
              value={eva}
              onChange={(e) => setEva(parseInt(e.target.value))}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Sem Dor (0)</span>
              <span>Dor Moderada (5)</span>
              <span>Pior Dor (10)</span>
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Medicamentos em Uso</span>
            <input 
              className="rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-blue-500 h-11 px-3" 
              placeholder="Ex: Analgésicos" 
              type="text"
              value={formData.meds}
              onChange={(e) => setFormData({ ...formData, meds: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FitnessCenter className="text-blue-500 size-5" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {evalType === 'FMS' ? 'Functional Movement Screen (FMS)' : 'PRP Performance Battery'}
            </h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">Item de Avaliação</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 text-center">Score (0 a 3)</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-200">
                    {item.label}
                    {item.unilateral && <span className="block text-[10px] text-slate-400 uppercase mt-1">Unilateral (E/D)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-3 items-center">
                      {item.unilateral ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 w-4">E</span>
                            <div className="flex gap-2">
                              {[0, 1, 2, 3].map((val) => (
                                <label key={`L-${val}`} className="cursor-pointer">
                                  <input 
                                    className={`size-4 focus:ring-offset-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 ${
                                      val === 0 ? 'text-red-500 focus:ring-red-500' :
                                      val === 1 ? 'text-orange-500 focus:ring-orange-500' :
                                      val === 2 ? 'text-yellow-500 focus:ring-yellow-500' :
                                      'text-green-500 focus:ring-green-500'
                                    }`} 
                                    name={`score_${item.id}_L`} 
                                    type="radio" 
                                    value={val}
                                    checked={formData.scores[item.id]?.L === val}
                                    onChange={() => handleScoreChange(item.id, val, 'L')}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 w-4">D</span>
                            <div className="flex gap-2">
                              {[0, 1, 2, 3].map((val) => (
                                <label key={`R-${val}`} className="cursor-pointer">
                                  <input 
                                    className={`size-4 focus:ring-offset-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 ${
                                      val === 0 ? 'text-red-500 focus:ring-red-500' :
                                      val === 1 ? 'text-orange-500 focus:ring-orange-500' :
                                      val === 2 ? 'text-yellow-500 focus:ring-yellow-500' :
                                      'text-green-500 focus:ring-green-500'
                                    }`} 
                                    name={`score_${item.id}_R`} 
                                    type="radio" 
                                    value={val}
                                    checked={formData.scores[item.id]?.R === val}
                                    onChange={() => handleScoreChange(item.id, val, 'R')}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          {[0, 1, 2, 3].map((val) => (
                            <label key={val} className="cursor-pointer">
                              <input 
                                className={`size-4 focus:ring-offset-0 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 ${
                                  val === 0 ? 'text-red-500 focus:ring-red-500' :
                                  val === 1 ? 'text-orange-500 focus:ring-orange-500' :
                                  val === 2 ? 'text-yellow-500 focus:ring-yellow-500' :
                                  'text-green-500 focus:ring-green-500'
                                }`} 
                                name={`score_${item.id}`} 
                                type="radio" 
                                value={val}
                                checked={formData.scores[item.id] === val}
                                onChange={() => handleScoreChange(item.id, val)}
                              />
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      className="w-full text-xs bg-transparent border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:border-blue-500 outline-none py-1" 
                      placeholder="Nota adicional..." 
                      type="text"
                      value={formData.observations[item.id]}
                      onChange={(e) => handleObservationChange(item.id, e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 flex flex-wrap gap-4">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500"></span> 0: Dor durante o teste</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-orange-500"></span> 1: Incapaz de realizar</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-yellow-500"></span> 2: Realiza com compensação</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500"></span> 3: Realiza perfeitamente</span>
        </div>
      </section>

      <footer className="flex items-center justify-end gap-4 pt-4">
        <button 
          type="button"
          className="flex items-center gap-2 min-w-[120px] cursor-pointer justify-center rounded-lg h-12 px-6 border border-blue-500 text-blue-500 font-bold hover:bg-blue-500/5 transition-all"
        >
          <BarChart3 className="size-5" />
          <span>Gerar Gráficos</span>
        </button>
        <button 
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 min-w-[160px] cursor-pointer justify-center rounded-lg h-12 px-8 bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="size-5" />
          )}
          <span>{isSaving ? 'Salvando...' : 'Salvar Avaliação'}</span>
        </button>
      </footer>
    </form>
  );
}

function FitnessCenter(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 7h12" />
      <path d="M6 17h12" />
      <path d="M4 5v14" />
      <path d="M20 5v14" />
      <path d="M2 9v6" />
      <path d="M22 9v6" />
      <path d="M8 7v10" />
      <path d="M16 7v10" />
    </svg>
  );
}
