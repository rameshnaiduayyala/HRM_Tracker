import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, HelpCircle, ArrowRight, Brain, Clock, ShieldAlert } from 'lucide-react';
import { reportApi } from '../../services';
import { toast } from 'react-hot-toast';

export default function AIAnalyticsTab({ companyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState('daily');

  useEffect(() => {
    if (companyId) {
      fetchAiAnalytics();
    }
  }, [companyId]);

  const fetchAiAnalytics = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getAiSummary(companyId);
      setData(res.data?.report || res.report || null);
    } catch (err) {
      toast.error('Failed to load AI workforce insights.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">AI engine generating workforce summaries...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/10">
        <Brain className="w-12 h-12 text-gray-700 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-300">No Analytics Loaded</h3>
        <p className="text-xs text-gray-500 mt-1">Select an active corporate division or verify tracking heartbeats are configured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Title Banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-gray-950 border border-indigo-500/10 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">AI Copilot & Performance Insights</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-2xl">
            Our neural model scans live application focus sequences, desktop mouse activity levels, leave history, and task speed to calculate recommendations.
          </p>
        </div>
        <button
          onClick={fetchAiAnalytics}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shrink-0 uppercase tracking-wider shadow shadow-indigo-600/10"
        >
          Re-Analyze Workspace
        </button>
      </div>

      {/* Executive Summary Card & Productive Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Executive Summary</span>
            <p className="text-sm text-gray-200 mt-2 leading-relaxed font-sans">{data.executiveSummary}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-850 flex gap-4">
            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center gap-3 flex-1">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-[9px] text-gray-500 uppercase block font-bold">Focus Target</span>
                <span className="text-xs font-bold text-white">92% Operational Compliance</span>
              </div>
            </div>
            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 flex items-center gap-3 flex-1">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[9px] text-gray-500 uppercase block font-bold">Velocity Level</span>
                <span className="text-xs font-bold text-white">Stable Task Pacing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Focus Trend Gauge */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-850 pb-2">Workspace Time Allocation</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">Productive (Apps & Docs)</span>
                <span className="text-emerald-400 font-mono font-bold">{data.focusTrends.productivePercentage}%</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${data.focusTrends.productivePercentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">Neutral Workspaces</span>
                <span className="text-indigo-400 font-mono font-bold">{data.focusTrends.neutralPercentage}%</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${data.focusTrends.neutralPercentage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300">Unproductive Sites</span>
                <span className="text-red-400 font-mono font-bold">{data.focusTrends.unproductivePercentage}%</span>
              </div>
              <div className="w-full bg-gray-950 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.focusTrends.unproductivePercentage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Timelines & Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interval summaries tab cards */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Operations Summaries</h3>
              <div className="flex bg-gray-950 p-0.5 rounded border border-gray-850">
                {['daily', 'weekly', 'monthly'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSummaryTab(tab)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase transition ${
                      activeSummaryTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed min-h-[80px]">
              {data.summaries[activeSummaryTab]}
            </p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 border-b border-gray-850 pb-2">Workload & Policy Recommendations</h3>
            <div className="space-y-3">
              {data.workloadRecommendations.map((rec, i) => (
                <div key={i} className="p-3 bg-gray-900/60 border border-gray-800 rounded-xl flex items-start gap-3">
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                    rec.priority === 'High' ? 'bg-red-950 text-red-400 border border-red-800/30' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {rec.priority}
                  </span>
                  <p className="text-xs text-gray-300 leading-relaxed">{rec.suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workforce Anomaly Alerter */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-855 pb-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Neural Anomaly Detection</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.anomalies.map((anom, idx) => (
            <div key={idx} className="p-3 bg-[#1e1512]/30 border border-amber-500/10 rounded-xl flex gap-3 items-center">
              <div className="p-2 bg-amber-950/40 text-amber-400 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-bold block uppercase">{anom.type}</span>
                <p className="text-xs text-gray-300 mt-0.5">{anom.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
