import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  variant?: 'button' | 'switch';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  size = 'md',
  showLabel = true 
}) => {
  const { theme, toggleTheme, setTheme } = useTheme();

  if (variant === 'switch') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-primary" />
          {showLabel && <span className="text-sm font-medium text-foreground">Light</span>}
        </div>
        
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 ${
            theme === 'dark' ? 'bg-primary' : 'bg-muted'
          }`}
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="Toggle theme"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-lg transition-transform duration-300 ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-primary" />
          {showLabel && <span className="text-sm font-medium text-foreground">Dark</span>}
        </div>
      </div>
    );
  }

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  const buttonSize = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  }[size] as 'sm' | 'default' | 'lg';

  return (
    <Button
      variant="outline"
      size={buttonSize}
      onClick={toggleTheme}
      className="gap-2 bg-card/50 border-border hover:bg-muted/50 backdrop-blur-sm transition-all duration-300"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? (
        <Moon className={iconSize} />
      ) : (
        <Sun className={iconSize} />
      )}
      {showLabel && (
        <span className="text-sm font-medium">
          {theme === 'light' ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </Button>
  );
};