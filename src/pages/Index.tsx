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

  const handleSendMessage = async (text: string) => {
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

    try {
      const response = await fetch('https://functions.poehali.dev/a844796a-e16f-427c-ac64-59a46aefbfa8', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          message: text
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        characterId: selectedCharacter.id,
        text: data.response || 'Прости, произошла ошибка... Попробуй ещё раз 😘',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        characterId: selectedCharacter.id,
        text: 'Ой, что-то пошло не так... Попробуй написать мне ещё раз 😉',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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