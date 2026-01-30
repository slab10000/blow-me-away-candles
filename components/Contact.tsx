import React from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

const Contact: React.FC = () => {
  return (
    <section id="contact" className="py-20 bg-gray-900 text-white">
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
                <span className="text-lg">hello@blowmeaway.com</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-800 rounded-full text-gold-500">
                  <Phone size={24} />
                </div>
                <span className="text-lg">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-800 rounded-full text-gold-500">
                  <MapPin size={24} />
                </div>
                <span className="text-lg">123 Wick Street, Candlewood, CA 90210</span>
              </div>
            </div>

            <div className="pt-8 border-t border-gray-800">
              <h3 className="text-xl font-bold mb-4">Follow Us</h3>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">
                  <Instagram size={28} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">
                  <Facebook size={28} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gold-500 transition-colors">
                  <Twitter size={28} />
                </a>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-gray-800 rounded-2xl p-8 lg:p-12 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-white">Send us a message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Name</label>
                  <input type="text" id="name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="Jane Doe" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Email</label>
                  <input type="email" id="email" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="jane@example.com" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Subject</label>
                <select id="subject" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors">
                  <option>Order Inquiry</option>
                  <option>Custom Request</option>
                  <option>Wholesale</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Message</label>
                <textarea id="message" rows={4} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" placeholder="Tell us what you need..."></textarea>
              </div>
              <button type="submit" className="w-full bg-gold-600 hover:bg-gold-700 text-white font-bold py-4 rounded-lg uppercase tracking-widest transition-colors duration-300">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;