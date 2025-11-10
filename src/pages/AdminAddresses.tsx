import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminAddresses = () => {
  return (
    <div className="container-responsive py-6">
      <Card>
        <CardHeader>
          <CardTitle>Address Management</CardTitle>
          <CardDescription>
            Manage deposit addresses for all users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Address management feature temporarily disabled - deposit addresses table not implemented yet
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAddresses;