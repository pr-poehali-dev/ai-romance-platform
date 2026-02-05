import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SubscriptionPageProps {
  onSubscribe: (plan: string) => void;
  onBack: () => void;
}

export default function SubscriptionPage({ onSubscribe, onBack }: SubscriptionPageProps) {
  const plans = [
    {
      id: 'flirt',
      name: 'Флирт',
      price: 990,
      icon: 'Heart',
      features: [
        'Доступ к одной девушке',
        'Безлимитные сообщения',
        'Доступ на 24 часа',
        'История диалогов'
      ],
      gradient: 'from-neon-purple to-neon-cyan',
      popular: false
    },
    {
      id: 'intimate',
      name: 'Интим',
      price: 1490,
      icon: 'Flame',
      features: [
        'Доступ ко всем девушкам',
        'Безлимитные сообщения',
        'Доступ на 24 часа',
        'Полная история диалогов',
        'Приоритетная поддержка'
      ],
      gradient: 'from-neon-pink to-neon-purple',
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-[#1a0a2e] to-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      <header className="relative z-20 p-6">
        <Button 
          onClick={onBack} 
          variant="ghost"
          className="glass-effect hover:neon-glow-purple transition-all"
        >
          <Icon name="ArrowLeft" className="mr-2" />
          Назад
        </Button>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-16 space-y-4 animate-fade-in">
          <div className="text-6xl mb-4 animate-float">💎</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
            Премиум доступ
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Выбери тариф и наслаждайся безграничным общением с AI-девушками
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative glass-effect rounded-3xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-neon-pink shadow-[0_0_40px_rgba(255,0,110,0.3)]' 
                  : 'border-neon-purple/30 hover:border-neon-purple'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-neon-pink to-neon-purple px-6 py-2 text-sm font-bold rounded-bl-2xl">
                  ПОПУЛЯРНЫЙ
                </div>
              )}
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center neon-glow-pink`}>
                    <Icon name={plan.icon as any} size={32} />
                  </div>
                  
                  <div>
                    <h3 className="text-3xl font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-5xl font-bold bg-gradient-to-r from-neon-pink to-neon-purple bg-clip-text text-transparent">
                        {plan.price} ₽
                      </span>
                      <span className="text-muted-foreground">/24ч</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0`}>
                        <Icon name="Check" size={14} />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => onSubscribe(plan.id)}
                  className={`w-full py-6 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-neon-pink to-neon-purple neon-glow-pink'
                      : 'bg-gradient-to-r from-neon-purple to-neon-cyan neon-glow-purple'
                  }`}
                >
                  Выбрать {plan.name}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Icon name="Lock" size={16} className="text-neon-cyan" />
              <span>Безопасная оплата</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Shield" size={16} className="text-neon-purple" />
              <span>Конфиденциальность</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Zap" size={16} className="text-neon-pink" />
              <span>Мгновенная активация</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            Оплата обрабатывается через защищенный платежный шлюз platega.io. 
            Подписка активируется автоматически после успешной оплаты.
          </p>
        </div>
      </main>
    </div>
  );
}
