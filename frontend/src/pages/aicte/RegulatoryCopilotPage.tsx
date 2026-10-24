import React, { useState } from 'react';
import { Bot, Send, Sparkles, Database, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  data?: any;
  visualizationType?: string;
  matchedTool?: string;
  followUpSuggestions?: string[];
  timestamp: string;
}

export const RegulatoryCopilotPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'copilot',
      text: 'Welcome to the AICTE Regulatory AI Copilot. You can query institutional databases in natural language to inspect intake compliance, duplicate enrolments, verification rates, and anomaly factors.',
      matchedTool: 'Initialized Regulatory Query Engine',
      followUpSuggestions: [
        'Show colleges in West Bengal exceeding approved CSE intake',
        'Which institutions have the most unresolved duplicate enrolment cases?',
        'What is the verification rate for engineering students in Maharashtra?',
        'Compare admission utilization across three institutions',
      ],
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || queryInput).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setQueryInput('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(q);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: res.summary,
        data: res.data,
        visualizationType: res.visualizationType,
        matchedTool: res.matchedTool,
        followUpSuggestions: res.followUpSuggestions,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: 'Error processing regulatory query: ' + err.message,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">AICTE Regulatory AI Copilot</h1>
          <p className="text-sm text-slate-500 mt-1">
            Natural language interface executing controlled, deterministic analytical tools on institutional databases.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Allowlisted Tool Layer • Zero Hallucination</span>
        </div>
      </div>

      {/* Chat Conversation Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'copilot' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-bl-none shadow-xs'
                }`}
              >
                {/* Tool Tag if bot */}
                {msg.matchedTool && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-200 w-fit mb-2">
                    <Database className="w-3 h-3" />
                    <span>Tool Executed: {msg.matchedTool}</span>
                  </div>
                )}

                <p className="leading-relaxed font-medium">{msg.text}</p>

                {/* Structured Data Table Output */}
                {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          {Object.keys(msg.data[0]).map(k => (
                            <th key={k} className="py-2 px-3 capitalize">
                              {k.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {msg.data.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {Object.values(row).map((val: any, vIdx: number) => (
                              <td key={vIdx} className="py-2 px-3 font-mono">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Follow up suggestions */}
                {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Recommended Follow-Up Inquiries:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUpSuggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="text-[11px] font-medium bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-md text-left transition-colors flex items-center gap-1"
                        >
                          <span>{s}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl rounded-bl-none text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                <span>Executing allowlisted regulatory database query...</span>
              </div>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            placeholder="Ask questions about intake excess, duplicate enrolments, verification statistics..."
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !queryInput.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Ask AI</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
