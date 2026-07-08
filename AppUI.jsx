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
          <button onClick={handleCopy} className="hover:text-white transition-colors flex items-center gap-1">
            <span>📋</span> Copiar
          </button>
          <button onClick={handleDownload} className="hover:text-white transition-colors flex items-center gap-1">
            <span>💾</span> Bajar
          </button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto text-xs text-green-400 font-mono">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function AppUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]); // Nuevo estado para archivos
  
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('chat');
  const [isSaved, setIsSaved] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeModel, setActiveModel] = useState('gemini');

  const [keys, setKeys] = useState({
    gemini: '', openai: '', claude: '', deepseek: '', alibaba: '', nvidia: ''
  });

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

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
    addLog("[OK] Sistema Multi-IA con soporte de archivos cargado.");
  }, []);

  useEffect(() => {
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const saveSettings = () => {
    Object.entries(keys).forEach(([provider, key]) => {
      localStorage.setItem(`key_${provider}`, key);
    });
    setIsSaved(true);
    addLog("[INFO] Configuración de APIs actualizada.");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleKeyChange = (provider, value) => setKeys(prev => ({ ...prev, [provider]: value }));

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
        addLog(`[IMG] Imagen adjunta: ${file.name}`);
      } else {
        const text = await file.text();
        newAttachments.push({ type: 'text', name: file.name, data: text });
        addLog(`[DOC] Documento leído: ${file.name}`);
      }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    fileInputRef.current.value = ""; // Resetear input
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- RENDERIZADOR DE MENSAJES CON FORMATO ---
  const renderMessageContent = (text) => {
    // Separa el texto usando los bloques de código como delimitadores
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extrae el lenguaje y el código
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        if (match) {
          return <CodeBlock key={index} lang={match[1]} code={match[2]} />;
        }
        // Fallback por si el formato markdown es irregular
        return <CodeBlock key={index} lang="txt" code={part.slice(3, -3)} />;
      }
      // Renderiza texto normal respetando saltos de línea
      return <p key={index} className="whitespace-pre-wrap leading-relaxed">{part}</p>;
    });
  };

  // --- MOTOR DE ENVÍO MULTI-IA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const currentKey = keys[activeModel];
    if (!currentKey) {
      alert(`⚠️ Falta tu API Key para ${activeModel.toUpperCase()}! Ve a Ajustes.`);
      setActiveTab('settings');
      return;
    }

    // Preparar el texto final (uniendo el input con los archivos de texto)
    const textFiles = attachments.filter(a => a.type === 'text');
    let finalInput = input;
    if (textFiles.length > 0) {
      finalInput += "\n\n" + textFiles.map(a => `--- ARCHIVO: ${a.name} ---\n${a.data}\n--- FIN DE ARCHIVO ---`).join('\n\n');
    }

    const images = attachments.filter(a => a.type === 'image');
    
    // Guardar en UI
    const displayUserText = input + (attachments.length > 0 ? `\n[+ ${attachments.length} archivos adjuntos]` : '');
    const newMessages = [...messages, { role: 'user', content: displayUserText }];
    
    setMessages(newMessages);
    setInput("");
    setAttachments([]); // Limpiar adjuntos
    setIsLoading(true);
    addLog(`Conectando con ${activeModel.toUpperCase()}...`);

    try {
      let botReply = "";

      // 1. GEMINI (Soporta texto e imágenes)
      if (activeModel === 'gemini') {
        const parts = [{ text: finalInput }];
        images.forEach(img => {
          parts.push({ inline_data: { mime_type: img.mime, data: img.data.split(',')[1] } });
        });

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${currentKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts }] })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.candidates[0].content.parts[0].text;
      }
      
      // 2. CLAUDE (Soporta texto e imágenes)
      else if (activeModel === 'claude') {
        const content = [{ type: 'text', text: finalInput }];
        images.forEach(img => {
          content.push({ type: 'image', source: { type: 'base64', media_type: img.mime, data: img.data.split(',')[1] } });
        });

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': currentKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            messages: [{ role: 'user', content }]
          })
        });
        const data = await res.json();
        if (data.type === 'error') throw new Error(data.error.message);
        botReply = data.content[0].text;
      }

      // 3. MODELOS OPENAI Y COMPATIBLES
      else {
        let endpoint = '';
        let modelId = '';

        if (activeModel === 'openai') {
          endpoint = 'https://api.openai.com/v1/chat/completions';
          modelId = 'gpt-4o-mini';
        } else if (activeModel === 'deepseek') {
          endpoint = 'https://api.deepseek.com/chat/completions';
          modelId = 'deepseek-chat';
        } else if (activeModel === 'alibaba') {
          endpoint = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
          modelId = 'qwen-plus';
        } else if (activeModel === 'nvidia') {
          endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
          modelId = 'meta/llama3-70b-instruct';
        }

        // Construcción de Payload (DeepSeek, Alibaba y Nvidia a veces fallan con imágenes, así que enviamos solo texto para ellos, OpenAI sí soporta)
        let content = finalInput;
        if (activeModel === 'openai' && images.length > 0) {
          content = [{ type: 'text', text: finalInput }];
          images.forEach(img => content.push({ type: 'image_url', image_url: { url: img.data } }));
        } else if (images.length > 0) {
           addLog(`[WARN] Se ignoraron las imágenes porque ${activeModel.toUpperCase()} no soporta visión en esta configuración.`);
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content }]
          })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        botReply = data.choices[0].message.content;
      }

      setMessages([...newMessages, { role: 'assistant', content: botReply }]);
      addLog(`[OK] Respuesta de ${activeModel.toUpperCase()} recibida.`);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `❌ Error: ${error.message}` }]);
      addLog(`[ERROR] ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden">
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center z-10 shrink-0">
        <h1 className="font-bold text-xl tracking-tight text-blue-400">Tupia Multi-AI</h1>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-sm">🧠</div>
      </header>

      <main className="flex-1 overflow-y-auto pb-40 relative">
        
        {/* CHAT */}
        {activeTab === 'chat' && (
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10 bg-gray-900 border border-gray-800 p-6 rounded-2xl">
                <span className="text-5xl block mb-4">🌍</span>
                <p className="font-bold text-gray-300">Hub IA Inteligente</p>
                <p className="text-sm mt-2">Sube archivos, extrae código y domina todas las APIs.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-900 text-gray-100 border border-gray-700 rounded-bl-sm'}`}>
                  {msg.role === 'user' ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-400 rounded-bl-none animate-pulse text-sm">
                  {activeModel.toUpperCase()} está procesando...
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>
        )}

        {/* AJUSTES */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2">🔑 Bóveda de APIs</h2>
            {[
              { id: 'openai', name: 'OpenAI (GPT-4o)', color: 'text-green-400', border: 'focus:border-green-500' },
              { id: 'claude', name: 'Claude (Anthropic)', color: 'text-orange-400', border: 'focus:border-orange-500' },
              { id: 'gemini', name: 'Google Gemini', color: 'text-blue-400', border: 'focus:border-blue-500' },
              { id: 'deepseek', name: 'DeepSeek', color: 'text-purple-400', border: 'focus:border-purple-500' },
              { id: 'alibaba', name: 'Alibaba (Qwen)', color: 'text-yellow-400', border: 'focus:border-yellow-500' },
              { id: 'nvidia', name: 'Nvidia NIM (Llama 3)', color: 'text-emerald-400', border: 'focus:border-emerald-500' }
            ].map((provider) => (
              <div key={provider.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <label className={`block text-sm font-bold ${provider.color} mb-2`}>{provider.name}</label>
                <input 
                  type="password" 
                  className={`w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none transition-all ${provider.border}`}
                  placeholder="Pega tu API Key..."
                  value={keys[provider.id]}
                  onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                />
              </div>
            ))}
            <button onClick={saveSettings} className={`w-full font-bold py-4 px-4 rounded-xl transition-all shadow-lg ${isSaved ? 'bg-green-600' : 'bg-blue-600'}`}>
              {isSaved ? "✅ Todas las llaves guardadas" : "💾 Guardar Bóveda"}
            </button>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <div className="p-4 h-full flex flex-col">
            <h2 className="text-xl font-bold border-b border-gray-800 pb-2 mb-4">📋 Consola de Peticiones</h2>
            <div className="bg-black flex-1 rounded-xl p-4 font-mono text-xs text-green-400 overflow-y-auto border border-gray-800 pb-20">
              {logs.map((log, i) => <p key={i} className="mb-2">{log}</p>)}
              <p className="animate-pulse mt-4">_</p>
            </div>
          </div>
        )}
      </main>

      {/* INPUT FORM CON ARCHIVOS */}
      {activeTab === 'chat' && (
        <div className="fixed bottom-[70px] left-0 w-full bg-gray-900 border-t border-gray-800 z-10 p-2 flex flex-col gap-2">
          <select 
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            className="w-full bg-black border border-gray-700 text-xs text-gray-300 rounded-lg p-2 outline-none focus:border-blue-500"
          >
            <option value="openai">OpenAI (GPT-4o Mini)</option>
            <option value="claude">Claude 3.5 Sonnet</option>
            <option value="gemini">Google Gemini 1.5</option>
            <option value="deepseek">DeepSeek Chat</option>
            <option value="alibaba">Alibaba Qwen Plus</option>
            <option value="nvidia">Nvidia (Llama 3 70B)</option>
          </select>

          {/* PREVISUALIZACIÓN DE ADJUNTOS */}
          {attachments.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="bg-gray-800 text-xs text-gray-300 px-3 py-1 rounded-full flex items-center gap-2 whitespace-nowrap border border-gray-700">
                  <span>{file.type === 'image' ? '🖼️' : '📄'}</span>
                  <span className="max-w-[100px] truncate">{file.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="text-red-400 font-bold hover:text-red-300">X</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <button type="button" onClick={() => fileInputRef.current.click()} className="bg-gray-800 border border-gray-700 w-[50px] rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors">
              📎
            </button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            
            <input
              className="flex-1 bg-black border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe o adjunta..."
            />
            <button type="submit" disabled={(!input.trim() && attachments.length === 0) || isLoading} className="bg-blue-600 disabled:bg-gray-800 w-[50px] rounded-xl font-bold flex items-center justify-center text-white transition-colors">
              ➤
            </button>
          </form>
        </div>
      )}

      {/* NAVEGACIÓN MÓVIL */}
      <nav className="fixed bottom-0 left-0 w-full bg-gray-950 border-t border-gray-800 flex justify-around p-2 z-20 shrink-0 h-[70px]">
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">💬</span><span className="text-[10px] font-bold">CHAT</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">⚙️</span><span className="text-[10px] font-bold">BÓVEDA</span>
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center p-2 w-20 ${activeTab === 'logs' ? 'text-blue-500' : 'text-gray-500'}`}>
          <span className="text-xl">📋</span><span className="text-[10px] font-bold">LOGS</span>
        </button>
      </nav>
    </div>
  );
}
