'use client'
import { useState } from "react";
import { Mic, Send } from "lucide-react";

export default function AIWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ text: "Hello! How can I help?", sender: "bot" }]);
  const [isRecording, setIsRecording] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" };
    setMessages([...messages, userMessage]);
    setInput("");

    // Simulating AI response (replace with actual API call)
    setTimeout(() => {
      setMessages((prev) => [...prev, { text: "This is an AI response!", sender: "bot" }]);
    }, 1000);
  };

  const handleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-5 right-5 w-80 bg-white shadow-lg rounded-2xl border p-4 flex flex-col">
      <div className="h-64 overflow-y-auto p-2 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg ${
              msg.sender === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black self-start"
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t pt-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-2 py-1 text-black"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button 
          className={`p-2 ${isRecording ? 'text-red-500' : 'text-black'}`} 
          onClick={handleVoiceRecording}
        >
          <Mic size={20} />
        </button>
        <button className="p-2" onClick={sendMessage}>
          <Send size={20} className="text-black" />
        </button>
      </div>
    </div>
  );
}
