
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, ExternalLink, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinchPayWidgetProps {
  amount?: number;
  currency?: string;
  cryptocurrency?: string;
  onSuccess?: () => void;
  onError?: () => void;
}

const FinchPayWidget: React.FC<FinchPayWidgetProps> = ({
  amount = 100,
  currency = 'USD',
  cryptocurrency = 'ETH',
  onSuccess,
  onError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  const widgetUrl = `https://widget.finchpay.io/?a=${amount}&p=${currency}&c=${cryptocurrency}`;

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleOpenExternal = () => {
    window.open(widgetUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
            size={isMobile ? "sm" : "default"}
          >
            <CreditCard className="w-4 h-4" />
            Buy with Finch Pay
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 py-3 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Finch Pay - Buy {cryptocurrency} with {currency}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open in new tab
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading Finch Pay widget...</p>
                </div>
              </div>
            )}
            
            <iframe
              src={widgetUrl}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              title="Finch Pay Widget"
              allow="payment"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ display: 'block' }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinchPayWidget;
