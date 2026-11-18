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

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep SOC Reasoning)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (State-of-the-Art)' },
];

export const AiAnalyst: React.FC = () => {
  const location = useLocation();
  const stateAlert = (location.state as { preloadedAlert?: Alert } | null)?.preloadedAlert;

  const [geminiKey, setGeminiKey] = useState<string>(() => {
    return localStorage.getItem('cyberwatch_gemini_key') || '';
  });
  const [geminiModel, setGeminiModel] = useState<string>(() => {
    return localStorage.getItem('cyberwatch_gemini_model') || 'gemini-1.5-flash';
  });
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(geminiKey);
  const [tempModel, setTempModel] = useState<string>(geminiModel);

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
        model: geminiModel,
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
      const res = await chatWithAIAnalyst(text, messages, geminiKey || undefined, geminiModel);
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
    localStorage.setItem('cyberwatch_gemini_model', tempModel);
    setGeminiKey(tempKey.trim());
    setGeminiModel(tempModel);
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
            <h1
              className="text-xl font-bold tracking-tight flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Brain className="w-5 h-5" style={{ color: '#a855f7' }} />
              AI Security Analyst
            </h1>
            <span
              className="font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
              style={{
                background: 'rgba(168,85,247,0.1)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: '#a855f7',
              }}
            >
              <Sparkles className="w-3 h-3" />
              {geminiKey ? 'Gemini 1.5 Live' : 'SOC Heuristic Engine'}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Automated MITRE ATT&amp;CK mapping, root cause analysis, and interactive SOC incident triage assistant.
          </p>
        </div>

        {/* Model and Key Controls */}
        <div className="flex items-center gap-2">
          {/* Gemini Model Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={geminiModel}
              onChange={(e) => {
                const newModel = e.target.value;
                setGeminiModel(newModel);
                setTempModel(newModel);
                localStorage.setItem('cyberwatch_gemini_model', newModel);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}
              title="Select Gemini LLM Model"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setTempKey(geminiKey);
              setTempModel(geminiModel);
              setShowKeyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <Key className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>{geminiKey ? 'Gemini Key Configured' : 'Configure Gemini Key'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat (7 cols) */}
        <div
          className="lg:col-span-7 flex flex-col rounded-xl overflow-hidden shadow-lg h-[680px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Chat Header */}
          <div
            className="p-3.5 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{
                  background: 'rgba(168,85,247,0.1)',
                  border: '1px solid rgba(168,85,247,0.2)',
                  color: '#a855f7',
                }}
              >
                <Brain className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                SOC Assistant Conversation
              </span>
            </div>
            <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {geminiKey ? 'Powered by Google Gemini' : 'Powered by Local SOC Engine'}
            </span>
          </div>

          {/* Quick Prompt Chips */}
          <div
            className="p-2.5 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar select-none"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
            <span
              className="text-[10px] font-mono uppercase flex items-center gap-1 flex-shrink-0"
              style={{ color: 'var(--text-muted)' }}
            >
              <HelpCircle className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              Prompts:
            </span>
            {quickPrompts.map((qp) => (
              <button
                key={qp.id}
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-2.5 py-1 rounded text-[11px] font-mono flex-shrink-0 transition"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
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
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: 'rgba(168,85,247,0.2)',
                      border: '1px solid rgba(168,85,247,0.4)',
                      color: '#c4b5fd',
                    }}
                  >
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className="max-w-[85%] rounded-xl p-3 leading-relaxed shadow-md"
                  style={
                    msg.role === 'user'
                      ? { background: 'var(--accent)', color: '#050810' }
                      : { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed space-y-2">
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span
                      className="block text-[9px] mt-1.5 text-right opacity-70"
                      style={{ color: msg.role === 'user' ? '#050810' : 'var(--text-muted)' }}
                    >
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 items-center text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent)' }} />
                <span>AI Analyst is reasoning...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div
            className="p-3"
            style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
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
                className="flex-1 rounded-lg px-3 py-2 text-xs placeholder-slate-500 focus:outline-none font-mono transition"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="px-4 py-2 rounded-lg font-mono text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5 shadow-md transition"
                style={{ background: 'var(--accent)', color: '#050810' }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Deep Dive Forensic Investigation (5 cols) */}
        <div
          className="lg:col-span-5 flex flex-col rounded-xl overflow-hidden shadow-lg h-[680px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="p-3.5 flex flex-col gap-2"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <h2 className="text-xs font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
                  Forensic Incident Investigation
                </h2>
              </div>
              {analysis && (
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
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
                  className="w-full rounded p-1.5 text-xs font-mono focus:outline-none"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
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
              <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--text-secondary)' }}>
                <RotateCw className="w-6 h-6 animate-spin" style={{ color: '#a855f7' }} />
                <span>Generating MITRE ATT&amp;CK Threat Analysis...</span>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {/* Threat Title & Severity */}
                <div
                  className="p-3 rounded-lg space-y-1"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--accent)' }}>
                      Evaluated Incident
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded"
                      style={{
                        background: 'rgba(244,63,94,0.2)',
                        color: '#fda4af',
                        border: '1px solid rgba(244,63,94,0.3)',
                      }}
                    >
                      {analysis.severity_assessment}
                    </span>
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {analysis.incident_summary}
                  </h3>
                  <span className="text-[9px] block" style={{ color: 'var(--text-muted)' }}>
                    Engine: {analysis.provider}
                  </span>
                </div>

                {/* MITRE ATT&CK Mapping */}
                <div>
                  <span className="text-[10px] uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    MITRE ATT&amp;CK Matrix Techniques
                  </span>
                  <div className="space-y-1.5">
                    {analysis.mitre_techniques.map((tech) => (
                      <div
                        key={tech.id}
                        className="flex items-center justify-between p-2 rounded"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                      >
                        <span className="font-bold" style={{ color: '#c4b5fd' }}>{tech.id}</span>
                        <span className="truncate mx-2" style={{ color: 'var(--text-primary)' }}>{tech.name}</span>
                        <span className="text-[10px] uppercase flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {tech.tactic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Root Cause Analysis */}
                <div>
                  <span className="text-[10px] uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Root Cause Analysis
                  </span>
                  <div
                    className="p-3 rounded-lg leading-relaxed text-[11px]"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {analysis.root_cause_analysis}
                  </div>
                </div>

                {/* Containment Steps */}
                <div>
                  <span className="text-[10px] uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Containment Directives
                  </span>
                  <div className="space-y-1">
                    {analysis.containment_checklist.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded text-[11px]"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span className="font-bold" style={{ color: 'var(--accent)' }}>•</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Remediation Commands */}
                {analysis.suggested_commands.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase block mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                      Suggested Remediation CLI Commands
                    </span>
                    <div className="space-y-2">
                      {analysis.suggested_commands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded text-[11px]"
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border)',
                            color: '#00e676',
                          }}
                        >
                          <code className="truncate mr-2">{cmd}</code>
                          <button
                            onClick={() => handleCopyCommand(cmd, idx)}
                            className="p-1 rounded flex-shrink-0"
                            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                            title="Copy command"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5" style={{ color: '#00e676' }} />
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
              <div
                className="flex flex-col items-center justify-center h-full gap-3 text-center p-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ShieldAlert className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  No Incident Selected
                </span>
                <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>
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
            className="rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between pb-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h2
                className="text-sm font-bold font-mono flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Key className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                Configure Google Gemini API Key
              </h2>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1 rounded"
                style={{ color: 'var(--text-secondary)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono space-y-3" style={{ color: 'var(--text-primary)' }}>
              <p>
                Add your free Google Gemini API key to enable live generative AI responses for both the SOC chat assistant and threat investigations.
              </p>
              <div>
                <label className="block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Gemini Model
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  className="w-full rounded p-2 focus:outline-none"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: 'var(--bg-card)' }}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full rounded p-2 focus:outline-none"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Get a free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  Google AI Studio
                </a>
                . The key is stored safely in your browser.
              </p>
            </div>

            <div
              className="flex justify-end gap-2 pt-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setTempKey('');
                  localStorage.removeItem('cyberwatch_gemini_key');
                  setGeminiKey('');
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 rounded text-xs font-mono"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
              >
                Clear Key
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                className="px-4 py-1.5 rounded text-xs font-mono font-semibold"
                style={{ background: 'var(--accent)', color: '#050810' }}
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
