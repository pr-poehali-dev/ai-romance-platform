import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Character, Message } from '@/pages/Index';

interface ProfilePageProps {
  messages: Message[];
  characters: Character[];
  hasSubscription: boolean;
  onNavigate: (page: 'gallery' | 'chat' | 'subscription' | 'profile') => void;
  onSelectCharacter: (character: Character) => void;
}

export default function ProfilePage({ 
  messages, 
  characters, 
  hasSubscription,
  onNavigate,
  onSelectCharacter 
}: ProfilePageProps) {
  const getCharacterMessages = (characterId: number) => {
    return messages.filter(m => m.characterId === characterId);
  };

  const chatHistory = characters
    .map(character => ({
      character,
      messages: getCharacterMessages(character.id),
      lastMessage: getCharacterMessages(character.id).slice(-1)[0]
    }))
    .filter(item => item.messages.length > 0)
    .sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0;
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-[#1a0a2e] to-dark">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      <header className="relative z-20 glass-effect border-b border-neon-purple/30 p-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => onNavigate('gallery')} 
              variant="ghost"
              className="hover:neon-glow-purple transition-all"
            >
              <Icon name="ArrowLeft" className="mr-2" />
              Галерея
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
              Профиль
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <div className="space-y-8">
          <Card className="glass-effect rounded-3xl p-8 border-2 border-neon-purple/30">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Статус аккаунта</h2>
                <p className="text-muted-foreground">
                  {hasSubscription 
                    ? 'Premium подписка активна' 
                    : 'Бесплатный доступ'}
                </p>
              </div>
              
              {hasSubscription ? (
                <div className="flex items-center gap-3 glass-effect px-6 py-3 rounded-2xl neon-glow-pink">
                  <Icon name="Crown" className="text-neon-pink" size={24} />
                  <span className="font-bold text-foreground">Premium</span>
                </div>
              ) : (
                <Button
                  onClick={() => onNavigate('subscription')}
                  className="bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 neon-glow-pink px-8 py-6 text-lg rounded-xl"
                >
                  <Icon name="Sparkles" className="mr-2" />
                  Получить Premium
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-foreground">История диалогов</h2>
              <div className="glass-effect px-4 py-2 rounded-full">
                <span className="text-sm text-muted-foreground">
                  Всего сообщений: <span className="text-neon-cyan font-bold">{messages.length}</span>
                </span>
              </div>
            </div>

            {chatHistory.length === 0 ? (
              <Card className="glass-effect rounded-3xl p-12 border-2 border-neon-purple/30 text-center">
                <div className="space-y-4">
                  <div className="text-6xl animate-float">💬</div>
                  <h3 className="text-2xl font-bold text-foreground">История пуста</h3>
                  <p className="text-muted-foreground">
                    Начните общение с AI-девушками, чтобы увидеть историю здесь
                  </p>
                  <Button
                    onClick={() => onNavigate('gallery')}
                    className="bg-gradient-to-r from-neon-purple to-neon-cyan hover:opacity-90 neon-glow-purple mt-4"
                  >
                    Перейти в галерею
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4">
                {chatHistory.map(({ character, messages: charMessages, lastMessage }) => (
                  <Card 
                    key={character.id}
                    className="glass-effect rounded-2xl p-6 border-2 border-neon-purple/30 hover:border-neon-pink/50 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                    onClick={() => {
                      onSelectCharacter(character);
                      onNavigate('chat');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={character.image} 
                          alt={character.name}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-neon-pink"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-dark"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-xl font-bold text-foreground">{character.name}</h3>
                          <span className="text-xs text-muted-foreground">
                            {lastMessage?.timestamp.toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage?.sender === 'user' ? 'Вы: ' : ''}{lastMessage?.text}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <div className="glass-effect px-3 py-1 rounded-full">
                          <span className="text-xs text-neon-cyan font-bold">
                            {charMessages.length}
                          </span>
                        </div>
                        <Icon name="ChevronRight" className="text-muted-foreground" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
