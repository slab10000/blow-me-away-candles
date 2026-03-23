import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Instagram } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Order Inquiry', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await emailjs.send(
        'service_sd8u95p',
        'template_70j8k9s',
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        'ApmjMnsrcrYagY3g_'
      );
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'Order Inquiry', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="flame-zone py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info Section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif font-bold mb-6">Get In Touch</h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                Ready to transform your space? Contact us for custom bulk orders, wholesale inquiries, or just to say hello.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-800 rounded-full text-gold-500">
                  <Mail size={24} />
                </div>
                <span className="text-lg">blowmeawaycandleco@gmail.com</span>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-800">
              <h3 className="text-xl font-bold mb-4">Follow Us</h3>
              <div className="flex space-x-6">
                <a href="https://www.instagram.com/blow_me_away_co" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-gold-500 transition-colors">
                  <Instagram size={28} />
                  <span className="text-lg">@blow_me_away_co</span>
                </a>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-gray-800 rounded-2xl p-8 lg:p-12 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Name</label>
                  <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="Jane Doe" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Customer Email</label>
                  <input type="email" id="email" value={formData.email} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="jane@example.com" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Subject</label>
                <select id="subject" value={formData.subject} onChange={handleChange} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors">
                  <option>Order Inquiry</option>
                  <option>Custom Request</option>
                  <option>Wholesale</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Message</label>
                <textarea id="message" value={formData.message} onChange={handleChange} required rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="Tell us what you need..."></textarea>
              </div>

              {status === 'success' && (
                <p className="text-green-400 text-sm">Message sent! We'll get back to you soon.</p>
              )}
              {status === 'error' && (
                <p className="text-red-400 text-sm">Something went wrong. Please try again or email us directly.</p>
              )}

              <button type="submit" disabled={status === 'sending'} className="w-full bg-gold-600 hover:bg-gold-700 disabled:opacity-50 text-white font-bold py-4 rounded-lg uppercase tracking-widest transition-colors duration-300">
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
