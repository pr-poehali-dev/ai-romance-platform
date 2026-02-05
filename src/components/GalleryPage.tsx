import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Character } from '@/pages/Index';

interface GalleryPageProps {
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  onNavigate: (page: 'gallery' | 'chat' | 'subscription' | 'profile') => void;
}

export default function GalleryPage({ characters, onSelectCharacter, onNavigate }: GalleryPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % characters.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-[#1a0a2e] to-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,0,110,0.15),transparent_50%)]"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent"></div>

      <header className="relative z-20 flex justify-between items-center p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
          AI ROMANCE
        </h1>
        <Button 
          onClick={() => onNavigate('profile')}
          variant="ghost" 
          className="glass-effect hover:neon-glow-cyan transition-all duration-300"
        >
          <Icon name="User" className="mr-2" />
          Профиль
        </Button>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-4">
        <div className="text-center mb-6 space-y-2">
          <h2 className="text-5xl font-bold text-foreground">Выбери свою мечту</h2>
          <p className="text-xl text-muted-foreground">Интимное общение с AI-девушками без границ</p>
        </div>

        <div className="relative flex items-center justify-center min-h-[600px] perspective-1000">
          <Button
            onClick={handlePrev}
            variant="ghost"
            size="icon"
            className="absolute left-0 z-30 glass-effect w-16 h-16 rounded-full neon-glow-purple hover:scale-110 transition-all duration-300"
          >
            <Icon name="ChevronLeft" size={32} />
          </Button>

          <div className="relative w-full max-w-md mx-16">
            {characters.map((character, index) => {
              const offset = index - activeIndex;
              const isActive = offset === 0;
              
              return (
                <Card
                  key={character.id}
                  className={`absolute top-0 left-1/2 -translate-x-1/2 w-full transition-all duration-500 ${
                    isActive 
                      ? 'z-20 scale-100 opacity-100' 
                      : 'z-10 scale-75 opacity-30 pointer-events-none'
                  }`}
                  style={{
                    transform: `translateX(calc(-50% + ${offset * 30}px)) scale(${isActive ? 1 : 0.75}) rotateY(${offset * 15}deg)`,
                  }}
                >
                  <div className="glass-effect rounded-3xl overflow-hidden border-2 border-neon-purple/30 hover:border-neon-pink/50 transition-all duration-300">
                    <div className="relative h-96 overflow-hidden">
                      <img 
                        src={character.image} 
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent"></div>
                      <div className="absolute top-4 right-4 glass-effect px-4 py-2 rounded-full">
                        <span className="text-neon-pink font-semibold">{character.age} лет</span>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <h3 className="text-3xl font-bold text-neon-pink">{character.name}</h3>
                      <p className="text-foreground leading-relaxed">{character.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon name="Sparkles" size={16} className="text-neon-purple" />
                        <span>{character.personality}</span>
                      </div>
                      
                      {isActive && (
                        <Button
                          onClick={() => onSelectCharacter(character)}
                          className="w-full bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-lg py-6 rounded-xl font-bold neon-glow-pink transition-all duration-300 hover:scale-105 animate-pulse-glow"
                        >
                          Начать общение
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="absolute right-0 z-30 glass-effect w-16 h-16 rounded-full neon-glow-purple hover:scale-110 transition-all duration-300"
          >
            <Icon name="ChevronRight" size={32} />
          </Button>
        </div>

        <div className="flex justify-center gap-2 mt-12">
          {characters.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'w-8 bg-neon-pink neon-glow-pink' 
                  : 'w-2 bg-muted hover:bg-neon-purple'
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}