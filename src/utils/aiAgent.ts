import type { Lot, Log, Task } from '../types/grow';

export interface MessageHistoryItem {
  role: 'user' | 'model';
  parts: string;
}

export interface AgentResponse {
  text: string;
  action?: {
    action: 'CREATE_TASK' | 'COMPLETE_TASK' | 'ADD_LOG';
    payload: any;
  };
}

export const sendMessageToAgent = async (
  userMessage: string,
  history: MessageHistoryItem[],
  context: {
    lots: Lot[];
    logs: Log[];
    tasks: Task[];
    activeNutrientLine: string;
    irrigationMethod: string;
  }
): Promise<AgentResponse> => {
  const provider = localStorage.getItem('grow_ai_provider') || 'gemini';
  const apiKey = localStorage.getItem('grow_ai_api_key') || '';
  const customModel = localStorage.getItem('grow_ai_model') || '';

  if (!apiKey) {
    return {
      text: '⚠️ No se ha configurado ninguna API Key. Configúrala en Ajustes o en este widget para comenzar.'
    };
  }

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generar Prompt de Sistema
  const systemPrompt = `Eres un experto científico agrícola y asesor de cultivo avanzado (GrowManager). Tu misión es ayudar al cultivador a optimizar sus plantas y realizar labores en el sistema.
Hoy es ${currentDate}.
Metodología de riego activa: ${context.irrigationMethod === 'automated' ? 'Automatizado' : 'Manual'}, Línea de nutrientes seleccionada: ${context.activeNutrientLine}.

DATOS EN TIEMPO REAL DEL CULTIVO:
- Camas/Lotes Activos: ${JSON.stringify(context.lots.filter(l => !l.is_archived))}
- Historial reciente de riegos y clima (logs): ${JSON.stringify(context.logs.slice(0, 10))}
- Tareas actuales (pendientes y completadas): ${JSON.stringify(context.tasks)}

INSTRUCCIONES DE RESPUESTA:
- Da consejos prácticos fundamentados en ciencia de cultivo (VPD, drybacks, pH, EC).
- Sé directo, conciso y estructurado en tus respuestas. Utiliza Markdown (negritas, listas, saltos de línea).
- Si el cultivador te pide hacer algo, hazlo mediante un comando estructurado.

CAPACIDAD DE EJECUTAR COMANDOS (TOOL CALLING):
Si el usuario te pide registrar un riego, crear una tarea o completar una tarea, debes responder confirmando con un mensaje corto y amigable, e incluir al final de tu respuesta un bloque de código JSON con el comando exacto en este formato:

\`\`\`json
{
  "action": "CREATE_TASK" | "COMPLETE_TASK" | "ADD_LOG",
  "payload": { ... }
}
\`\`\`

Formatos del payload:
1. Para CREATE_TASK (Crear tarea):
   { "lot_id": "id_del_lote_asociado", "title": "título de la tarea", "due_date": "YYYY-MM-DD" }
2. Para COMPLETE_TASK (Completar tarea):
   { "task_id": "id_de_la_tarea_a_completar" }
3. Para ADD_LOG (Registrar riego/bitácora):
   { 
     "lot_id": "id_del_lote", 
     "temp": 24.5, 
     "humidity": 60, 
     "ph": 5.8, 
     "ec": 1.5, 
     "ph_runoff": 5.7, 
     "ec_runoff": 1.8, 
     "notes": "Comentario del riego", 
     "water_liters": 5 
   }
   (Todos los campos de clima, agua, ph y ec deben ser números. ph_runoff y ec_runoff son opcionales si no se midió drenaje).

REGLAS DE IDENTIFICADORES (IDs):
- Solo puedes usar IDs de lotes y tareas que figuren en la sección de datos que se te proveyó.
- Si el cultivador te menciona el nombre de un lote (ej: "Cama 1 Arriba"), mapealo internamente a su ID (ej: "lot_123") antes de escribir el JSON.
- Cuando ejecutes un comando, describe de forma corta en tu mensaje de texto lo que hiciste (ej: "¡Entendido! Registré el riego para Cama 1 Arriba.").`;

  try {
    let textResponse = '';

    if (provider === 'gemini') {
      const modelName = customModel || 'gemini-1.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      // Dar formato a historial de mensajes para Gemini API
      const contents = [
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.parts }]
        })),
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP Error ${response.status}`);
      }

      const resJson = await response.json();
      textResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      // OpenAI API
      const modelName = customModel || 'gpt-4o-mini';
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.parts
        })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP Error ${response.status}`);
      }

      const resJson = await response.json();
      textResponse = resJson.choices?.[0]?.message?.content || '';
    }

    // Parsear si la IA retornó un comando estructurado JSON
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = textResponse.match(jsonRegex);

    if (match) {
      try {
        const action = JSON.parse(match[1].trim());
        const cleanedText = textResponse.replace(jsonRegex, '').trim();
        return {
          text: cleanedText,
          action
        };
      } catch (jsonErr) {
        console.error('Error al parsear el JSON de acción de IA:', jsonErr);
      }
    }

    return { text: textResponse };
  } catch (error: any) {
    console.error('Error en el conector del agente de IA:', error);
    return {
      text: `❌ Error al conectar con el Asistente de IA: ${error.message || error}`
    };
  }
};
