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

// --- DEFINICIÓN DE PERSONAS (PROMPTS DEL SISTEMA) ---
const PERSONAS = {
  default: "Eres Tupia, un asistente de IA experto y amigable. Respondes de forma clara, directa y estructurada.",
  senior_dev: "Eres un Arquitecto de Software Senior. Tus respuestas son estrictamente técnicas, enfocadas en escalabilidad, buenas prácticas y seguridad. No usas saludos innecesarios. Muestras el código refactorizado y optimizado.",
  copywriter: "Eres un Copywriter experto en ventas y neuromarketing (estilo Gary Halbert). Tu objetivo es persuadir, usar gatillos mentales emocionales y escribir textos que conviertan prospectos en clientes.",
  sarcastic: "Eres una IA genio pero extremadamente sarcástica, irónica y algo pedante. Resuelves el problema perfectamente, pero siempre aprovechas para burlarte sutilmente de los humanos y su dependencia tecnológica."
};

// --- COMPONENTE PRINCIPAL ---
export default function AppUI() {
  const [messages, setMessages] = useState([]);
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

  // Cargar llaves y MEMORIA del chat al iniciar
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
    
    // Cargar historial de chat guardado
    const savedChat = localStorage.getItem('tupia_history');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
      addLog("[OK] Memoria del chat restaurada.");
    }
  }, []);

  // Guardar MEMORIA cada vez que los mensajes cambian
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('tupia_history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const saveSettings = () => {
    Object.entries(keys).forEach(([provider, key]) => localStorage.setItem(`key_${provider}`, key));
    setIsSaved(true);
    addLog("[INFO] APIs guardadas en la bóveda.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const clearMemory = () => {
    if (window.confirm("¿Seguro que quieres borrar el historial del chat?")) {
      setMessages([]);
      localStorage.removeItem('tupia_history');
      addLog("[INFO] Memoria borrada.");
    }
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
    
    // Solo mostramos el texto corto en UI para no saturar la pantalla con código fuente
    const displayUserText = input + (attachments.length > 0 ? `\n[+ ${attachments.length} archivos]` : '');
    const newMessages = [...messages, { role: 'user', content: displayUserText, rawContent: finalInput }];
    
    setMessages(newMessages);
    setInput(""); setAttachments([]); setIsLoading(true);
    addLog(`Enviando a ${activeModel.toUpperCase()} (Persona: ${activePersona})...`);

    // EXTRAER EL HISTORIAL RECIENTE PARA DARLE MEMORIA A LA IA (Últimos 10 mensajes)
    const history = messages.slice(-10).map(m => ({ role: m.role, content: m.rawContent || m.content }));
    const systemInstruction = PERSONAS[activePersona];

    try {
      let botReply = "";

      // 1. GEMINI
      if (activeModel === 'gemini') {
        // Mapear historial al formato de Gemini
        const geminiHistory = history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        
        const currentParts = [{ text: finalInput }];
        images.forEach(img => currentParts.push({ inline_data: { mime_type: img.mime, data: img.data.split(',')[1] } }));
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [...geminiHistory, { role: 'user', parts: currentParts }] 
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.candidates[0].content.parts[0].text;
      }
      
      // 2. CLAUDE
      else if (activeModel === 'claude') {
        const claudeHistory = history.map(m => ({ role: m.role, content: m.content }));
        const currentContent = [{ type: 'text', text: finalInput }];
        images.forEach(img => currentContent.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data.split(',')[1] } }));

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': currentKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620', max_tokens: 4096,
            system: systemInstruction, // Aquí inyectamos la Persona
            messages: [...claudeHistory, { role: 'user', content: currentContent }]
          })
        });
        const data = await res.json();
        if (data.type === 'error') throw new Error(data.error.message);
        botReply = data.content[0].text;
      }

      // 3. OPENAI Y COMPATIBLES (DeepSeek, Alibaba, Nvidia)
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
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'system', content: systemInstruction }, // Persona inyectada aquí
              ...standardHistory,
              { role: 'user', content: currentContent }
            ]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.choices[0].message.content;
      }

      setMessages([...newMessages, { role: 'assistant', content: botReply }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden">
      <header className="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10 shrink-0">
        <h1 className="font-bold text-xl tracking-tight text-blue-400">Tupia Multi-AI</h1>
        <button onClick={clearMemory} className="bg-red-900/30 text-red-400 border border-red-800/50 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-800/50">
          🗑️ Borrar Chat
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-48 relative">
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <span className="text-5xl block mb-4">🧠</span>
                <p className="font-bold text-gray-300">Memoria Activada</p>
                <p className="text-sm mt-2">Ahora recuerdo nuestra conversación aunque cierres la app.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-900 text-gray-100 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.role === 'user' ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && <div className="p-3 rounded-2xl bg-gray-800 text-gray-400 animate-pulse text-sm max-w-[50%]">Pensando...</div>}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* Pestañas de Ajustes y Logs permanecen igual */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2">🔑 Bóveda de APIs</h2>
            {['openai', 'claude', 'gemini', 'deepseek', 'alibaba', 'nvidia'].map((id) => (
              <div key={id} className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                <label className="block text-sm font-bold text-gray-300 mb-1 capitalize">{id}</label>
                <input type="password" value={keys[id]} onChange={(e) => setKeys(prev => ({...prev, [id]: e.target.value}))} className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white focus:border-blue-500 text-sm" placeholder="API Key..." />
              </div>
            ))}
            <button onClick={saveSettings} className={`w-full font-bold py-3 rounded-xl ${isSaved ? 'bg-green-600' : 'bg-blue-600'}`}>
              {isSaved ? "✅ Guardado" : "💾 Guardar"}
            </button>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">📋 Logs</h2>
            <div className="bg-black flex-1 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-gray-800 pb-20">
              {logs.map((log, i) => <p key={i} className="mb-2">{log}</p>)}
            </div>
          </div>
        )}
      </main>

      {/* CONTROLES DE CHAT (MODELO Y PERSONA) */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-[70px] left-0 w-full bg-gray-900 border-t border-gray-800 z-10 p-2 flex flex-col gap-2">
          <div className="flex gap-2">
            <select value={activeModel} onChange={(e) => setActiveModel(e.target.value)} className="w-1/2 bg-black border border-gray-700 text-xs text-blue-400 font-bold rounded-lg p-2 outline-none">
              <option value="openai">OpenAI</option>
              <option value="claude">Claude</option>
              <option value="gemini">Gemini</option>
              <option value="deepseek">DeepSeek</option>
              <option value="alibaba">Alibaba</option>
              <option value="nvidia">Nvidia</option>
            </select>
            <select value={activePersona} onChange={(e) => setActivePersona(e.target.value)} className="w-1/2 bg-black border border-gray-700 text-xs text-purple-400 font-bold rounded-lg p-2 outline-none">
              <option value="default">🗣️ Normal</option>
              <option value="senior_dev">💻 Programador Senior</option>
              <option value="copywriter">✍️ Copywriter Experto</option>
              <option value="sarcastic">🤖 IA Sarcástica</option>
            </select>
          </div>

          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="bg-gray-800 text-xs text-gray-300 px-3 py-1 rounded-full flex items-center border border-gray-700">
                  <span className="truncate max-w-[80px]">{file.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-red-400">X</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <button type="button" onClick={() => fileInputRef.current.click()} className="bg-gray-800 border border-gray-700 w-[50px] rounded-xl flex justify-center items-center">📎</button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <input className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Mensaje..." />
            <button type="submit" disabled={(!input.trim() && attachments.length===0) || isLoading} className="bg-blue-600 disabled:bg-gray-800 w-[50px] rounded-xl font-bold text-white">➤</button>
          </form>
        </div>
      )}

      {/* NAVEGACIÓN MÓVIL */}
      <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around p-2 z-20 h-[70px]">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center p-2 w-20 ${activeTab==='chat'?'text-blue-500':'text-gray-500'}`}><span className="text-xl">💬</span><span className="text-[10px] font-bold">CHAT</span></button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 w-20 ${activeTab==='settings'?'text-blue-500':'text-gray-500'}`}><span className="text-xl">⚙️</span><span className="text-[10px] font-bold">BÓVEDA</span></button>
        <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-2 w-20 ${activeTab==='logs'?'text-blue-500':'text-gray-500'}`}><span className="text-xl">📋</span><span className="text-[10px] font-bold">LOGS</span></button>
      </nav>
    </div>
  );
}
