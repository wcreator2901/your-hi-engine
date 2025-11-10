import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface FormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  frontDocument: File | null;
  backDocument: File | null;
}

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

const KYC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phoneNumber: '',
    address: '',
    frontDocument: null,
    backDocument: null,
  });
  const [hasSubmission, setHasSubmission] = useState(false);
  const [kycSubmission, setKycSubmission] = useState<KycSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [frontDocumentDragOver, setFrontDocumentDragOver] = useState(false);
  const [backDocumentDragOver, setBackDocumentDragOver] = useState(false);

  // Check for existing submission
  useEffect(() => {
    const checkExistingSubmission = async () => {
      if (!user) return;
      
      try {
        // Direct query using any type to bypass TypeScript checking
        const { data, error } = await (supabase as any)
          .from('kyc_submissions')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking KYC submission:', error);
          return;
        }
        
        if (data) {
          setKycSubmission(data);
          setHasSubmission(true);
        }
      } catch (error) {
        console.error('Error checking KYC submission:', error);
        // Table might not exist yet, continue normally
      } finally {
        setLoading(false);
      }
    };

    checkExistingSubmission();
  }, [user]);

  // Redirect to dashboard after submission
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-primary';
      case 'rejected':
        return 'text-red-400';
      case 'pending':
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Under Review';
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (field: 'frontDocument' | 'backDocument', file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload JPEG, PNG, or PDF files only.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleDragOver = (e: React.DragEvent, field: 'frontDocument' | 'backDocument') => {
    e.preventDefault();
    e.stopPropagation();
    if (field === 'frontDocument') {
      setFrontDocumentDragOver(true);
    } else {
      setBackDocumentDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent, field: 'frontDocument' | 'backDocument') => {
    e.preventDefault();
    e.stopPropagation();
    if (field === 'frontDocument') {
      setFrontDocumentDragOver(false);
    } else {
      setBackDocumentDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent, field: 'frontDocument' | 'backDocument') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (field === 'frontDocument') {
      setFrontDocumentDragOver(false);
    } else {
      setBackDocumentDragOver(false);
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(field, files[0]);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your address.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.frontDocument) {
      toast({
        title: "Validation Error",
        description: "Please upload the front of your ID document.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit KYC.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let frontDocumentUrl = null;
      let backDocumentUrl = null;

      // Upload front document
      if (formData.frontDocument) {
        const frontFileName = `${user.id}/front-${Date.now()}-${formData.frontDocument.name}`;
        const { data: frontData, error: frontError } = await supabase.storage
          .from('kyc-documents')
          .upload(frontFileName, formData.frontDocument);

        if (frontError) throw frontError;
        
        const { data: frontUrlData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(frontFileName);
        
        frontDocumentUrl = frontUrlData.publicUrl;
      }

      // Upload back document if provided
      if (formData.backDocument) {
        const backFileName = `${user.id}/back-${Date.now()}-${formData.backDocument.name}`;
        const { data: backData, error: backError } = await supabase.storage
          .from('kyc-documents')
          .upload(backFileName, formData.backDocument);

        if (backError) throw backError;
        
        const { data: backUrlData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(backFileName);
        
        backDocumentUrl = backUrlData.publicUrl;
      }

      // Create KYC submission record
      const { data: kycData, error: kycError } = await (supabase as any)
        .from('kyc_submissions')
        .insert({
          user_id: user.id,
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          address: formData.address,
          front_document_url: frontDocumentUrl,
          back_document_url: backDocumentUrl,
          front_document_name: formData.frontDocument?.name || null,
          back_document_name: formData.backDocument?.name || null,
          status: 'pending'
        })
        .select()
        .single();

      if (kycError) {
        console.error('Error creating KYC submission:', kycError);
        toast({
          title: "Submission Error",
          description: "There was an error submitting your KYC. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (kycData) {
        setKycSubmission(kycData);
        setHasSubmission(true);
      }
      setSubmitted(true);
      toast({
        title: "KYC Submitted Successfully",
        description: "Your KYC verification has been submitted and is under review.",
        duration: 2000,
      });

    } catch (error) {
      console.error('KYC submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was an error submitting your KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container-responsive py-6">
        <Card className="bg-[#18191A] border-white/15">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message after submission
  if (submitted) {
    return (
      <div className="container-responsive py-6">
        <Card className="bg-[#18191A] border-white/15">
          <CardContent className="pt-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">KYC Verification</h2>
            <h3 className="text-xl font-semibold text-primary mb-4">Submitted Successfully!</h3>
            <p className="text-white mb-4">
              Your information is safe with us. Your KYC verification is now under review.
            </p>
            <p className="text-sm text-white/80">
              You will be redirected to the dashboard in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show if user already has a submission
  if (hasSubmission && kycSubmission) {
    return (
      <div className="container-responsive py-6">
        <Card className="bg-[#18191A] border-white/15">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">KYC Verification</CardTitle>
            <CardDescription className="text-white/80">
              Your KYC verification details and current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-white/15 rounded-lg bg-[#18191A]">
                <div>
                  <h3 className="font-bold text-white">Verification Status</h3>
                  <p className="text-sm text-white/80">
                    Submitted on {new Date(kycSubmission.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-bold ${getStatusColor(kycSubmission.status)}`}>
                  {getStatusText(kycSubmission.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-white">Full Name</label>
                  <p className="mt-1 text-sm text-white/90">{kycSubmission.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-bold text-white">Phone Number</label>
                  <p className="mt-1 text-sm text-white/90">{kycSubmission.phone_number}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-white">Address</label>
                  <p className="mt-1 text-sm text-white/90">{kycSubmission.address}</p>
                </div>
              </div>

              {kycSubmission.status === 'rejected' && kycSubmission.review_notes && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <h4 className="font-bold text-white mb-2">Rejection Reason</h4>
                  <p className="text-sm text-white/90">{kycSubmission.review_notes}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1 bg-[#18191A] text-white border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-white/50">
                  Return to Dashboard
                </Button>
                {kycSubmission.status === 'rejected' && (
                  <Button 
                    onClick={() => {
                      setHasSubmission(false);
                      setKycSubmission(null);
                    }}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-white/50"
                  >
                    Resubmit KYC
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-responsive py-6">
      <div className="max-w-2xl mx-auto">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex items-center gap-2 bg-[#18191A] text-white border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-white/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        
        <Card className="bg-[#18191A] border-white/15">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">KYC Verification</CardTitle>
            <CardDescription className="text-white/80">
              Submit your ID. Your information is safe with us.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-base font-bold text-white">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full legal name"
                  className="bg-[#18191A] text-white placeholder:text-white/50 border-white/20 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                  required
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-base font-bold text-white">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className="bg-[#18191A] text-white placeholder:text-white/50 border-white/20 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                  required
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-base font-bold text-white">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your full address"
                  className="min-h-[100px] resize-none bg-[#18191A] text-white placeholder:text-white/50 border-white/20 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                  required
                />
              </div>

              {/* Divider */}
              <div className="border-t border-white/15 my-6" />

              {/* Front Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="frontDocument" className="text-base font-bold text-white">Upload Front Side *</Label>
                <p className="text-sm text-white mb-2">We accept PNG/JPG</p>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    frontDocumentDragOver 
                      ? 'border-[#22C55E] bg-[#22C55E]/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'frontDocument')}
                  onDragLeave={(e) => handleDragLeave(e, 'frontDocument')}
                  onDrop={(e) => handleDrop(e, 'frontDocument')}
                >
                  <input
                    id="frontDocument"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('frontDocument', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="frontDocument" className="cursor-pointer">
                    {formData.frontDocument ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <span className="text-sm font-bold text-white">
                          {formData.frontDocument.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-8 w-8 text-white/60" />
                        <span className="text-sm text-white font-semibold">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-white/60">
                          JPEG, PNG, or PDF (max 10MB)
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Back Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="backDocument" className="text-base font-bold text-white">Back of Driver's License (if applicable)</Label>
                <p className="text-sm text-white mb-2">We accept PNG/JPG</p>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    backDocumentDragOver 
                      ? 'border-[#22C55E] bg-[#22C55E]/10' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  onDragOver={(e) => handleDragOver(e, 'backDocument')}
                  onDragLeave={(e) => handleDragLeave(e, 'backDocument')}
                  onDrop={(e) => handleDrop(e, 'backDocument')}
                >
                  <input
                    id="backDocument"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileUpload('backDocument', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="backDocument" className="cursor-pointer">
                    {formData.backDocument ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-8 w-8 text-primary" />
                        <span className="text-sm font-bold text-white">
                          {formData.backDocument.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="h-8 w-8 text-white/60" />
                        <span className="text-sm text-white font-semibold">
                          Click to upload or drag and drop
                        </span>
                        <span className="text-xs text-white/60">
                          JPEG, PNG, or PDF (max 10MB)
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-white/15 my-6" />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-[#22C55E] text-white hover:bg-[#16A34A] font-bold focus:ring-2 focus:ring-white/50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>

              {/* Disclaimer */}
              <div className="text-xs text-white/80 text-center space-y-1">
                <p className="font-semibold">* Required fields</p>
                <p>Your information is safe with us. All data is kept confidential and used solely for verification purposes.</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KYC;