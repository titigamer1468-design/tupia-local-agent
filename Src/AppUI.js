import React, { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";

export default function AppUI() {
  // Inicializamos el chat usando el SDK de Vercel
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  const [estadoCore, setEstadoCore] = useState("Listo para trabajar");
  const chatBottomRef = useRef(null);

  // Auto-scroll al final del chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full h-screen flex bg-gray-900 text-gray-100">
      <section className="flex flex-col w-3/5 h-full border-r border-gray-700">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-950">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-800 rounded p-2 focus:outline-none"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu instrucción..."
              disabled={isLoading}
            />
            <button type="submit" className="bg-blue-600 px-4 py-2 rounded font-bold">Enviar</button>
          </div>
        </form>
      </section>

      <aside className="w-2/5 p-6 bg-gray-950 border-l border-gray-700">
        <h2 className="text-xl font-bold mb-4">Estado del Agente</h2>
        <div className="p-4 bg-gray-900 rounded border border-gray-700 text-blue-400 font-mono">
          {estadoCore}
        </div>
      </aside>
    </div>
  );
}
