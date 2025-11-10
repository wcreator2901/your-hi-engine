import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminSettings = () => {
  return (
    <div className="container-responsive py-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>
            System configuration and admin preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Admin settings feature temporarily simplified
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;