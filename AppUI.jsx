import React, { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";

export default function AppUI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const chatBottomRef = useRef(null);
  
  // Estado para las pestañas y las credenciales de IA
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'settings', 'logs'
  const [openAiKey, setOpenAiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Cargar las APIs guardadas al iniciar la App
  useEffect(() => {
    const savedOpenAi = localStorage.getItem('openAiKey');
    const savedGemini = localStorage.getItem('geminiKey');
    if (savedOpenAi) setOpenAiKey(savedOpenAi);
    if (savedGemini) setGeminiKey(savedGemini);
  }, []);

  // Hacer scroll automático al último mensaje en el chat
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Función para guardar en el almacenamiento seguro del navegador
  const saveSettings = () => {
    localStorage.setItem('openAiKey', openAiKey);
    localStorage.setItem('geminiKey', geminiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Quita el mensaje de éxito tras 2s
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* HEADER FIJO */}
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10">
        <h1 className="font-bold text-xl tracking-tight text-blue-400">Tupia Agent <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full ml-2">AI PRO</span></h1>
        <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center font-bold text-sm">
          🧠
        </div>
      </header>

      {/* ÁREA PRINCIPAL DINÁMICA */}
      <main className="flex-1 overflow-y-auto pb-32 relative">
        
        {/* VISTA 1: CHAT */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-16 bg-gray-900 border border-gray-800 p-6 rounded-2xl mx-4">
                <span className="text-5xl block mb-4">🤖</span>
                <p className="font-bold text-gray-300">¡Hola! Soy tu Agente de IA Local.</p>
                <p className="text-sm mt-2">Ve a la pestaña de "APIs" para configurar tu modelo.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-400 rounded-bl-none animate-pulse text-sm">
                  Procesando...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* VISTA 2: CONFIGURACIÓN DE APIs */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
              <span>🔑</span> Llaves de Inteligencia Artificial
            </h2>
            
            <div className="space-y-5">
              {/* OPENAI INPUT */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <label className="block text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                  <span>🟢</span> OpenAI API Key
                </label>
                <input 
                  type="password" 
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-sm"
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">Necesaria para usar modelos GPT (GPT-4, GPT-3.5).</p>
              </div>

              {/* GEMINI INPUT */}
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <label className="block text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                  <span>🔵</span> Google Gemini API Key
                </label>
                <input 
                  type="password" 
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">Necesaria para usar los modelos de Gemini Pro.</p>
              </div>

              <button 
                onClick={saveSettings}
                className={`w-full font-bold py-4 px-4 rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isSaved ? 'bg-green-600 shadow-green-900/50' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/50'}`}
              >
                {isSaved ? "✅ ¡Llaves Guardadas!" : "💾 Guardar APIs"}
              </button>
            </div>
          </div>
        )}

        {/* VISTA 3: LOGS */}
        {activeTab === 'logs' && (
          <div className="p-4 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4 flex items-center gap-2">
              <span>📋</span> Registro del Sistema
            </h2>
            <div className="bg-black flex-1 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-gray-800 shadow-inner">
              <p className="mb-1 text-gray-500">[{new Date().toLocaleTimeString()}] Inicializando núcleo de IA...</p>
              <p className="mb-1 text-blue-400">[INFO] Interfaz Tupia Agent AI v1.0 en línea.</p>
              {openAiKey 
                ? <p className="mb-1 text-green-400">[OK] Llave de OpenAI lista.</p> 
                : <p className="mb-1 text-yellow-500">[WARN] Falta configurar llave de OpenAI.</p>}
              {geminiKey 
                ? <p className="mb-1 text-green-400">[OK] Llave de Gemini lista.</p> 
                : <p className="mb-1 text-yellow-500">[WARN] Falta configurar llave de Gemini.</p>}
              <p className="mb-1 text-gray-400 animate-pulse mt-4">_ Motor preparado para recibir prompts...</p>
            </div>
          </div>
        )}
      </main>

      {/* INPUT FORM (Sólo visible en Chat) */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSubmit} className="fixed bottom-[72px] left-0 w-full p-3 bg-gray-900 border-t border-gray-800 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <textarea
              className="flex-1 bg-black border border-gray-700 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 resize-none max-h-32 min-h-[50px] text-sm"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu prompt para la IA..."
              rows="1"
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-600 disabled:bg-gray-800 w-[50px] h-[50px] rounded-2xl font-bold text-white flex items-center justify-center transition-colors shrink-0">
              ➤
            </button>
          </div>
        </form>
      )}

      {/* BARRA DE NAVEGACIÓN MÓVIL (BOTTOM TABS) */}
      <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around p-2 pb-safe z-20">
        <button 
          onClick={() => setActiveTab('chat')} 
          className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${activeTab === 'chat' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="text-xl mb-1">💬</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Chat</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${activeTab === 'settings' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="text-xl mb-1">⚙️</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">APIs</span>
        </button>
        <button 
          onClick={() => setActiveTab('logs')} 
          className={`flex flex-col items-center p-2 rounded-xl transition-all w-20 ${activeTab === 'logs' ? 'text-blue-500 bg-blue-500/10' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <span className="text-xl mb-1">📋</span>
          <span className="text-[10px] font-bold tracking-wider uppercase">Logs</span>
        </button>
      </nav>
    </div>
  );
}
