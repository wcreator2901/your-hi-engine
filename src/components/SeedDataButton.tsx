
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { seedSampleData } from '@/utils/seedData';

const SeedDataButton = () => {
  const [isCleaning, setIsCleaning] = useState(false);

  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      const success = await seedSampleData();
      if (success) {
        toast({
          title: "Success",
          description: "System cleanup completed successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to complete system cleanup. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during system cleanup.",
        variant: "destructive",
      });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <Button 
      onClick={handleCleanup} 
      disabled={isCleaning}
      variant="outline"
      size="sm"
    >
      <Trash2 className="w-4 h-4 mr-2" />
      {isCleaning ? 'Cleaning...' : 'System Cleanup'}
    </Button>
  );
};

export default SeedDataButton;
