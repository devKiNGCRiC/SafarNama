import React, { useEffect } from "react";
import "./Footer.scss";
import { Link } from "react-router-dom";

//Importing Aos
import Aos from "aos";
import "aos/dist/aos.css";

//Imported icons
import {
  FaFacebook,
  FaInstagram,
  FaWhatsapp,
  FaTelegramPlane,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { FaThreads } from "react-icons/fa6";

import logo from "../../Assets/logo.jpg";

const Footer = () => {
  useEffect(() => {
    Aos.init({ duration: 1200 });
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-brand" data-aos="fade-up">
          <div className="footer-logo">
            <img src={logo} className="logo-img" alt="SafarNama Logo" />
            <div className="logo-text">
              <span className="logo-safar">Safar</span>
              <span className="logo-nama">Nama</span>
            </div>
          </div>
          <p className="footer-tagline">
            Your gateway to extraordinary journeys across India. Discover,
            explore, and create unforgettable memories with SafarNama.
          </p>

          {/* Social Links */}
          <div className="social-links">
            <a
              href="https://www.facebook.com/profile.php?id=61567204745011"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook className="social-icon" />
            </a>
            <a
              href="https://www.instagram.com/safarnama_rkcbharat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram className="social-icon" />
            </a>
            <a
              href="https://x.com/Safarnama_RKC"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <BsTwitterX className="social-icon" />
            </a>
            <a
              href="https://www.whatsapp.com/channel/0029VajfQckBvvsfzSX66q0Z"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp className="social-icon" />
            </a>
            <a
              href="https://www.threads.net/@safarnama_rkcbharat?invite=0"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Threads"
            >
              <FaThreads className="social-icon" />
            </a>
            <a
              href="https://t.me/SafarNama_RKCBharat"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
            >
              <FaTelegramPlane className="social-icon" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-links" data-aos="fade-up" data-aos-delay="100">
          <h3 className="footer-heading">Quick Links</h3>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/destination">Destinations</Link>
            </li>
            <li>
              <Link to="/blogs">Travel Blog</Link>
            </li>
            <li>
              <Link to="/events">Events</Link>
            </li>
            <li>
              <Link to="/communityforum">Community Forum</Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div className="footer-links" data-aos="fade-up" data-aos-delay="200">
          <h3 className="footer-heading">Support</h3>
          <ul>
            <li>
              <Link to="/itinerary">Itinerary Builder</Link>
            </li>
            <li>
              <Link to="/FAQ">FAQ</Link>
            </li>
            <li>
              <Link to="/contact-Us">Contact Us</Link>
            </li>
            <li>
              <Link to="/feedback">Feedback</Link>
            </li>
            <li>
              <a href="#">Terms & Conditions</a>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-contact" data-aos="fade-up" data-aos-delay="300">
          <h3 className="footer-heading">Get in Touch</h3>
          <ul className="contact-list">
            <li>
              <FaPhone className="contact-icon" />
              <a href="tel:+918732093825">+91 8732093825</a>
            </li>
            <li>
              <FaEnvelope className="contact-icon" />
              <a href="mailto:safarnama252935@gmail.com">
                safarnama252935@gmail.com
              </a>
            </li>
            <li>
              <FaMapMarkerAlt className="contact-icon" />
              <span>India</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p className="copyright">
            © {currentYear} SafarNama. All rights reserved.
          </p>
          <p className="rkc-credit">
            Part of <span className="rkc-bharat">RKC Bharat</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
