// AppUI.js
import React, { useState, useEffect, useRef } from "react";
import { useChat } from "ai/react";

export default function AppUI() {
  // useChat extrae estados y handlers principales del Vercel AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat();

  // Estado local para simular evento/fase del agente
  const [estadoCore, setEstadoCore] = useState("Inactivo");

  // Log de actividad (array de strings)
  const [logActividad, setLogActividad] = useState([
    "🕹️ Listo para instrucciones...",
  ]);

  // Ref para scroll automático del chat
  const chatBottomRef = useRef(null);

  // Efecto para simular la actualización de las fases del agente en función del flujo del chat
  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      setEstadoCore("Inactivo");
      return;
    }
    // Supón que cada mensaje assistant contiene un marcador, simula cambios de estado
    if (isLoading) {
      setEstadoCore("Procesando instrucción...");
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        // Simula parseo de fase según texto
        let fase = "Listo";
        if (lastMsg.content?.includes("TreeSitter")) {
          fase = "Leyendo mapa del código...";
        } else if (lastMsg.content?.includes("planificar")) {
          fase = "Planificando tarea...";
        } else if (lastMsg.content?.includes("Diff-Match-Patch")) {
          fase = "Aplicando parche...";
        }
        setEstadoCore(fase);
        setLogActividad((logAnt) => [
          ...logAnt.slice(-20), // máximo 20 logs
          `➡️ ${fase}`,
        ]);
      }
      // Cuando user envía, logeamos su input
      if (lastMsg.role === "user") {
        setLogActividad((logAnt) => [
          ...logAnt.slice(-20),
          `💬 Usuario: ${lastMsg.content}`,
        ]);
      }
    }
  }, [messages, isLoading]);

  // Auto-scroll chat al último mensaje
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="w-full h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Panel Izquierdo: Chat */}
      <section className="flex flex-col w-3/5 h-full border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950">
        {/* Historial de mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id ?? idx}
                className={`flex ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg border shadow-sm
                    ${
                      isUser
                        ? "bg-blue-600 text-white border-blue-400"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-50 border-gray-300 dark:border-gray-700"
                    }
                  `}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
        {/* Formulario de entrada fijo abajo */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 items-end px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
        >
          <textarea
            className="flex-1 resize-none rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition"
            rows={2}
            placeholder="Escribe tu instrucción..."
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
            required
          />
          <button
            type="submit"
            className={`ml-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium shadow transition disabled:opacity-60 ${
              isLoading ? "cursor-not-allowed" : "hover:bg-blue-700"
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Cargando...
              </span>
            ) : (
              "Enviar"
            )}
          </button>
        </form>
      </section>

      {/* Panel Derecho: Dashboard/Estado */}
      <aside className="w-2/5 h-full flex flex-col bg-gray-50 dark:bg-gray-900/90 px-0 py-0">
        {/* Estado principal */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center gap-4">
          <div className="relative">
            {isLoading && (
              <span className="absolute -left-7 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </span>
            )}
            <span className={`font-bold text-lg ${isLoading ? "text-blue-600" : "text-gray-800 dark:text-gray-200"}`}>
              Estado: {estadoCore}
            </span>
          </div>
        </div>

        {/* Registro de actividad */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-100 dark:bg-gray-900/90">
          <div className="mb-2 text-gray-600 dark:text-gray-400 font-semibold">
            Registro de actividad
          </div>
          <div className="h-full flex flex-col gap-1">
            {logActividad.map((linea, idx) => (
              <div
                key={idx}
                className="whitespace-pre-wrap text-gray-700 dark:text-gray-200"
              >
                {linea}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
