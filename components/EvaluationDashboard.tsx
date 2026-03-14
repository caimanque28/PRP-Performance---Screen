'use client';

import React, { useRef } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { 
  Download, ListTodo, CheckCircle2, Calendar, Fingerprint, Network, BarChart2, Info, FileText, Loader2
} from 'lucide-react';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FMS_ITEMS, PRP_ITEMS } from '@/lib/constants';

interface EvaluationDashboardProps {
  data: any;
  onBack?: () => void;
}

export default function EvaluationDashboard({ data, onBack }: EvaluationDashboardProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    
    setIsGeneratingPDF(true);
    try {
      const element = dashboardRef.current;
      
      // We want to capture the whole dashboard, but maybe hide some UI elements like buttons during capture
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // Match slate-50 background
        onclone: (clonedDoc) => {
          // Hide buttons in the cloned document
          const buttonsToHide = clonedDoc.querySelectorAll('button');
          buttonsToHide.forEach(btn => (btn as HTMLElement).style.display = 'none');
          
          // Ensure the cloned container is visible and has enough width
          const container = clonedDoc.querySelector('.dashboard-container') as HTMLElement;
          if (container) {
            container.style.width = '1200px';
            container.style.padding = '40px';
            container.style.backgroundColor = '#f8fafc';
            container.style.color = '#0f172a';
          }

          // Force light mode for the cloned document
          clonedDoc.documentElement.classList.remove('dark');
          clonedDoc.body.classList.remove('dark');
          clonedDoc.body.style.backgroundColor = '#f8fafc';
          clonedDoc.body.style.color = '#0f172a';

          // Fix oklch colors which html2canvas doesn't support
          // We'll iterate through all elements and replace oklch with hex fallbacks
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            const element = el as HTMLElement;
            
            // Check computed styles for oklch
            const style = window.getComputedStyle(element);
            
            const props = [
              'color', 'background-color', 'border-color', 
              'border-top-color', 'border-bottom-color', 
              'border-left-color', 'border-right-color',
              'fill', 'stroke'
            ];

            props.forEach(prop => {
              const value = style.getPropertyValue(prop);
              if (value && (value.includes('oklch') || value.includes('var('))) {
                // Replace with safe fallbacks for common Tailwind colors
                if (prop.includes('background')) {
                  if (element.classList.contains('bg-blue-600')) element.style.backgroundColor = '#2563eb';
                  else if (element.classList.contains('bg-slate-900')) element.style.backgroundColor = '#0f172a';
                  else if (element.classList.contains('bg-white')) element.style.backgroundColor = '#ffffff';
                  else element.style.setProperty(prop, '#ffffff', 'important');
                } else if (prop.includes('border')) {
                  element.style.setProperty(prop, '#e2e8f0', 'important');
                } else if (prop === 'fill' || prop === 'stroke') {
                  element.style.setProperty(prop, '#3b82f6', 'important');
                } else if (prop === 'color') {
                  if (element.classList.contains('text-blue-600')) element.style.color = '#2563eb';
                  else if (element.classList.contains('text-slate-900')) element.style.color = '#0f172a';
                  else element.style.setProperty(prop, '#1e293b', 'important');
                }
              }
            });

            // Also check for inline styles that might contain oklch
            const inlineStyle = element.getAttribute('style') || '';
            if (inlineStyle.includes('oklch')) {
              const sanitizedStyle = inlineStyle.replace(/oklch\([^)]+\)/g, '#3b82f6');
              element.setAttribute('style', sanitizedStyle);
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // If the content is too long, we might need multiple pages, but for now let's scale to fit one page or split
      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        // Simple multi-page support
        let heightLeft = pdfHeight;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Relatorio_Avaliacao_${data?.name || 'Atleta'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Ocorreu um erro ao gerar o relatório em PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const evalType = data?.evalType || 'FMS';
  const currentItems = evalType === 'FMS' ? FMS_ITEMS : PRP_ITEMS;
  const maxScore = currentItems.length * 3;

  const scores = data?.scores || {};
  let totalScore = 0;
  let hasAsymmetry = false;
  const detailedScores: any[] = [];

  currentItems.forEach(item => {
    let itemScore = 0;
    let displayScore = '';
    
    if (item.unilateral) {
      const l = Number(scores[item.id]?.L ?? 0);
      const r = Number(scores[item.id]?.R ?? 0);
      itemScore = Math.min(l, r);
      displayScore = `${l}E / ${r}D (Final: ${itemScore})`;
      if (l !== r) hasAsymmetry = true;
    } else {
      itemScore = Number(scores[item.id] ?? 0);
      displayScore = itemScore.toString();
    }
    
    totalScore += itemScore;
    
    const rel = ((itemScore / 3) * 100).toFixed(1);
    let status = 'Crítico';
    let statusColor = 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    
    if (itemScore === 3) {
      status = 'Excelente';
      statusColor = 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    } else if (itemScore === 2) {
      status = 'Regular';
      statusColor = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    }

    detailedScores.push({
      item: item.label,
      score: displayScore,
      max: 3,
      rel: `${rel}%`,
      status,
      statusColor
    });
  });

  const percentage = (totalScore / maxScore) * 100;
  const totalPercentage = percentage.toFixed(1);

  // Categories for the bar chart
  const categories: any[] = [];
  const categoryMap: any = {};

  currentItems.forEach(item => {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { sum: 0, count: 0 };
    }
    let val = 0;
    if (item.unilateral) {
      val = Math.min(Number(scores[item.id]?.L ?? 0), Number(scores[item.id]?.R ?? 0));
    } else {
      val = Number(scores[item.id] ?? 0);
    }
    categoryMap[item.category].sum += val;
    categoryMap[item.category].count += 1;
  });

  Object.keys(categoryMap).forEach(catName => {
    const { sum, count } = categoryMap[catName];
    categories.push({
      name: catName,
      value: Math.round((sum / (count * 3)) * 100),
      color: '#3b82f6'
    });
  });

  const radarData = currentItems.map(item => {
    let val = 0;
    if (item.unilateral) {
      val = Math.min(Number(scores[item.id]?.L ?? 0), Number(scores[item.id]?.R ?? 0));
    } else {
      val = Number(scores[item.id] ?? 0);
    }
    return { subject: item.label, A: (val / 3) * 100, fullMark: 100 };
  });

  // Use provided ID and Date or stable fallbacks
  const patientId = data?.patientId || '00000';
  const evaluationDate = data?.evaluationDate || '01/01/2024';

  return (
    <div ref={dashboardRef} className="flex flex-1 flex-col lg:flex-row p-4 lg:p-6 gap-6 max-w-[1600px] mx-auto w-full dashboard-container">
      {/* Left Sidebar: Filters */}
      <aside className="w-full lg:w-72 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Network className="text-blue-500 size-5" />
            <h3 className="font-bold text-slate-900 dark:text-white">Filtros de Análise</h3>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Período</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Calendar className="text-blue-500 size-5" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Última Avaliação</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Esporte</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-blue-500 size-5">⚽</div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{data?.sport || 'Não informado'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nível Competitivo</label>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="text-blue-500 size-5">🏆</div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{data?.level || 'Não informado'}</span>
              </div>
            </div>
            <button 
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              Relatório Completo (PDF)
            </button>
            <button 
              onClick={onBack}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <Network className="size-4" />
              Nova Avaliação
            </button>
          </div>
        </div>
        
        <div className="bg-blue-500/10 p-5 rounded-xl border border-blue-500/20">
          <p className="text-xs text-blue-500 font-bold mb-2 uppercase">Interpretação {evalType}</p>
          <div className="space-y-3">
            {evalType === 'FMS' ? (
              <div className={`flex items-start gap-2 p-2 rounded ${Number(totalScore) <= 14 ? 'bg-red-500/10 text-red-500' : 'text-green-500'}`}>
                <Info className="size-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium">
                  {Number(totalScore) <= 14 
                    ? '≤14 pontos: Maior risco de lesão em atletas' 
                    : 'Score > 14: Risco de lesão reduzido'}
                </span>
              </div>
            ) : (
              <div className={`flex items-start gap-2 p-2 rounded ${Number(percentage) < 70 ? 'bg-amber-500/10 text-amber-500' : 'text-green-500'}`}>
                <Info className="size-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium">
                  {Number(percentage) < 70 
                    ? 'Aproveitamento abaixo de 70%: Necessita atenção' 
                    : 'Excelente desempenho funcional'}
                </span>
              </div>
            )}
            {hasAsymmetry && (
              <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-amber-500">
                <Info className="size-4 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium">Assimetria detectada: Fator de risco mais importante que a pontuação total</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Patient Header & Quick Stats */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="size-20 rounded-full border-4 border-slate-100 dark:border-slate-800 overflow-hidden relative">
                  <Image 
                    src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop"
                    alt={data?.name || "Paciente"}
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute bottom-0 right-0 size-6 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{data?.name || 'Paciente'}</h1>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded tracking-tighter">PRP Elite</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 text-sm mt-1">
                  <span className="flex items-center gap-1"><Fingerprint className="size-4" /> ID: #{patientId}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-4" /> Avaliado em: {evaluationDate}</span>
                  <span className="text-blue-500 font-medium">{data?.sport || 'Esporte não informado'} • {data?.dominance}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Score {evalType}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalScore}</span>
                  <span className="text-xs text-slate-400">/{maxScore}</span>
                </div>
                <span className={`text-[10px] font-bold flex items-center ${Number(percentage) >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(percentage) >= 70 ? 'Risco Baixo' : 'Risco Elevado'}
                </span>
              </div>
              <div className="flex-1 md:flex-none flex flex-col items-center justify-center px-6 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Aproveitamento</p>
                <span className="text-2xl font-bold text-blue-500">{totalPercentage}%</span>
                <span className="text-xs font-bold text-slate-400 flex items-center">Meta: 70%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Data Visualizations Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Network className="text-blue-500 size-5" />
                Perfil Funcional (%)
              </h3>
              <button className="text-slate-500 hover:text-blue-500 transition-colors">
                <Info className="size-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center min-h-[300px]">
              {isMounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8, fontWeight: 'bold' }} />
                    <Radar
                      name="Atleta"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#3b82f6' }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-full size-64"></div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="text-blue-500 size-5" />
                Desempenho por Categoria (%)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">% de Aproveitamento</span>
            </div>
            <div className="flex-1 space-y-5">
              {categories.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>{cat.name}</span>
                    <span>{cat.value}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${cat.value}%`, backgroundColor: cat.color.includes('b3') ? '#3b82f6b3' : '#3b82f6' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListTodo className="text-blue-500 size-5" />
              {evalType === 'FMS' ? 'Functional Movement Screen (FMS)' : 'PRP Performance Battery'}
            </h3>
            <button 
              onClick={handleExportPDF}
              disabled={isGeneratingPDF}
              className="text-blue-500 text-sm font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Exportar PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item da Avaliação</th>
                  <th className="px-6 py-4">Score Obtido</th>
                  <th className="px-6 py-4">Score Máximo</th>
                  <th className="px-6 py-4">Relação (%)</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detailedScores.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{row.item}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.score}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{row.max}</td>
                    <td className="px-6 py-4 text-sm font-bold text-blue-500">{row.rel}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-auto border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-6 text-center text-slate-500 text-xs">
          <p>© 2023 PRP Performance - Screen. Desenvolvido para Performance de Elite.</p>
        </footer>
      </div>
    </div>
  );
}
