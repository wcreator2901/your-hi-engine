import { useNavigate } from 'react-router-dom';
import { Mail, Clock, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Contact = () => {
  const navigate = useNavigate();

  const handleSendEmail = () => {
    window.location.href = "mailto:info@pulsesupport-wlt.com";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-slate-300">
            We're here to help you with all your crypto wallet needs
          </p>
        </div>

        {/* Main Contact Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Contact Our Support Team
              </h2>
              <p className="text-slate-300">
                We typically respond within 24 hours
              </p>
            </div>

            <div className="flex flex-col items-center space-y-6">
              {/* Email Icon */}
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>

              {/* Email Section */}
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Email Support</p>
                <h3 className="text-2xl font-bold text-white mb-4">
                  info@pulsesupport-wlt.com
                </h3>
                <p className="text-slate-300 text-sm">
                  Send us an email and our support team will get back to you as soon as possible
                </p>
              </div>

              {/* Send Email Button */}
              <Button
                onClick={handleSendEmail}
                className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-black font-semibold px-8 py-6 text-lg rounded-full"
              >
                Send Email Now
              </Button>
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-white/20"></div>

            {/* Back to Dashboard Link */}
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quick Response</h3>
            <p className="text-slate-300 text-sm">
              Average response time under 24 hours
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Expert Support</h3>
            <p className="text-slate-300 text-sm">
              Dedicated crypto wallet specialists
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Secure Communication</h3>
            <p className="text-slate-300 text-sm">
              All inquiries handled confidentially
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
