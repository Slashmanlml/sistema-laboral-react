import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, Bot, Key, CheckCircle, Settings, ShieldQuestion } from 'lucide-react';

import { useGrow, useGrowActions } from '../context/GrowContext';
import {
  sendMessageToAgent,
  describeAgentAction,
  type AgentAction,
  type MessageHistoryItem,
} from '../utils/aiAgent';
import {
  AI_CONFIG_CHANGED_EVENT,
  getAiConfig,
  saveAiConfig,
  type AiProvider,
} from '../utils/aiConfig';
import { MarkdownText } from './ui/MarkdownText';
import { Button } from './ui/Button';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
  /** Acción propuesta pendiente de confirmación por parte del cultivador. */
  pendingAction?: AgentAction;
  /** Resultado de una acción ya resuelta. */
  statusText?: string;
}

const CHAT_STORAGE_KEY = 'grow_chat_history';
const MAX_STORED_MESSAGES = 30;
const MAX_HISTORY_TURNS = 10;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  sender: 'agent',
  text: '¡Hola! Soy tu **Asistente GrowIA**. Puedo analizar tus datos de escorrentía (runoff), sugerirte recetas nutricionales, diagnosticar problemas climáticos o registrar labores. \n\n¿En qué te puedo ayudar hoy?',
  timestamp: new Date(),
};

const loadStoredMessages = (): ChatMessage[] => {
  try {
    const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!saved) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(saved) as ChatMessage[];
    // Las acciones pendientes no sobreviven a un refresh: se descartan a propósito
    // para que nada quede confirmable fuera de su contexto.
    return parsed.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
      pendingAction: undefined,
    }));
  } catch {
    return [WELCOME_MESSAGE];
  }
};

export const AiChatWidget = () => {
  const { lots, logs, tasks, activeNutrientLine, irrigationMethod } = useGrow();
  const { addLog, addTask, toggleTask } = useGrowActions();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadStoredMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado inicial leído de una sola vez desde el almacenamiento local.
  const [showConfig, setShowConfig] = useState(() => !getAiConfig().apiKey);
  const [provider, setProvider] = useState<AiProvider>(() => getAiConfig().provider);
  const [apiKey, setApiKey] = useState(() => getAiConfig().apiKey);
  const [modelName, setModelName] = useState(() => getAiConfig().model);
  const [isConfigured, setIsConfigured] = useState(() => Boolean(getAiConfig().apiKey));

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Configuración ────────────────────────────────────────────────────────

  // Mantenerse en sincronía con los cambios hechos desde la pantalla de Ajustes.
  useEffect(() => {
    const syncConfigFromStorage = () => {
      const config = getAiConfig();
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setModelName(config.model);
      setIsConfigured(Boolean(config.apiKey));
      if (!config.apiKey) setShowConfig(true);
    };

    window.addEventListener(AI_CONFIG_CHANGED_EVENT, syncConfigFromStorage);
    return () => window.removeEventListener(AI_CONFIG_CHANGED_EVENT, syncConfigFromStorage);
  }, []);

  // Cancelar la petición en vuelo si se desmonta el widget.
  useEffect(() => () => abortRef.current?.abort(), []);

  // ─── Persistencia y scroll ────────────────────────────────────────────────

  useEffect(() => {
    try {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
      );
    } catch {
      /* sessionStorage lleno o no disponible */
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const handleSaveConfig = (event: React.FormEvent) => {
    event.preventDefault();
    if (!apiKey.trim()) return;

    saveAiConfig({ provider, apiKey, model: modelName });
    setIsConfigured(true);
    setShowConfig(false);

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${crypto.randomUUID()}`,
        sender: 'system',
        text: '⚙️ Configuración guardada en este dispositivo. ¡Ya podés chatear!',
        timestamp: new Date(),
      },
    ]);
  };

  // ─── Ejecución de acciones (siempre con confirmación) ──────────────────────

  const resolveAction = async (messageId: string, action: AgentAction, accept: boolean) => {
    if (!accept) {
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, pendingAction: undefined, statusText: '✕ Acción descartada.' }
            : m
        )
      );
      return;
    }

    let statusText: string;
    try {
      switch (action.action) {
        case 'CREATE_TASK':
          await addTask(action.payload);
          statusText = `✓ Tarea "${action.payload.title}" creada.`;
          break;
        case 'COMPLETE_TASK':
          await toggleTask(action.payload.task_id);
          statusText = '✓ Tarea marcada como completada.';
          break;
        case 'ADD_LOG':
          await addLog({ ...action.payload, watered_by: 'GrowIA' });
          statusText = '✓ Registro guardado en la bitácora.';
          break;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      statusText = `❌ No se pudo ejecutar: ${message}`;
    }

    setMessages(prev =>
      prev.map(m => (m.id === messageId ? { ...m, pendingAction: undefined, statusText } : m))
    );
  };

  // ─── Envío de mensajes ────────────────────────────────────────────────────

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inputText.trim() || isLoading) return;

    if (!isConfigured) {
      setShowConfig(true);
      return;
    }

    const userMsgText = inputText.trim();
    setInputText('');
    setMessages(prev => [
      ...prev,
      {
        id: `usr-${crypto.randomUUID()}`,
        sender: 'user',
        text: userMsgText,
        timestamp: new Date(),
      },
    ]);
    setIsLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history: MessageHistoryItem[] = messages
        .filter(m => m.sender === 'user' || m.sender === 'agent')
        .slice(-MAX_HISTORY_TURNS)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: m.text }));

      const response = await sendMessageToAgent(
        userMsgText,
        history,
        { lots, logs, tasks, activeNutrientLine, irrigationMethod },
        controller.signal
      );

      if (controller.signal.aborted) return;

      setMessages(prev => [
        ...prev,
        {
          id: `agt-${crypto.randomUUID()}`,
          sender: 'agent',
          text: response.text,
          timestamp: new Date(),
          pendingAction: response.action,
          statusText: response.actionError
            ? `⚠️ ${response.actionError}`
            : undefined,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Por favor, intentá de nuevo.';
      setMessages(prev => [
        ...prev,
        {
          id: `err-${crypto.randomUUID()}`,
          sender: 'system',
          text: `❌ Error inesperado: ${message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-label={isOpen ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border border-emerald-500/20"
      >
        {isOpen ? <X size={24} /> : <Sparkles className="animate-pulse" size={24} />}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente GrowIA"
          className="fixed bottom-24 right-6 z-40 bg-white border border-slate-200 rounded-3xl w-[360px] sm:w-[400px] h-[550px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">Asistente GrowIA</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isConfigured ? 'Activo' : 'Sin configurar'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfig(value => !value)}
                aria-label="Configuración de IA"
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <Settings size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {showConfig ? (
            <form
              onSubmit={handleSaveConfig}
              className="flex-1 p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Key className="text-emerald-600" size={18} />
                  <h5 className="font-bold text-sm">Configuración de la API Key</h5>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  La clave se guarda <strong>únicamente en este dispositivo</strong> y no se
                  sincroniza con la nube. Si usás otro navegador, vas a tener que cargarla de
                  nuevo.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label
                      htmlFor="ai-provider"
                      className="text-[10px] uppercase font-bold text-slate-400 block mb-1"
                    >
                      Proveedor de IA
                    </label>
                    <select
                      id="ai-provider"
                      value={provider}
                      onChange={event => {
                        setProvider(event.target.value as AiProvider);
                        setModelName('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI (ChatGPT)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="ai-key"
                      className="text-[10px] uppercase font-bold text-slate-400 block mb-1"
                    >
                      API Key
                    </label>
                    <input
                      id="ai-key"
                      type="password"
                      value={apiKey}
                      onChange={event => setApiKey(event.target.value)}
                      placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="ai-model"
                      className="text-[10px] uppercase font-bold text-slate-400 block mb-1"
                    >
                      Modelo Personalizado (Opcional)
                    </label>
                    <input
                      id="ai-model"
                      type="text"
                      value={modelName}
                      onChange={event => setModelName(event.target.value)}
                      placeholder={provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                {isConfigured && (
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => setShowConfig(false)}
                  >
                    Volver
                  </Button>
                )}
                <Button type="submit" size="sm" fullWidth>
                  Guardar y Activar
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block text-[9.5px] font-bold bg-slate-200/60 text-slate-600 px-2.5 py-1 rounded-full border border-slate-300">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isAgent = msg.sender === 'agent';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                          isAgent
                            ? 'bg-white border border-slate-200 text-slate-800'
                            : 'bg-emerald-600 text-white whitespace-pre-wrap'
                        }`}
                      >
                        {isAgent ? <MarkdownText text={msg.text} /> : msg.text}
                      </div>

                      {/* Confirmación explícita antes de tocar la base de datos. */}
                      {msg.pendingAction && (
                        <div className="max-w-[90%] bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                          <div className="flex items-start gap-1.5 text-[10px] font-bold text-amber-800">
                            <ShieldQuestion size={13} className="shrink-0 mt-px" />
                            <span>{describeAgentAction(msg.pendingAction, lots)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                void resolveAction(msg.id, msg.pendingAction!, true)
                              }
                            >
                              Confirmar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                void resolveAction(msg.id, msg.pendingAction!, false)
                              }
                            >
                              Descartar
                            </Button>
                          </div>
                        </div>
                      )}

                      {msg.statusText && (
                        <div className="flex items-center gap-1 text-[9.5px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 max-w-[85%] ml-1">
                          <CheckCircle size={10} className="shrink-0 text-emerald-500" />
                          <span className="truncate">{msg.statusText}</span>
                        </div>
                      )}

                      <span className="text-[8px] text-slate-400 font-bold px-1.5">
                        {msg.timestamp.toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start" aria-label="El asistente está escribiendo">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-1.5">
                      {[0, 150, 300].map(delay => (
                        <span
                          key={delay}
                          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0 items-center"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={event => setInputText(event.target.value)}
                  placeholder={
                    isConfigured ? 'Pregúntale a GrowIA...' : 'Configura tu API Key primero...'
                  }
                  aria-label="Mensaje para el asistente"
                  disabled={isLoading || !isConfigured}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim() || !isConfigured}
                  aria-label="Enviar mensaje"
                  className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
                    inputText.trim() && isConfigured
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
};
