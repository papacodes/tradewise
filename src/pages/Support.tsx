import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Mail, 
  MessageCircle, 
  Phone, 
  Clock, 
  HelpCircle, 
  Book, 
  Video, 
  FileText, 
  ArrowRight,
  Search,
  Users,
  Zap,
  Shield
} from 'lucide-react';

export const Support = () => {
  useEffect(() => {
    document.title = 'Support - TradeWise';
  }, []);

  const contactMethods = [
    {
      icon: <Mail className="w-8 h-8 text-blue-400" />,
      title: "Email Support",
      description: "Get help via email within 24 hours",
      contact: "support@tradewise.com",
      availability: "24/7"
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-green-400" />,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      contact: "Available in app",
      availability: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: <Phone className="w-8 h-8 text-purple-400" />,
      title: "Phone Support",
      description: "Speak directly with our experts",
      contact: "+1 (555) 123-4567",
      availability: "Enterprise customers only"
    }
  ];

  const resources = [
    {
      icon: <Book className="w-6 h-6 text-blue-400" />,
      title: "Documentation",
      description: "Comprehensive guides and API documentation",
      link: "#"
    },
    {
      icon: <Video className="w-6 h-6 text-red-400" />,
      title: "Video Tutorials",
      description: "Step-by-step video guides for all features",
      link: "#"
    },
    {
      icon: <FileText className="w-6 h-6 text-green-400" />,
      title: "Knowledge Base",
      description: "Searchable articles and troubleshooting guides",
      link: "#"
    },
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: "Community Forum",
      description: "Connect with other traders and share insights",
      link: "#"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with TradeWise?",
      answer: "Simply sign up for a free account, connect your trading account, and start logging your trades. Our onboarding guide will walk you through the setup process."
    },
    {
      question: "Can I import my existing trade data?",
      answer: "Yes! TradeWise supports importing trade data from CSV files and popular trading platforms. You can bulk import your historical trades to get started quickly."
    },
    {
      question: "Is my trading data secure?",
      answer: "Absolutely. We use bank-level encryption and security measures to protect your data. Your trading information is stored securely and never shared with third parties."
    },
    {
      question: "What trading platforms do you support?",
      answer: "TradeWise works with most major trading platforms including MetaTrader, TradingView, Interactive Brokers, and many others. You can also manually log trades from any platform."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time with no cancellation fees. Your data will remain accessible until the end of your billing period."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
    }
  ];

  return (
    <div className="min-h-screen bg-[#121417] text-white">
      {/* Header */}
      <header className="border-b border-gray-700 px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold">TradeWise</span>
          </div>
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-9">
              <Link to="/" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Home
              </Link>
              <Link to="/features" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-blue-400 transition-colors">
                Pricing
              </Link>
              <Link to="/support" className="text-sm font-medium text-blue-400">
                Support
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium hover:text-blue-400 transition-colors px-4 py-2"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-[#1273d4] hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            We're Here to
            <span className="text-blue-400"> Help</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get the support you need to make the most of TradeWise. Our team is ready to help you succeed.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full pl-10 pr-4 py-3 bg-[#1a1d23] border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Get in Touch
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className="bg-[#1a1d23] rounded-xl border border-gray-700 p-8 text-center hover:border-gray-600 transition-colors">
                <div className="flex justify-center mb-4">
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{method.title}</h3>
                <p className="text-gray-400 mb-4">{method.description}</p>
                <div className="space-y-2">
                  <p className="font-medium text-blue-400">{method.contact}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{method.availability}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="px-10 py-20 bg-[#1a1d23]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Help Resources
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                className="bg-[#121417] rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {resource.icon}
                  <h3 className="font-semibold group-hover:text-blue-400 transition-colors">
                    {resource.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm mb-4">{resource.description}</p>
                <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-10 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#1a1d23] rounded-xl border border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <HelpCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                    <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="px-10 py-20 bg-[#1a1d23]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why Choose TradeWise Support?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Zap className="w-12 h-12 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Response</h3>
              <p className="text-gray-400">
                Get answers quickly with our 24-hour email response time and real-time chat support.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Expert Team</h3>
              <p className="text-gray-400">
                Our support team consists of experienced traders who understand your needs.
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Comprehensive Help</h3>
              <p className="text-gray-400">
                From setup to advanced features, we provide complete guidance every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-10 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Still need help?
          </h2>
          <p className="text-gray-400 mb-8">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@tradewise.com"
              className="bg-[#1273d4] hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <Link
              to="/register"
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700 px-10 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="font-bold">TradeWise</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/features" className="text-sm text-gray-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link to="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link to="/support" className="text-sm text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            © 2024 TradeWise. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};