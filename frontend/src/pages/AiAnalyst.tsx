import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  Send,
  Terminal,
  ShieldAlert,
  Copy,
  Check,
  RotateCw,
  HelpCircle,
  Key,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  analyzeThreatWithAI,
  chatWithAIAnalyst,
  getAIQuickPrompts,
  getAlerts,
} from '../services/api';
import { AIChatMessage, AIThreatAnalysis, Alert } from '../types';

export const AiAnalyst: React.FC = () => {
  const location = useLocation();
  const stateAlert = (location.state as { preloadedAlert?: Alert } | null)?.preloadedAlert;

  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem('cyberwatch_gemini_key') || '';
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(geminiKey);

  const [availableAlerts, setAvailableAlerts] = useState<Alert[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        "### 👋 CyberWatch AI SOC Analyst Ready\n\n" +
        "I am your automated cybersecurity reasoning engine. I monitor host telemetry, map attack vectors to **MITRE ATT&CK**, and generate PowerShell containment commands.\n\n" +
        "**You can:**\n" +
        "- Ask me any security question or click a prompt below.\n" +
        "- Select any active incident in the right-hand panel for automated root-cause analysis.\n" +
        "- (Optional) Connect your **Google Gemini API Key** via the button above for real live generative AI answers!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<Array<{ id: string; title: string; prompt: string }>>([]);

  // Deep Dive Investigation State
  const [analysis, setAnalysis] = useState<AIThreatAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load available alerts for dropdown selector
  useEffect(() => {
    getAlerts({ limit: 50 })
      .then((res) => {
        const items = res.items || [];
        setAvailableAlerts(items);
        if (stateAlert) {
          setSelectedIncidentId(stateAlert.id);
          runDeepDive(stateAlert);
        } else if (items.length > 0) {
          setSelectedIncidentId(items[0].id);
          runDeepDive(items[0]);
        }
      })
      .catch(console.error);

    getAIQuickPrompts().then(setQuickPrompts).catch(console.error);
  }, [stateAlert]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const runDeepDive = async (alert: Alert) => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeThreatWithAI({
        event_id: alert.id,
        title: alert.title,
        description: alert.description,
        source_ip: alert.source_ip || undefined,
        dest_ip: alert.dest_ip || undefined,
        dest_port: alert.dest_port || undefined,
        process_name: alert.process_name || undefined,
        pid: alert.pid || undefined,
        api_key: geminiKey || undefined,
      });
      setAnalysis(res);
    } catch (err) {
      console.error('AI Threat analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleIncidentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIncidentId(id);
    const target = availableAlerts.find((a) => a.id === id);
    if (target) {
      runDeepDive(target);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isSending) return;

    const userMsg: AIChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const res = await chatWithAIAnalyst(text, messages);
      const assistantMsg: AIChatMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Error communicating with the AI reasoning engine. Please try again.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('cyberwatch_gemini_key', tempKey.trim());
    setGeminiKey(tempKey.trim());
    setShowKeyModal(false);
  };

  const handleCopyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Security Analyst
            </h1>
            <span className="font-mono text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {geminiKey ? 'Gemini 1.5 Live' : 'SOC Heuristic Engine'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated MITRE ATT&CK mapping, root cause analysis, and interactive SOC incident triage assistant.
          </p>
        </div>

        {/* API Key Modal Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTempKey(geminiKey);
              setShowKeyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#172136] hover:bg-[#22304d] text-slate-300 hover:text-cyan-300 border border-[#2d3548] rounded-lg text-xs font-mono transition"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>{geminiKey ? 'Gemini Key Configured' : 'Configure Gemini Key'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg h-[680px]">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-[#2d3548] bg-[#0c121e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200">
                SOC Assistant Conversation
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {geminiKey ? 'Powered by Google Gemini' : 'Powered by Local SOC Engine'}
            </span>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2.5 bg-[#0e1524] border-b border-[#2d3548] flex items-center gap-2 overflow-x-auto text-xs no-scrollbar select-none">
            <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 flex-shrink-0">
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              Prompts:
            </span>
            {quickPrompts.map((qp) => (
              <button
                key={qp.id}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 bg-[#172136] hover:bg-[#22304d] text-slate-300 hover:text-cyan-300 border border-[#2d3548] rounded text-[11px] font-mono flex-shrink-0 transition"
              >
                {qp.title}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-[#152033] border border-[#273854] text-slate-200 shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className="block text-[9px] text-slate-400 mt-1.5 text-right opacity-70">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 items-center text-slate-400 text-xs font-mono">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>AI Analyst is reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-[#2d3548] bg-[#0c121e]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about your host telemetry, port risks, process injection, or remediation..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isSending}
                className="flex-1 bg-[#172136] border border-[#2d3548] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-mono text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 shadow-md transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Deep Dive Forensic Investigation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg h-[680px]">
          <div className="p-3.5 border-b border-[#2d3548] bg-[#0c121e] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-semibold text-slate-200 font-mono">
                  Forensic Incident Investigation
                </h2>
              </div>
              {analysis && (
                <span className="text-[10px] font-mono text-slate-400">
                  {analysis.analysis_id}
                </span>
              )}
            </div>

            {/* Incident Dropdown Selector */}
            {availableAlerts.length > 0 && (
              <div className="relative">
                <select
                  value={selectedIncidentId}
                  onChange={handleIncidentChange}
                  className="w-full bg-[#131d33] border border-[#2d3548] rounded p-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {availableAlerts.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.severity.toUpperCase()}] {a.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                <RotateCw className="w-6 h-6 animate-spin text-purple-400" />
                <span>Generating MITRE ATT&CK Threat Analysis...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* Threat Title & Severity */}
                <div className="p-3 bg-[#131d33] border border-[#223254] rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold">
                      Evaluated Incident
                    </span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      {analysis.severity_assessment}
                    </span>
                  </div>
                  <h3 className="text-slate-100 font-semibold">{analysis.incident_summary}</h3>
                  <span className="text-[9px] text-slate-500 block">
                    Engine: {analysis.provider}
                  </span>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1.5">
                    MITRE ATT&CK Matrix Techniques
                  </span>
                  <div className="space-y-1.5">
                    {analysis.mitre_techniques.map((tech) => (
                      <div
                        key={tech.id}
                        className="flex items-center justify-between p-2 rounded bg-[#0a0e17] border border-[#1b2640]"
                      >
                        <span className="text-purple-300 font-bold">{tech.id}</span>
                        <span className="text-slate-200 truncate mx-2">{tech.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase flex-shrink-0">{tech.tactic}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1.5">
                    Root Cause Analysis
                  </span>
                  <div className="p-3 bg-[#131d33] border border-[#223254] rounded-lg text-slate-300 leading-relaxed text-[11px]">
                    {analysis.root_cause_analysis}
                  </div>
                </div>

                {/* Containment Steps */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block mb-1.5">
                    Containment Directives
                  </span>
                  <div className="space-y-1">
                    {analysis.containment_checklist.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-[#131d33] border border-[#223254] rounded text-slate-300 text-[11px]"
                      >
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Remediation Commands */}
                {analysis.suggested_commands.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block mb-1.5">
                      Suggested Remediation CLI Commands
                    </span>
                    <div className="space-y-2">
                      {analysis.suggested_commands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-[#090d16] border border-[#1b2640] rounded text-[11px] text-emerald-400"
                        >
                          <code className="truncate mr-2">{cmd}</code>
                          <button
                            onClick={() => handleCopyCommand(cmd, idx)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex-shrink-0"
                            title="Copy command"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6 text-slate-400">
                <ShieldAlert className="w-8 h-8 text-slate-600" />
                <span className="text-sm text-slate-300 font-semibold">
                  No Incident Selected
                </span>
                <p className="text-xs text-slate-500 max-w-xs">
                  Select an incident from the dropdown above or click &quot;Analyze with AI&quot; in the Alerts queue.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#0f172a] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Configure Google Gemini API Key
              </h2>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono text-slate-300 space-y-3">
              <p>
                Add your free Google Gemini API key to enable live generative AI responses for both the SOC chat assistant and threat investigations.
              </p>
              <div>
                <label className="block text-slate-400 mb-1">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full bg-[#131d33] border border-[#223254] rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Get a free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 underline"
                >
                  Google AI Studio
                </a>
                . The key is stored safely in your browser.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => {
                  setTempKey('');
                  localStorage.removeItem('cyberwatch_gemini_key');
                  setGeminiKey('');
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 text-xs font-mono"
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 bg-cyan-600 text-white rounded hover:bg-cyan-500 text-xs font-mono font-semibold"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
