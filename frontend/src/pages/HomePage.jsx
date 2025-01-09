// frontend/src/pages/HomePage.js
// import React from 'react';

import "./styles/HomePage.css";
import { Link } from "react-router-dom";
import { CloudRain, Package, Store } from "lucide-react";

const HomePage = () => {
  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Connecting Farmers, Buyers, and Knowledge.
          </h1>
          <p className="hero-subtitle">
            Discover a seamless marketplace for agricultural products and
            essential farming resources. Empowering the agricultural community.
          </p>
          <div className="hero-buttons">
            <Link to="/products" className="button primary-button">
              Explore Products
            </Link>
            <Link to="/products/create" className="button secondary-button">
              List Your Products
            </Link>
          </div>
        </div>
        <div className="hero-image">
          {/* Replace with a relevant image or illustration */}
          <img
            src="https://placehold.co/600x400?text=Agriculture+Image"
            alt="Agriculture Showcase"
          />
        </div>
      </section>

      <section className="features-section">
        <h2>Explore Our Key Features</h2>
        <div className="features-grid">
          <div className="feature-item">
            <Store className="feature-icon" size={48} />
            <h3>Vibrant Marketplace</h3>
            <p>
              Browse a diverse selection of agricultural products, from fresh
              produce to specialized equipment. Connect directly with sellers and
              find exactly what you need.
            </p>
            <Link to="/products" className="learn-more-link">
              Explore the Market
            </Link>
          </div>
          <div className="feature-item">
            <Package className="feature-icon" size={48} />
            <h3>Effortless Selling</h3>
            <p>
              Reach a wider audience by listing your agricultural products on our
              platform. Manage your listings, track orders, and grow your
              business with ease.
            </p>
            <Link to="/products/create" className="learn-more-link">
              Start Selling
            </Link>
          </div>
          <div className="feature-item">
            <CloudRain className="feature-icon" size={48} />
            <h3>Essential Agri-Data</h3>
            <p>
              Stay ahead with real-time weather updates, comprehensive crop
              calendars, and up-to-date market prices. Make informed decisions
              for successful farming.
            </p>
            <Link to="/weather" className="learn-more-link">
              Access Agri-Data
            </Link>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <h2>Ready to Get Started?</h2>
        <p>Join AgriMarket today and be a part of the future of agriculture.</p>
        <Link to="/signup" className="button primary-button">
          Sign Up for Free
        </Link>
      </section>
    </div>
  );
};

export default HomePage;