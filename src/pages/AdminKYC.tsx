import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Check, X, FileText, Download, ImageIcon, Bell, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  address: string;
  front_document_url: string | null;
  back_document_url: string | null;
  front_document_name: string | null;
  back_document_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  reviewed_by: string | null;
  review_notes: string | null;
}

const AdminKYC = () => {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KycSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isReviewing, setIsReviewing] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Direct query using any type to bypass TypeScript checking
      let query = (supabase as any)
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching KYC submissions:', error);
        toast({
          title: "Error", 
          description: "Failed to fetch KYC submissions",
          variant: "destructive",
        });
        return;
      }

      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching KYC submissions:', error);
      // For now, set empty array since table might not exist yet
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (submissionId: string, newStatus: 'approved' | 'rejected') => {
    if (!selectedSubmission) return;

    setIsReviewing(true);
    try {
      // Get current user info for reviewed_by field
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await (supabase as any)
        .from('kyc_submissions')
        .update({
          status: newStatus,
          review_notes: reviewNotes || null,
          reviewed_by: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating KYC submission:', error);
        toast({
          title: "Error",
          description: "Failed to update submission status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `KYC submission ${newStatus} successfully`,
        duration: 1000,
      });

      setSelectedSubmission(null);
      setReviewNotes('');
      fetchSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDelete = async (submissionId: string, fullName: string) => {
    if (!confirm(`Are you sure you want to delete the KYC submission for ${fullName}?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('kyc_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) {
        console.error('Error deleting KYC submission:', error);
        toast({
          title: "Error",
          description: "Failed to delete submission",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "KYC submission deleted successfully",
        duration: 1000,
      });

      fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const viewDocument = async (url: string, filename: string) => {
    try {
      // Extract the file path from the URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('kyc-documents') + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        });
        return;
      }

      setViewingDocument({ url: data.signedUrl, name: filename });
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const downloadDocument = async (url: string, filename: string) => {
    try {
      // Extract the file path from the URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('kyc-documents') + 1).join('/');
      
      const { data, error } = await supabase.storage
        .from('kyc-documents')
        .download(filePath);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to download document",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="container-responsive py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold mb-2">KYC Management</CardTitle>
              <CardDescription className="text-base font-semibold">
                Manage user KYC submissions and verifications
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="status-filter" className="font-medium">Filter by KYC Status:</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter" className="w-36 bg-black text-white border-white/20 hover:bg-black/90">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black text-white border-white/20">
                    <SelectItem value="all" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">All</SelectItem>
                    <SelectItem value="pending" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">Pending</SelectItem>
                    <SelectItem value="approved" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">Approved</SelectItem>
                    <SelectItem value="rejected" className="hover:bg-white/10 focus:bg-white/10 focus:text-white">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No KYC submissions found</p>
              <p className="text-sm text-muted-foreground">New verifications will appear here as users apply.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="border">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{submission.full_name}</h3>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Phone: {submission.phone_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                              className="text-white border-white/20 hover:bg-white/10"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#18191A] text-white border-white/20">
                            <DialogHeader>
                              <DialogTitle className="text-white">KYC Submission Review</DialogTitle>
                              <DialogDescription className="text-white/80">
                                Review and approve/reject this KYC submission
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedSubmission && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-white">Full Name</Label>
                                    <p className="text-sm font-medium text-white">{selectedSubmission.full_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-white">Phone Number</Label>
                                    <p className="text-sm font-medium text-white">{selectedSubmission.phone_number}</p>
                                  </div>
                                  <div className="col-span-2">
                                    <Label className="text-white">Address</Label>
                                    <p className="text-sm font-medium text-white">{selectedSubmission.address}</p>
                                  </div>
                                  <div>
                                    <Label className="text-white">Status</Label>
                                    <div className="mt-1">
                                      {getStatusBadge(selectedSubmission.status)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-white">Submitted</Label>
                                    <p className="text-sm font-medium text-white">
                                      {new Date(selectedSubmission.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <Label className="text-white">Documents</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedSubmission.front_document_url && (
                                      <div className="space-y-2">
                                        <Button
                                          variant="outline"
                                          className="justify-start w-full text-white border-white/20 hover:bg-white/10"
                                          onClick={() => viewDocument(
                                            selectedSubmission.front_document_url!,
                                            selectedSubmission.front_document_name || 'front-document'
                                          )}
                                        >
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          View Front Document
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="justify-start w-full text-white hover:bg-white/10"
                                          onClick={() => downloadDocument(
                                            selectedSubmission.front_document_url!,
                                            selectedSubmission.front_document_name || 'front-document'
                                          )}
                                        >
                                          <Download className="w-3 h-3 mr-2" />
                                          Download
                                        </Button>
                                      </div>
                                    )}
                                    {selectedSubmission.back_document_url && (
                                      <div className="space-y-2">
                                        <Button
                                          variant="outline"
                                          className="justify-start w-full text-white border-white/20 hover:bg-white/10"
                                          onClick={() => viewDocument(
                                            selectedSubmission.back_document_url!,
                                            selectedSubmission.back_document_name || 'back-document'
                                          )}
                                        >
                                          <ImageIcon className="w-4 h-4 mr-2" />
                                          View Back Document
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="justify-start w-full text-white hover:bg-white/10"
                                          onClick={() => downloadDocument(
                                            selectedSubmission.back_document_url!,
                                            selectedSubmission.back_document_name || 'back-document'
                                          )}
                                        >
                                          <Download className="w-3 h-3 mr-2" />
                                          Download
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {selectedSubmission.review_notes && (
                                  <div>
                                    <Label className="text-white">Previous Review Notes</Label>
                                    <p className="text-sm bg-muted p-3 rounded mt-1 text-white">
                                      {selectedSubmission.review_notes}
                                    </p>
                                  </div>
                                )}

                                <div>
                                  <Label htmlFor="review-notes" className="text-white">Review Notes (Optional)</Label>
                                  <Textarea
                                    id="review-notes"
                                    placeholder="Add notes about your decision..."
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    className="mt-1 bg-[#18191A] text-white border-white/20 placeholder:text-white/50"
                                  />
                                </div>

                                {selectedSubmission.status === 'pending' && (
                                  <div className="flex gap-3 pt-4">
                                    <Button
                                      onClick={() => handleReview(selectedSubmission.id, 'approved')}
                                      disabled={isReviewing}
                                      className="flex-1 bg-primary hover:bg-primary/90"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => handleReview(selectedSubmission.id, 'rejected')}
                                      disabled={isReviewing}
                                      variant="destructive"
                                      className="flex-1"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(submission.id, submission.full_name)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#18191A] text-white border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">{viewingDocument.name}</DialogTitle>
              <DialogDescription className="text-white/80">
                KYC Document Viewer
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={viewingDocument.url} 
                alt={viewingDocument.name}
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '70vh' }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminKYC;