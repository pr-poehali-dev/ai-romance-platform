import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import type { Character, Message } from '@/pages/Index';

interface ChatPageProps {
  character: Character;
  messages: Message[];
  freeMessagesLeft: number;
  hasSubscription: boolean;
  onSendMessage: (text: string) => void;
  onBack: () => void;
  onNavigate: (page: 'gallery' | 'chat' | 'subscription' | 'profile') => void;
}

export default function ChatPage({ 
  character, 
  messages, 
  freeMessagesLeft, 
  hasSubscription,
  onSendMessage, 
  onBack,
  onNavigate
}: ChatPageProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-dark via-[#1a0a2e] to-dark">
      <header className="glass-effect border-b border-neon-purple/30 p-4 flex items-center gap-4">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          size="icon"
          className="hover:neon-glow-purple transition-all"
        >
          <Icon name="ArrowLeft" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img 
              src={character.image} 
              alt={character.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-neon-pink"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark"></div>
          </div>
          <div>
            <h2 className="font-bold text-lg text-foreground">{character.name}</h2>
            <p className="text-sm text-muted-foreground">В сети</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!hasSubscription && (
            <div className="glass-effect px-4 py-2 rounded-full">
              <span className="text-sm">
                <span className="text-neon-cyan font-bold">{freeMessagesLeft}</span>
                <span className="text-muted-foreground"> бесплатных</span>
              </span>
            </div>
          )}
          <Button 
            onClick={() => onNavigate('subscription')}
            className="bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 neon-glow-pink"
          >
            <Icon name="Crown" className="mr-2" size={16} />
            Premium
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="text-6xl animate-float">💕</div>
            <h3 className="text-2xl font-bold text-foreground">Начни разговор с {character.name}</h3>
            <p className="text-muted-foreground max-w-md">
              {character.personality}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-6 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white neon-glow-pink'
                    : 'glass-effect text-foreground'
                }`}
              >
                <p className="text-base leading-relaxed">{message.text}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="glass-effect border-t border-neon-purple/30 p-4">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Напиши ${character.name}...`}
            className="flex-1 bg-muted/50 border-neon-purple/30 focus:border-neon-pink text-foreground placeholder:text-muted-foreground rounded-xl px-6 py-6 text-base"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="icon"
            className="w-14 h-14 bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 rounded-xl neon-glow-pink transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
