import { useState } from 'react';
import AgeGate from '@/components/AgeGate';
import GalleryPage from '@/components/GalleryPage';
import ChatPage from '@/components/ChatPage';
import SubscriptionPage from '@/components/SubscriptionPage';
import ProfilePage from '@/components/ProfilePage';

export type Character = {
  id: number;
  name: string;
  age: number;
  image: string;
  description: string;
  personality: string;
};

export type Message = {
  id: number;
  characterId: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

export default function Index() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [currentPage, setCurrentPage] = useState<'gallery' | 'chat' | 'subscription' | 'profile'>('gallery');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [freeMessagesLeft, setFreeMessagesLeft] = useState(10);
  const [hasSubscription, setHasSubscription] = useState(false);

  const characters: Character[] = [
    {
      id: 1,
      name: 'София',
      age: 23,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      description: 'Страстная и раскрепощённая. Люблю откровенные разговоры и флирт без границ.',
      personality: 'Дерзкая, игривая, обожает комплименты и смелые фантазии'
    },
    {
      id: 2,
      name: 'Алиса',
      age: 25,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      description: 'Нежная, но с характером. Готова на всё, чтобы ты был доволен.',
      personality: 'Романтичная, чувственная, любит медленное соблазнение'
    },
    {
      id: 3,
      name: 'Виктория',
      age: 22,
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      description: 'Доминантная красотка. Люблю брать контроль и играть по своим правилам.',
      personality: 'Властная, уверенная, обожает ролевые игры'
    },
    {
      id: 4,
      name: 'Кристина',
      age: 24,
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
      description: 'Милая и послушная. Хочу радовать тебя и выполнять все желания.',
      personality: 'Покорная, нежная, любит угождать'
    }
  ];

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacter(character);
    setCurrentPage('chat');
  };

  const handleSendMessage = (text: string) => {
    if (!selectedCharacter) return;
    
    if (freeMessagesLeft <= 0 && !hasSubscription) {
      setCurrentPage('subscription');
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      characterId: selectedCharacter.id,
      text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    if (!hasSubscription) {
      setFreeMessagesLeft(prev => prev - 1);
    }

    setTimeout(() => {
      const responses = [
        `Привет, красавчик 😘 ${text.length > 20 ? 'Мне нравится, что ты так общителен...' : ''}`,
        `Мммм, интересно... расскажи мне больше 💋`,
        `Ты такой смелый 🔥 Продолжай...`,
        `О боже, ты меня заводишь 😏`,
        `Хочу узнать тебя ближе... намного ближе 💕`
      ];
      const aiMessage: Message = {
        id: Date.now() + 1,
        characterId: selectedCharacter.id,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1200);
  };

  const handleSubscribe = (plan: string) => {
    setHasSubscription(true);
    setCurrentPage('chat');
  };

  if (!ageVerified) {
    return <AgeGate onVerify={() => setAgeVerified(true)} />;
  }

  return (
    <>
      {currentPage === 'gallery' && (
        <GalleryPage 
          characters={characters} 
          onSelectCharacter={handleSelectCharacter}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === 'chat' && selectedCharacter && (
        <ChatPage 
          character={selectedCharacter}
          messages={messages.filter(m => m.characterId === selectedCharacter.id)}
          freeMessagesLeft={freeMessagesLeft}
          hasSubscription={hasSubscription}
          onSendMessage={handleSendMessage}
          onBack={() => setCurrentPage('gallery')}
          onNavigate={setCurrentPage}
        />
      )}
      {currentPage === 'subscription' && (
        <SubscriptionPage 
          onSubscribe={handleSubscribe}
          onBack={() => setCurrentPage(selectedCharacter ? 'chat' : 'gallery')}
        />
      )}
      {currentPage === 'profile' && (
        <ProfilePage 
          messages={messages}
          characters={characters}
          hasSubscription={hasSubscription}
          onNavigate={setCurrentPage}
          onSelectCharacter={handleSelectCharacter}
        />
      )}
    </>
  );
}
