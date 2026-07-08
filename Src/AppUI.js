// AppUI.jsx - Versión corregida y optimizada
import React, { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";

// NOTA: Asegúrate de que estas librerías estén instaladas en tu package.json.
// No uses rutas relativas a '../lib' a menos que sean archivos locales en 'src'.
// Si son librerías de NPM, impórtalas por su nombre.

export default function AppUI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat', // Asegúrate de tener este endpoint configurado o cámbialo por tu lógica local
  });

  const [estadoCore, setEstadoCore] = useState("Inactivo");
  const [logActividad, setLogActividad] = useState(["🕹️ Sistema listo..."]);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      setEstadoCore("Procesando instrucción...");
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        // Lógica de detección de estados basada en contenido
        const content = lastMsg.content || "";
        let fase = "Listo";
        if (content.includes("TreeSitter")) fase = "Leyendo mapa del código...";
        else if (content.includes("planificar")) fase = "Planificando tarea...";
        else if (content.includes("Diff-Match-Patch")) fase = "Aplicando parche...";
        
        setEstadoCore(fase);
        setLogActividad(prev => [...prev.slice(-19), `➡️ ${fase}`]);
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-screen flex bg-gray-900 text-gray-100">
      {/* Panel Izquierdo: Chat */}
      <section className="flex flex-col w-3/5 h-full border-r border-gray-700">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-950">
          <div className="flex gap-2">
            <textarea
              className="flex-1 bg-gray-800 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu instrucción..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "..." : "Enviar"}
            </button>
          </div>
        </form>
      </section>

      {/* Panel Derecho: Estado */}
      <aside className="w-2/5 p-6 bg-gray-950 border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4">Estado del Agente</h2>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-blue-400 font-mono">
          {estadoCore}
        </div>
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Logs:</h3>
          <div className="text-sm font-mono text-gray-400 space-y-1">
            {logActividad.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        </div>
      </aside>
    </div>
  );
}
