// import React from 'react';
import "./styles/Footer.css";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Explore</h3>
          <ul>
            <li><a href="/products">Products</a></li>
            <li><a href="/sellers">Our Sellers</a></li>
            <li><a href="/resources">Resources</a></li>
            <li><a href="/blog">Blog</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Customer Service</h3>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/shipping-returns">Shipping & Returns</a></li>
            <li><a href="/payment-methods">Payment Methods</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>About AgriMarket</h3>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/our-mission">Our Mission</a></li>
            <li><a href="/privacy-policy">Privacy Policy</a></li>
            <li><a href="/terms-of-service">Terms of Service</a></li>
          </ul>
        </div>

        <div className="footer-section contact-info">
          <h3>Contact Us</h3>
          <p><FaMapMarkerAlt /> 123 Agri Lane, Farmville, State, 12345</p>
          <p><FaPhone /> <a href="tel:+15551234567">(555) 123-4567</a></p>
          <p><FaEnvelope /> <a href="mailto:info@agrimarket.com">info@agrimarket.com</a></p>
        </div>

        <div className="footer-section social-media">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            <a href="https://www.twitter.com/" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} AgriMarket. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="/site-map">Site Map</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;