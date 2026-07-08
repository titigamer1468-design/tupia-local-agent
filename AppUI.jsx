import React, { useState, useRef, useEffect } from "react";

export default function AppUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('chat');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [logs, setLogs] = useState([]);

  // Añadir un registro al log
  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Cargar API al iniciar
  useEffect(() => {
    const savedGemini = localStorage.getItem('geminiKey');
    if (savedGemini) {
      setGeminiKey(savedGemini);
      addLog("[OK] API Key de Gemini cargada desde memoria.");
    } else {
      addLog("[WARN] Falta configurar tu API Key.");
    }
  }, []);

  // Auto-scroll en el chat
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Guardar configuración
  const saveSettings = () => {
    localStorage.setItem('geminiKey', geminiKey);
    setIsSaved(true);
    addLog("[INFO] Nueva API Key guardada.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Enviar mensaje a Gemini (Conexión Directa)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!geminiKey) {
      alert("⚠️ ¡Falta tu API Key! Ve a la pestaña ⚙️ APIs para guardarla primero.");
      setActiveTab('settings');
      return;
    }

    const userText = input;
    setInput("");
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);
    addLog("Enviando mensaje a Gemini...");

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const botReply = data.candidates[0].content.parts[0].text;
      setMessages([...newMessages, { role: 'assistant', content: botReply }]);
      addLog("[OK] Respuesta recibida con éxito.");
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
      addLog(`[ERROR] ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden">
      {/* HEADER */}
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10 shrink-0">
        <h1 className="font-bold text-xl tracking-tight text-blue-400">Tupia Agent</h1>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">🧠</div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-24 relative">
        
        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <span className="text-5xl block mb-4">🤖</span>
                <p className="font-bold text-gray-300">¡Listo para la acción!</p>
                <p className="text-sm mt-2">Asegúrate de haber puesto tu API Key en la pestaña de Ajustes.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-100 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-400 rounded-bl-none animate-pulse text-sm">
                  Pensando...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* AJUSTES */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2">🔑 API de Google Gemini</h2>
            
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <label className="block text-sm font-bold text-blue-400 mb-2">Pega tu API Key aquí:</label>
              <input 
                type="password" 
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>

            <button 
              onClick={saveSettings}
              className={`w-full font-bold py-4 px-4 rounded-xl transition-all ${isSaved ? 'bg-green-600' : 'bg-blue-600'}`}
            >
              {isSaved ? "✅ Guardado correctamente" : "💾 Guardar API Key"}
            </button>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">📋 Consola del Sistema</h2>
            <div className="bg-black flex-1 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-gray-800">
              {logs.map((log, i) => <p key={i} className="mb-2">{log}</p>)}
              <p className="animate-pulse mt-4">_</p>
            </div>
          </div>
        )}
      </main>

      {/* INPUT FORM (Solo en Chat) */}
      {activeTab === 'chat' && (
        <form onSubmit={handleSubmit} className="fixed bottom-[70px] left-0 w-full p-3 bg-gray-900 border-t border-gray-800 z-10">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="bg-blue-600 disabled:bg-gray-800 w-[50px] h-[50px] rounded-xl font-bold flex items-center justify-center">
              ➤
            </button>
          </div>
        </form>
      )}

      {/* NAVEGACIÓN MÓVIL */}
      <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around p-2 z-20 shrink-0 h-[70px]">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">💬</span><span className="text-[10px] font-bold">CHAT</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">⚙️</span><span className="text-[10px] font-bold">APIs</span>
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'logs' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">📋</span><span className="text-[10px] font-bold">LOGS</span>
        </button>
      </nav>
    </div>
  );
}
