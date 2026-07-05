import React, { useState, useRef, useEffect } from 'react';
import { useGrow } from '../context/GrowContext';
import { sendMessageToAgent } from '../utils/aiAgent';
import type { MessageHistoryItem } from '../utils/aiAgent';
import { Sparkles, X, Send, Bot, Key, Loader2, CheckCircle, Settings } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: Date;
  statusText?: string;
}

export const AiChatWidget = () => {
  const { lots, logs, tasks, addLog, addTask, toggleTask, activeNutrientLine, irrigationMethod } = useGrow();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: '¡Hola! Soy tu **Asistente GrowIA**. Puedo analizar tus datos de escorrentía (runoff), sugerirte recetas nutricionales, diagnosticar problemas climáticos o registrar labores. \n\n¿En qué te puedo ayudar hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados de configuración rápida
  const [showConfig, setShowConfig] = useState(false);
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    const savedKey = localStorage.getItem('grow_ai_api_key') || '';
    const savedProvider = localStorage.getItem('grow_ai_provider') as 'gemini' | 'openai' || 'gemini';
    const savedModel = localStorage.getItem('grow_ai_model') || '';

    if (savedKey) {
      setApiKey(savedKey);
      setProvider(savedProvider);
      setModelName(savedModel);
      setIsConfigured(true);
    } else {
      setShowConfig(true);
    }
  }, []);

  // Scroll automático
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    localStorage.setItem('grow_ai_api_key', apiKey.trim());
    localStorage.setItem('grow_ai_provider', provider);
    localStorage.setItem('grow_ai_model', modelName.trim());

    setIsConfigured(true);
    setShowConfig(false);

    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: '⚙️ Configuración guardada. ¡Ahora puedes chatear conmigo!',
        timestamp: new Date()
      }
    ]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    if (!isConfigured) {
      setShowConfig(true);
      return;
    }

    const userMsgText = inputText.trim();
    setInputText('');

    // Agregar mensaje de usuario a la UI
    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    // Mapear historial al formato del agente
    const history: MessageHistoryItem[] = messages
      .filter(m => m.sender === 'user' || m.sender === 'agent')
      .slice(-10) // Mandar solo los últimos 10 para ahorrar contexto
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: m.text
      }));

    const response = await sendMessageToAgent(userMsgText, history, {
      lots,
      logs,
      tasks,
      activeNutrientLine,
      irrigationMethod
    });

    setIsLoading(false);

    // Agregar respuesta del agente a la UI
    const agentMsgId = `agt-${Date.now()}`;
    const newAgentMsg: ChatMessage = {
      id: agentMsgId,
      sender: 'agent',
      text: response.text,
      timestamp: new Date()
    };

    // Procesar acción si el agente la retornó
    if (response.action) {
      const { action, payload } = response.action;
      let statusText = '';

      try {
        if (action === 'CREATE_TASK') {
          // Validar payload
          if (payload.title && payload.due_date) {
            // Mapear id si no existe pero se tiene el nombre
            let lotId = payload.lot_id || '';
            if (!lotId && payload.lot_name) {
              const matchingLot = lots.find(l => l.name.toLowerCase() === payload.lot_name.toLowerCase());
              if (matchingLot) lotId = matchingLot.id;
            }

             await addTask({
              lot_id: lotId || '',
              title: payload.title,
              date: payload.due_date || payload.date || new Date().toISOString().split('T')[0],
              type: payload.type || 'otro',
              notes: payload.notes || ''
            });

            statusText = `✓ Tarea "${payload.title}" creada en la base de datos.`;
          } else {
            statusText = `⚠️ Error al crear tarea: Datos incompletos.`;
          }
        } else if (action === 'COMPLETE_TASK') {
          if (payload.task_id) {
            await toggleTask(payload.task_id);
            statusText = `✓ Tarea marcada como completada.`;
          } else {
            statusText = `⚠️ Error: ID de tarea no especificado.`;
          }
        } else if (action === 'ADD_LOG') {
          if (payload.lot_id && payload.temp && payload.humidity) {
            await addLog({
              lot_id: payload.lot_id,
              temp: Number(payload.temp),
              humidity: Number(payload.humidity),
              ph: Number(payload.ph || 5.8),
              ec: Number(payload.ec || 1.2),
              ph_runoff: payload.ph_runoff ? Number(payload.ph_runoff) : undefined,
              ec_runoff: payload.ec_runoff ? Number(payload.ec_runoff) : undefined,
              notes: payload.notes || 'Registro creado por GrowIA',
              water_amount: payload.water_liters ? Number(payload.water_liters) : undefined,
              watered_by: payload.watered_by || 'GrowIA',
              image_url: undefined
            });
            statusText = `✓ Riego registrado en la bitácora con éxito.`;
          } else {
            statusText = `⚠️ Error al registrar riego: Faltan parámetros mínimos (Lote, Temp, Humedad).`;
          }
        }
      } catch (err: any) {
        console.error('Error ejecutando acción de IA:', err);
        statusText = `❌ Error al ejecutar labor en Supabase: ${err.message || err}`;
      }

      if (statusText) {
        newAgentMsg.statusText = statusText;
      }
    }

    setMessages(prev => [...prev, newAgentMsg]);
  };

  // Función simple para formatear texto en HTML básico (Markdown simple)
  const formatMessageText = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Formatear negritas **texto**
        let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Formatear código en línea `code`
        formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]">$1</code>');
        
        // Listas con viñetas
        if (formatted.trim().startsWith('- ') || formatted.trim().startsWith('* ')) {
          return (
            <li key={i} className="list-disc list-inside ml-2 text-slate-700 mt-1 font-medium">
              <span dangerouslySetInnerHTML={{ __html: formatted.trim().substring(2) }} />
            </li>
          );
        }

        if (formatted.trim() === '') {
          return <div key={i} className="h-2" />;
        }

        return (
          <p key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      });
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer border border-emerald-500/20"
        title="Asistente de Cultivo IA"
      >
        {isOpen ? <X size={24} /> : <Sparkles className="animate-pulse" size={24} />}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 bg-white border border-slate-200 rounded-3xl w-[360px] sm:w-[400px] h-[550px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 select-none">
          {/* Header */}
          <div className="bg-slate-900 px-5 py-4 flex justify-between items-center text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-wide">Asistente GrowIA</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Activo y Analizando</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Configuración de IA"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cuerpo - Configuración */}
          {showConfig ? (
            <form onSubmit={handleSaveConfig} className="flex-1 p-6 bg-slate-50 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800">
                  <Key className="text-emerald-600" size={18} />
                  <h5 className="font-bold text-sm">Configuración de la API Key</h5>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Para interactuar con la IA, ingresa tu API Key. Los datos se guardan exclusivamente en tu navegador de forma segura.
                </p>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Proveedor de IA</label>
                    <select
                      value={provider}
                      onChange={(e) => {
                        const val = e.target.value as 'gemini' | 'openai';
                        setProvider(val);
                        setModelName('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI (ChatGPT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-proj-...'}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Modelo Personalizado (Opcional)
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder={provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="text-[9px] text-slate-400 font-medium block mt-1">
                      Déjalo vacío para usar los recomendados por defecto.
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                {isConfigured && (
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 text-xs transition cursor-pointer"
                  >
                    Volver
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Guardar y Activar
                </button>
              </div>
            </form>
          ) : (
            /* Cuerpo - Mensajes de Chat */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="text-center">
                        <span className="inline-block text-[9.5px] font-bold bg-slate-200/60 text-slate-650 px-2.5 py-1 rounded-full border border-slate-350">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isAgent = msg.sender === 'agent';

                  return (
                    <div key={msg.id} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'} space-y-1`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed whitespace-pre-wrap ${
                          isAgent
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                            : 'bg-emerald-600 text-white rounded-tr-xs'
                        }`}
                      >
                        {formatMessageText(msg.text)}
                      </div>

                      {/* Mostrar status de acciones automáticas */}
                      {msg.statusText && (
                        <div className="flex items-center gap-1 text-[9.5px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 max-w-[85%] ml-1">
                          <CheckCircle size={10} className="shrink-0 text-emerald-500" />
                          <span className="truncate">{msg.statusText}</span>
                        </div>
                      )}

                      <span className="text-[8px] text-slate-400 font-bold px-1.5">
                        {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Cargando */}
                {isLoading && (
                  <div className="flex items-start space-x-2">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 shadow-2xs flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-emerald-500" />
                      <span>GrowIA está formulando respuesta...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={isConfigured ? "Pregúntale a GrowIA..." : "Configura tu API Key primero..."}
                  disabled={isLoading || !isConfigured}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim() || !isConfigured}
                  className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 cursor-pointer ${
                    inputText.trim() && isConfigured
                      ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
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
