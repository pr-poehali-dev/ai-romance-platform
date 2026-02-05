import { Button } from '@/components/ui/button';

interface AgeGateProps {
  onVerify: () => void;
}

export default function AgeGate({ onVerify }: AgeGateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark via-[#1a0a2e] to-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,0,110,0.1),transparent_50%)]"></div>
      
      <div className="relative z-10 glass-effect p-12 rounded-3xl max-w-lg text-center space-y-6 neon-glow animate-fade-in">
        <div className="text-6xl mb-4">🔞</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent">
          AI ROMANCE
        </h1>
        <div className="space-y-4 text-lg text-muted-foreground">
          <p className="font-semibold text-foreground">Контент для взрослых 18+</p>
          <p>Этот сайт содержит материалы откровенного характера, предназначенные исключительно для совершеннолетних пользователей.</p>
          <p className="text-sm">Продолжая, вы подтверждаете, что вам исполнилось 18 лет.</p>
        </div>
        <Button 
          onClick={onVerify}
          className="w-full bg-gradient-to-r from-neon-pink to-neon-purple hover:opacity-90 text-lg py-6 rounded-xl font-bold neon-glow-pink transition-all duration-300 hover:scale-105"
        >
          Мне есть 18 лет
        </Button>
        <p className="text-xs text-muted-foreground">
          Нажимая кнопку, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}
