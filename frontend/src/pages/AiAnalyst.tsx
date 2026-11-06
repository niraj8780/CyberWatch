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
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  analyzeThreatWithAI,
  chatWithAIAnalyst,
  getAIQuickPrompts,
} from '../services/api';
import { AIChatMessage, AIThreatAnalysis, Alert } from '../types';

export const AiAnalyst: React.FC = () => {
  const location = useLocation();
  const stateAlert = (location.state as { preloadedAlert?: Alert } | null)?.preloadedAlert;

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello Analyst! I am your **CyberWatch AI Security Analyst**.\n\nI continuously monitor your network telemetry, map threats to the **MITRE ATT&CK framework**, and provide containment playbooks.\n\nAsk me any question below, or select a threat to perform an automated deep-dive investigation.",
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

  useEffect(() => {
    getAIQuickPrompts().then(setQuickPrompts).catch(console.error);

    // If navigated with an alert, trigger instant deep dive!
    if (stateAlert) {
      runDeepDive(stateAlert);
    }
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
      });
      setAnalysis(res);
    } catch (err) {
      console.error('AI Threat analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
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
          content: 'Sorry, I encountered an error communicating with the AI reasoning engine.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
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
            <span className="font-mono text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Reasoning Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated MITRE ATT&CK mapping, root cause analysis, and interactive SOC incident triage assistant.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Chat (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg h-[640px]">
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
              AI Ready
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
                  <div className="whitespace-pre-wrap">{msg.content}</div>
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
                placeholder="Ask about a threat, port, process, or remediation command..."
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
        <div className="lg:col-span-5 flex flex-col bg-[#111827] border border-[#2d3548] rounded-xl overflow-hidden shadow-lg h-[640px]">
          <div className="p-3.5 border-b border-[#2d3548] bg-[#0c121e] flex items-center justify-between">
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
                        <span className="text-slate-200">{tech.name}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{tech.tactic}</span>
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
                  No Incident Selected for Deep Dive
                </span>
                <p className="text-xs text-slate-500 max-w-xs">
                  Go to **Threat Detection** or **Alerts** and click **"Analyze with AI"** to see instant MITRE ATT&CK mappings and automated response commands.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
