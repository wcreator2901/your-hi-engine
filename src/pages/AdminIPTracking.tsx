
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe, Eye, Clock, Monitor, AlertTriangle, Ban, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LoginTracking {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  login_status: string;
  login_timestamp: string;
}

interface VisitorActivity {
  id: string;
  session_id: string;
  user_id: string | null;
  ip_address: string;
  page_url: string;
  page_title: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  timestamp: string;
  duration_seconds: number | null;
}

interface IPBlock {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_at: string;
  is_active: boolean;
}

export default function AdminIPTracking() {
  const queryClient = useQueryClient();

  const { data: loginData, refetch: refetchLogin } = useQuery({
    queryKey: ['login-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_login_tracking')
        .select('*')
        .order('login_timestamp', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as LoginTracking[];
    }
  });

  const { data: visitorData, refetch: refetchVisitor } = useQuery({
    queryKey: ['visitor-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visitor_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as VisitorActivity[];
    }
  });

  const { data: blockedIPs, refetch: refetchBlocked } = useQuery({
    queryKey: ['blocked-ips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ip_blocks')
        .select('*')
        .eq('is_active', true)
        .order('blocked_at', { ascending: false });
      if (error) throw error;
      return data as IPBlock[];
    }
  });

  const handleRefresh = () => {
    refetchLogin();
    refetchVisitor();
    refetchBlocked();
    toast({ title: 'Refreshed', description: 'Data updated successfully', duration: 1000 });
  };

  const blockIPMutation = useMutation({
    mutationFn: async ({ ip, reason }: { ip: string; reason: string }) => {
      const { error } = await supabase
        .from('ip_blocks')
        .insert({
          ip_address: ip,
          reason: reason,
          blocked_by: (await supabase.auth.getUser()).data.user?.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'IP blocked successfully', duration: 1000 });
      queryClient.invalidateQueries({ queryKey: ['blocked-ips'] });
    }
  });

  const totalPageViews = visitorData?.length || 0;
  const uniqueIPs = new Set([...(loginData?.map(l => l.ip_address) || []), ...(visitorData?.map(v => v.ip_address) || [])]).size;
  const uniqueSessions = new Set(visitorData?.map(v => v.session_id)).size;

  return (
    <div className="w-full max-w-none -m-3 sm:-m-4 md:-m-6 lg:-m-8 p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white">Security & Visitor Intelligence</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="gap-2 text-white border-white/20 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      <p className="text-white/70 mb-8">Comprehensive tracking of all website activity</p>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-8 w-full">
          <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white"><Eye className="w-4 h-4" />Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalPageViews}</div>
              <p className="text-xs text-white/60">{uniqueSessions} sessions</p>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white"><Globe className="w-4 h-4" />Unique IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{uniqueIPs}</div>
            </CardContent>
          </Card>
          <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-white"><AlertTriangle className="w-4 h-4" />Blocked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{blockedIPs?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="visitors" className="w-full">
          <TabsList className="bg-[hsl(var(--muted))] border border-white/10 mb-6">
            <TabsTrigger value="visitors">Visitor Activity</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="blocked">Blocked IPs</TabsTrigger>
          </TabsList>

          <TabsContent value="visitors" className="mt-6 w-full">
            <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
              <CardHeader>
                <CardTitle className="text-white">All Visitor Activity</CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-white/10">
                      <TableHead className="text-white/70">Time</TableHead>
                      <TableHead className="text-white/70">Page</TableHead>
                      <TableHead className="text-white/70">IP</TableHead>
                      <TableHead className="text-white/70">Location</TableHead>
                      <TableHead className="text-white/70">Device</TableHead>
                      <TableHead className="text-white/70">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorData?.map((v) => (
                      <TableRow key={v.id} className="border-white/10">
                        <TableCell className="text-white text-xs">{format(new Date(v.timestamp), 'MMM dd HH:mm')}</TableCell>
                        <TableCell className="text-white text-xs">{v.page_url}</TableCell>
                        <TableCell className="font-mono text-white text-xs">{v.ip_address}</TableCell>
                        <TableCell className="text-white text-xs">{v.city}, {v.country}</TableCell>
                        <TableCell className="text-white text-xs">{v.device_type}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 h-7" onClick={() => {
                            const r = prompt('Block IP? Reason:');
                            if (r) blockIPMutation.mutate({ ip: v.ip_address, reason: r });
                          }}><Ban className="w-3 h-3" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="mt-6 w-full">
            <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
              <CardHeader>
                <CardTitle className="text-white">User Sessions</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                <div className="space-y-4 w-full">
                  {visitorData && Object.entries(visitorData.reduce((acc, a) => {
                    if (!acc[a.session_id]) acc[a.session_id] = [];
                    acc[a.session_id].push(a);
                    return acc;
                  }, {} as Record<string, VisitorActivity[]>)).slice(0, 20).map(([sid, acts]) => {
                    const first = acts[0];
                    return (
                      <div key={sid} className="border border-white/10 rounded-lg p-4 bg-white/5 w-full">
                        <div className="flex justify-between mb-2">
                          <div className="text-sm text-white"><Monitor className="w-4 h-4 inline mr-1" />{first.device_type} • {first.browser}</div>
                          <Button size="sm" variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20" onClick={() => {
                            const r = prompt('Block IP?');
                            if (r) blockIPMutation.mutate({ ip: first.ip_address, reason: r });
                          }}><Ban className="w-4 h-4" /></Button>
                        </div>
                        <div className="text-xs text-white/60 mb-3"><MapPin className="w-3 h-3 inline mr-1" />{first.city}, {first.country} • {first.ip_address} • {acts.length} pages</div>
                        <div className="space-y-1 pl-4 border-l-2 border-primary/20">
                          {acts.map(a => (
                            <div key={a.id} className="text-xs text-white/70">{format(new Date(a.timestamp), 'HH:mm')} → {a.page_url}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="mt-6 w-full">
            <Card className="bg-[hsl(var(--muted))] border-white/10 w-full">
              <CardHeader>
                <CardTitle className="text-white">Blocked IPs ({blockedIPs?.length || 0})</CardTitle>
              </CardHeader>
              <CardContent className="w-full">
                {blockedIPs?.map(b => (
                  <div key={b.id} className="flex justify-between p-3 bg-white/5 rounded mb-2 w-full">
                    <div>
                      <p className="font-mono text-white">{b.ip_address}</p>
                      <p className="text-sm text-white/60">{b.reason}</p>
                    </div>
                    <Badge variant="destructive">Blocked</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
