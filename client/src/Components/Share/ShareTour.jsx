// src/Components/Share/ShareTour.jsx
import React, { useState } from 'react';
import { Share2, Facebook, Twitter,  Copy, Check, Mail } from 'lucide-react';
import './ShareTour.css';

const ShareTour = ({ tour }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUrl = window.location.href;
  const shareText = `Check out this amazing eco-tourism tour: ${tour.name} at ${tour.destination.name}`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`,
    email: `mailto:?subject=Check out this Eco-Tourism Tour&body=${encodeURIComponent(shareText + '\n\n' + currentUrl)}`
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="share-container">
      <button 
        className="share-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Share tour"
      >
        <Share2 size={20} />
        Share
      </button>

      {isOpen && (
        <div className="share-modal">
          <div className="share-options">
            <button 
              onClick={() => handleShare('facebook')}
              className="share-option facebook"
            >
              <Facebook size={20} />
              Facebook
            </button>

            <button 
              onClick={() => handleShare('twitter')}
              className="share-option twitter"
            >
              <Twitter size={20} />
              Twitter
            </button>

            <button 
              onClick={() => handleShare('whatsapp')}
              className="share-option whatsapp"
            >
              <WhatsApp size={20} />
              WhatsApp
            </button>

            <button 
              onClick={() => handleShare('email')}
              className="share-option email"
            >
              <Mail size={20} />
              Email
            </button>

            <button 
              onClick={handleCopyLink}
              className="share-option copy"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareTour;