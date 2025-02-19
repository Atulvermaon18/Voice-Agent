'use client'
import { useState, useRef, useEffect } from "react";
import { Mic, Send, Minimize2, X, MessageCircle, Play, Square } from "lucide-react";

export default function AIWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ text: "Hello! How can I help?", sender: "bot" }]);
  const [isRecording, setIsRecording] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const audioRef = useRef(new Audio());

  // Initialize voices when component mounts
  useEffect(() => {
    const initVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        // Get all available voices
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Try to find a natural-sounding English voice
        const preferredVoice = voices.find(
          voice => 
            (voice.name.includes('Samantha') || // macOS
             voice.name.includes('Daniel') ||    // UK English
             voice.name.includes('Karen') ||     // Australian
             voice.name.includes('Google UK English Female') || // Chrome
             voice.name.includes('Microsoft Zira')) // Windows
            && voice.lang.startsWith('en')
        );

        setSelectedVoice(preferredVoice || voices[0]);
      }
    };

    // Initial load
    initVoices();

    // Handle dynamic voice loading
    window.speechSynthesis?.addEventListener('voiceschanged', initVoices);

    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', initVoices);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.error) {
        // Show error message as a bot message
        setMessages(prev => [...prev, { 
          text: data.error,
          sender: "bot",
          isError: true // Add this flag to style error messages differently
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: data.response,
          sender: "bot"
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        text: "Network error. Please check your connection and try again.",
        sender: "bot",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
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

  const handleSpeak = async (text) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Speech synthesis failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
    } catch (error) {
      console.error('Speech synthesis error:', error);
      setIsSpeaking(false);
    }
  };

  const handleStopSpeaking = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsSpeaking(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="w-96 bg-white shadow-xl rounded-lg border border-gray-200 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">AI Assistant</h3>
            <div className="flex gap-2">
              <button 
                className="p-1 hover:bg-gray-200 rounded"
                onClick={() => setIsOpen(false)}
              >
                <Minimize2 size={16} className="text-gray-600" />
              </button>
              <button 
                className="p-1 hover:bg-gray-200 rounded"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex flex-col">
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white rounded-br-none" 
                        : msg.isError
                          ? "bg-red-50 text-red-600 border border-red-200 rounded-bl-none"
                          : "bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  {/* Add speech button for bot messages */}
                  {msg.sender === "bot" && !msg.isError && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => isSpeaking ? handleStopSpeaking() : handleSpeak(msg.text)}
                        className="self-start mt-1 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                        title={isSpeaking ? "Stop speaking" : "Play message"}
                      >
                        {isSpeaking ? (
                          <Square size={14} className="fill-current" />
                        ) : (
                          <Play size={14} className="fill-current" />
                        )}
                      </button>
                      {isSpeaking && (
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-600 rounded-lg p-2 animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2">
              <input
                type="text"
                className="flex-1 bg-transparent border-none outline-none px-2 py-1 text-gray-800 placeholder-gray-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "Please wait..." : "Type your message..."}
                disabled={isLoading}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                className={`p-2 rounded-full hover:bg-gray-200 transition-colors ${
                  isRecording ? 'text-red-500' : 'text-gray-600'
                }`} 
                onClick={handleVoiceRecording}
                disabled={isLoading}
              >
                <Mic size={18} />
              </button>
              <button 
                className={`p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-600 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={sendMessage}
                disabled={isLoading}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
