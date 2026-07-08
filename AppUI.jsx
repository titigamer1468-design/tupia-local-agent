import React, { useState, useRef } from "react";
import { useChat } from "ai/react";

export default function AppUI() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const chatBottomRef = useRef(null);

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      {/* Header Fijo */}
      <header className="p-4 bg-gray-900 border-b border-gray-800 flex justify-between items-center">
        <h1 className="font-bold text-xl tracking-tight">Tupia Agent</h1>
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">AI</div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Fijo Abajo (Tipo móvil) */}
      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full p-2 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 rounded-full px-4 py-3 outline-none"
            value={input}
            onChange={handleInputChange}
            placeholder="Mensaje..."
          />
          <button type="submit" className="bg-blue-600 w-12 h-12 rounded-full font-bold">➤</button>
        </div>
      </form>
    </div>
  );
}
