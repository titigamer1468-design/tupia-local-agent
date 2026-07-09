import React, { useState, useRef, useEffect } from "react";

// --- COMPONENTE HIJO: BLOQUE DE CÓDIGO ---
const CodeBlock = ({ lang, code }) => {
  const handleCopy = () => navigator.clipboard.writeText(code.trim());
  const handleDownload = () => {
    const blob = new Blob([code.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codigo.${lang || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 bg-gray-950 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-xs font-bold text-gray-300 border-b border-gray-700">
        <span className="uppercase">{lang || 'TEXTO'}</span>
        <div className="flex gap-3">
          <button onClick={handleCopy} className="hover:text-white transition-colors flex items-center gap-1"><span>📋</span> Copiar</button>
          <button onClick={handleDownload} className="hover:text-white transition-colors flex items-center gap-1"><span>💾</span> Bajar</button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-xs text-green-400 font-mono">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

// --- DEFINICIÓN DE MODOS (PROMPTS DEL SISTEMA) ---
const PERSONAS = {
  default: "Eres Tupia, un asistente de IA experto y amigable. Respondes de forma clara, directa y estructurada.",
  build: "Eres Tupia MODO BUILD. Eres un Arquitecto de Software y Desarrollador Full-Stack de élite. Tu objetivo es ayudar al usuario a CONSTRUIR. Escribes código listo para producción, limpio, optimizado y sin errores. Si el usuario te pide una función, no des explicaciones largas, simplemente entrégale el bloque de código perfecto y dile cómo implementarlo.",
  plan: "Eres Tupia MODO PLAN. Eres un Estratega y Project Manager experto. No escribes código. Tu objetivo es desglosar ideas complejas en planes de acción paso a paso. Creas hojas de ruta, cronogramas, listas de requisitos y defines objetivos medibles (OKRs). Estructuras todo con listas, negritas y viñetas para máxima claridad.",
  youtube: "Eres Tupia MODO YOUTUBE. Eres un experto en retención de audiencia, el algoritmo de YouTube y redacción de guiones (estilo MrBeast o Ali Abdaal). Tu prioridad es crear Títulos Virales con alto CTR y Ganchos (Hooks) para los primeros 5 segundos del video que hagan imposible dejar de mirar. Estructuras los guiones manteniendo la atención del espectador.",
  infoproducto: "Eres Tupia MODO INFOPRODUCTO. Eres un experto en Marketing Digital, lanzamientos y creación de Cursos Online. Ayudas a estructurar temarios de alto valor percibido, definir promesas de transformación, crear ofertas irresistibles y redactar el copy persuasivo para la Landing Page de ventas.",
  senior_dev: "Eres un Arquitecto de Software Senior. Respuestas estrictamente técnicas, enfocadas en escalabilidad y seguridad. Cero saludos.",
  copywriter: "Eres un Copywriter experto en ventas y neuromarketing. Tu objetivo es persuadir y escribir textos que conviertan prospectos en clientes.",
  sarcastic: "Eres una IA genio pero extremadamente sarcástica e irónica. Resuelves el problema perfectamente, pero te burlas sutilmente de los humanos."
};

// --- COMPONENTE PRINCIPAL ---
export default function AppUI() {
  // Estado de Chats Múltiples
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]); 
  
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('chat');
  const [isSaved, setIsSaved] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Selectores
  const [activeModel, setActiveModel] = useState('openai');
  const [activePersona, setActivePersona] = useState('default');

  const [keys, setKeys] = useState({
    gemini: '', openai: '', claude: '', deepseek: '', alibaba: '', nvidia: ''
  });

  const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // Cargar llaves y CHATS al iniciar
  useEffect(() => {
    const loadedKeys = {
      gemini: localStorage.getItem('key_gemini') || '',
      openai: localStorage.getItem('key_openai') || '',
      claude: localStorage.getItem('key_claude') || '',
      deepseek: localStorage.getItem('key_deepseek') || '',
      alibaba: localStorage.getItem('key_alibaba') || '',
      nvidia: localStorage.getItem('key_nvidia') || ''
    };
    setKeys(loadedKeys);
    
    // Migración y Carga de Historial de Chats
    const savedChats = localStorage.getItem('tupia_chats');
    const oldHistory = localStorage.getItem('tupia_history'); // Por si viene de la versión anterior

    let parsedChats = [];
    if (savedChats) {
      parsedChats = JSON.parse(savedChats);
    } else if (oldHistory) {
      parsedChats = [{ id: Date.now().toString(), title: "Chat Anterior", messages: JSON.parse(oldHistory) }];
      localStorage.removeItem('tupia_history');
    }

    if (parsedChats.length > 0) {
      setChats(parsedChats);
      const savedCurrentId = localStorage.getItem('tupia_current_chat');
      setCurrentChatId(savedCurrentId && parsedChats.find(c => c.id === savedCurrentId) ? savedCurrentId : parsedChats[0].id);
      addLog("[OK] Sistema de Chats cargado.");
    } else {
      createNewChat();
    }
  }, []);

  // Guardar estado cada vez que los chats cambian
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem('tupia_chats', JSON.stringify(chats));
      if (currentChatId) localStorage.setItem('tupia_current_chat', currentChatId);
    }
  }, [chats, currentChatId]);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chats, currentChatId, activeTab]);

  // Funciones de Gestión de Chats
  const createNewChat = () => {
    const newId = Date.now().toString();
    setChats(prev => [{ id: newId, title: "Nuevo Chat", messages: [] }, ...prev]);
    setCurrentChatId(newId);
    setIsSidebarOpen(false);
  };

  const deleteChat = (id) => {
    if (window.confirm("¿Seguro que quieres borrar este chat?")) {
      const newChats = chats.filter(c => c.id !== id);
      if (newChats.length === 0) {
        const newId = Date.now().toString();
        setChats([{ id: newId, title: "Nuevo Chat", messages: [] }]);
        setCurrentChatId(newId);
      } else {
        setChats(newChats);
        if (currentChatId === id) setCurrentChatId(newChats[0].id);
      }
    }
  };

  const saveSettings = () => {
    Object.entries(keys).forEach(([provider, key]) => localStorage.setItem(`key_${provider}`, key));
    setIsSaved(true);
    addLog("[INFO] APIs guardadas en la bóveda.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  // --- GESTIÓN DE ARCHIVOS ---
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        await new Promise(res => reader.onload = () => {
          newAttachments.push({ type: 'image', name: file.name, mime: file.type, data: reader.result });
          res();
        });
      } else {
        const text = await file.text();
        newAttachments.push({ type: 'text', name: file.name, data: text });
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    fileInputRef.current.value = ""; 
  };

  // --- RENDERIZADOR ---
  const renderMessageContent = (text) => {
    if (typeof text !== 'string') return <p>Archivo procesado.</p>;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        return match ? <CodeBlock key={index} lang={match[1]} code={match[2]} /> : <CodeBlock key={index} lang="txt" code={part.slice(3, -3)} />;
      }
      return <p key={index} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
    });
  };

  // Helper para actualizar mensajes del chat actual
  const activeChat = chats.find(c => c.id === currentChatId) || { messages: [] };
  const currentMessages = activeChat.messages;

  const updateCurrentChatMessages = (newMsgs, newTitle = null) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
         return { ...chat, messages: newMsgs, title: newTitle || chat.title };
      }
      return chat;
    }));
  };

  // --- MOTOR DE ENVÍO CON MEMORIA Y PERSONAS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentKey = keys[activeModel];
    if (!currentKey) {
      alert(`⚠️ Falta tu API Key para ${activeModel.toUpperCase()}!`);
      setActiveTab('settings'); return;
    }

    const textFiles = attachments.filter(a => a.type === 'text');
    let finalInput = input;
    if (textFiles.length > 0) {
      finalInput += "\n\n" + textFiles.map(a => `--- ARCHIVO: ${a.name} ---\n${a.data}\n--- FIN DE ARCHIVO ---`).join('\n\n');
    }
    const images = attachments.filter(a => a.type === 'image');
    
    const displayUserText = input + (attachments.length > 0 ? `\n[+ ${attachments.length} archivos]` : '');
    const newMessages = [...currentMessages, { role: 'user', content: displayUserText, rawContent: finalInput }];
    
    // Generar título automático si es el primer mensaje
    let chatTitle = activeChat.title;
    if (currentMessages.length === 0 && input.trim() !== "") {
      chatTitle = input.substring(0, 30) + (input.length > 30 ? '...' : '');
    }

    updateCurrentChatMessages(newMessages, chatTitle);
    setInput(""); setAttachments([]); setIsLoading(true);
    addLog(`Enviando a ${activeModel.toUpperCase()} (Modo: ${activePersona})...`);

    const history = currentMessages.slice(-10).map(m => ({ role: m.role, content: m.rawContent || m.content }));
    const systemInstruction = PERSONAS[activePersona];

    try {
      let botReply = "";

      if (activeModel === 'gemini') {
        const geminiHistory = history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
        const currentParts = [{ text: finalInput }];
        images.forEach(img => currentParts.push({ inline_data: { mime_type: img.mime, data: img.data.split(',')[1] } }));
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ system_instruction: { parts: [{ text: systemInstruction }] }, contents: [...geminiHistory, { role: 'user', parts: currentParts }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.candidates[0].content.parts[0].text;
      }
      else if (activeModel === 'claude') {
        const claudeHistory = history.map(m => ({ role: m.role, content: m.content }));
        const currentContent = [{ type: 'text', text: finalInput }];
        images.forEach(img => currentContent.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data.split(',')[1] } }));

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': currentKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: 'claude-3-5-sonnet-20240620', max_tokens: 4096, system: systemInstruction, messages: [...claudeHistory, { role: 'user', content: currentContent }] })
        });
        const data = await res.json();
        if (data.type === 'error') throw new Error(data.error.message);
        botReply = data.content[0].text;
      }
      else {
        let endpoint = '', modelId = '';
        if (activeModel === 'openai') { endpoint = 'https://api.openai.com/v1/chat/completions'; modelId = 'gpt-4o-mini'; } 
        else if (activeModel === 'deepseek') { endpoint = 'https://api.deepseek.com/chat/completions'; modelId = 'deepseek-chat'; } 
        else if (activeModel === 'alibaba') { endpoint = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'; modelId = 'qwen-plus'; } 
        else if (activeModel === 'nvidia') { endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions'; modelId = 'meta/llama3-70b-instruct'; }

        let currentContent = finalInput;
        if (activeModel === 'openai' && images.length > 0) {
          currentContent = [{ type: 'text', text: finalInput }];
          images.forEach(img => currentContent.push({ type: 'image_url', image_url: { url: img.data } }));
        }
        const standardHistory = history.map(m => ({ role: m.role, content: m.content }));

        const res = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
          body: JSON.stringify({ model: modelId, messages: [{ role: 'system', content: systemInstruction }, ...standardHistory, { role: 'user', content: currentContent }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.choices[0].message.content;
      }

      updateCurrentChatMessages([...newMessages, { role: 'assistant', content: botReply }]);
    } catch (error) {
      updateCurrentChatMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden">
      
      {/* HEADER PRINCIPAL */}
      <header className="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="text-2xl text-gray-300 hover:text-white px-2 rounded hover:bg-gray-800 transition">
            ☰
          </button>
          <h1 className="font-bold text-lg tracking-tight text-blue-400">Tupia Workspace</h1>
        </div>
        <button onClick={createNewChat} className="bg-blue-600/30 text-blue-400 border border-blue-800/50 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-600 hover:text-white transition-colors">
          ➕ Nuevo
        </button>
      </header>

      {/* MENÚ LATERAL DE CHATS (SIDEBAR / DRAWER) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex animate-in fade-in duration-200">
          <div className="w-4/5 max-w-sm bg-gray-950 h-full border-r border-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <h2 className="font-bold text-lg text-white">Tus Chats</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {chats.map(chat => (
                <div key={chat.id} 
                  onClick={() => { setCurrentChatId(chat.id); setIsSidebarOpen(false); }}
                  className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-all ${chat.id === currentChatId ? 'bg-blue-900/40 border border-blue-500/50 text-blue-300' : 'hover:bg-gray-900 text-gray-400'}`}>
                  <span className="truncate flex-1 text-sm font-medium">{chat.title}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="text-gray-600 hover:text-red-400 ml-2 p-1">🗑️</button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-900">
              <button onClick={createNewChat} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all">
                ➕ Crear Nuevo Chat
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto pb-48 relative">
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {currentMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <span className="text-5xl block mb-4">🚀</span>
                <p className="font-bold text-gray-300">Lienzo en Blanco</p>
                <p className="text-sm mt-2">Selecciona un Modo de Trabajo abajo y comienza a crear.</p>
              </div>
            )}
            {currentMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-900 text-gray-100 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.role === 'user' ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && <div className="p-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-400 animate-pulse text-sm max-w-[50%]">Procesando...</div>}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* BÓVEDA DE APIS */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2">🔑 Bóveda de APIs</h2>
            {['openai', 'claude', 'gemini', 'deepseek', 'alibaba', 'nvidia'].map((id) => (
              <div key={id} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                <label className="block text-sm font-bold text-gray-300 mb-1 capitalize">{id}</label>
                <input type="password" value={keys[id]} onChange={(e) => setKeys(prev => ({...prev, [id]: e.target.value}))} className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 text-sm" placeholder="API Key..." />
              </div>
            ))}
            <button onClick={saveSettings} className={`w-full font-bold py-3 rounded-xl shadow-lg ${isSaved ? 'bg-green-600 shadow-green-900/50' : 'bg-blue-600 shadow-blue-900/50'}`}>
              {isSaved ? "✅ Guardado" : "💾 Guardar"}
            </button>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">📋 Logs de Sistema</h2>
            <div className="bg-black flex-1 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-gray-800 pb-20">
              {logs.map((log, i) => <p key={i} className="mb-2">{log}</p>)}
            </div>
          </div>
        )}
      </main>

      {/* CONTROLES DE CHAT (MODELO Y PERSONA) */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-[70px] left-0 w-full bg-gray-900 border-t border-gray-800 z-10 p-2 flex flex-col gap-2 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          <div className="flex gap-2">
            {/* SELECTOR DE IA */}
            <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)} className="w-2/5 bg-black border border-gray-700 text-xs text-blue-400 font-bold rounded-lg p-2 outline-none focus:border-blue-500">
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="alibaba">Alibaba</option>
              <option value="nvidia">Nvidia</option>
            </select>

            {/* SELECTOR DE MODOS (PERSONAS) */}
            <select value={activePersona} onChange={(e) => setActivePersona(e.target.value)} className="w-3/5 bg-black border border-gray-700 text-xs text-purple-400 font-bold rounded-lg p-2 outline-none focus:border-purple-500">
              <option value="default">🗣️ Modo Normal</option>
              <option value="build">🏗️ Modo Build</option>
              <option value="plan">🗺️ Modo Plan</option>
              <option value="youtube">▶️ Modo YouTube</option>
              <option value="infoproducto">📦 Modo Infoproducto</option>
              <option value="senior_dev">💻 Dev Senior</option>
              <option value="copywriter">✍️ Copywriter</option>
            </select>
          </div>

          {/* PREVISUALIZADOR DE ARCHIVOS ADJUNTOS */}
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="bg-gray-800 text-xs text-gray-300 px-3 py-1 rounded-full flex items-center border border-gray-700">
                  <span className="truncate max-w-[80px]">{file.name}</span>
                  <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-red-400 hover:text-red-300 font-bold">X</button>
                </div>
              ))}
            </div>
          )}

          {/* BARRA DE ESCRITURA */}
          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <button type="button" onClick={() => fileInputRef.current.click()} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 w-[50px] rounded-xl flex justify-center items-center transition">📎</button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <input className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm transition" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Instrucción..." />
            <button type="submit" disabled={(!input.trim() && attachments.length===0) || isLoading} className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 w-[50px] rounded-xl font-bold text-white transition">➤</button>
          </form>
        </div>
      )}

      {/* NAVEGACIÓN MÓVIL INFERIOR */}
      <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around p-2 z-20 h-[70px]">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center p-2 w-20 transition-colors ${activeTab==='chat'?'text-blue-500':'text-gray-500 hover:text-gray-400'}`}><span className="text-xl">💬</span><span className="text-[10px] font-bold">CHAT</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 w-20 transition-colors ${activeTab==='settings'?'text-blue-500':'text-gray-500 hover:text-gray-400'}`}><span className="text-xl">⚙️</span><span className="text-[10px] font-bold">BÓVEDA</span></button>
        <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-2 w-20 transition-colors ${activeTab==='logs'?'text-blue-500':'text-gray-500 hover:text-gray-400'}`}><span className="text-xl">📋</span><span className="text-[10px] font-bold">LOGS</span></button>
      </nav>
    </div>
  );
}
