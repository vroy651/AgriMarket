// frontend/src/components/Navbar.js
// import React from 'react';
// Navbar.js
// frontend/src/components/Navbar.js
// import React from 'react';
// Navbar.js
import { useState, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./styles/Navbar.css";
import { FaShoppingCart, FaSearch, FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaGlobe } from "react-icons/fa";

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchInputRef = useRef(null);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchError(null);

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      searchInputRef.current.focus();
      return;
    }

    try {
      setIsSearching(true);

      const params = new URLSearchParams({
        q: trimmedQuery,
        page: 1,
        page_size: 20
      });

      navigate(`/products/search?${params.toString()}`);
      setIsOpen(false);

    } catch (err) {
      console.error('Error during search:', err);
      setSearchError('An error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const closeMobileMenuAndDropdown = () => {
    setIsOpen(false);
    setActiveDropdown(null);
  };

  const userLinks = [
    { title: 'Profile', path: '/profile/', icon: <FaUserCircle /> },
    { title: 'My Products', path: '/my-products/', icon: null },
    { title: 'My Orders', path: '/orders/', icon: null },
    { title: 'Seller Orders', path: '/seller-orders/', icon: null },
    {
      title: 'Logout',
      onClick: handleLogout,
      icon: <FaSignOutAlt />,
      isButton: true,
    },
  ];

  const resourceLinks = [
    { title: 'Weather', path: '/weather/', icon: null },
    { title: 'Crop Calendar', path: '/crop-calendar/', icon: null },
    { title: 'Market Prices', path: '/market-prices/', icon: null },
    { title: 'Pest Tracker', path: '/pest-disease-tracker/', icon: null }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link className="navbar-brand" to="/" onClick={closeMobileMenuAndDropdown}>
          AgriMarket
        </Link>

        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={isSearching}
            ref={searchInputRef}
            aria-label="Search for products"
          />
          <button
            type="submit"
            className="search-button"
            disabled={isSearching}
            aria-label="Search"
          >
            <FaSearch />
          </button>
          {searchError && (
            <p className="search-error-message">{searchError}</p>
          )}
        </form>

        <button
          className="navbar-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggle-icon"></span>
        </button>

        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link" to="/products/" onClick={closeMobileMenuAndDropdown}>
                Products
              </Link>
            </li>

            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/products/create/"
                    onClick={closeMobileMenuAndDropdown}
                  >
                    Sell Product
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/cart/" className="nav-link" onClick={closeMobileMenuAndDropdown}>
                    <FaShoppingCart /> Cart
                  </Link>
                </li>
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle"
                    onClick={() => toggleDropdown('resources')}
                    aria-haspopup="true"
                    aria-expanded={activeDropdown === 'resources'}
                  >
                    <FaGlobe /> Resources
                  </button>
                  <ul className={`dropdown-menu ${activeDropdown === 'resources' ? 'show' : ''}`} aria-labelledby="resources-dropdown">
                    {resourceLinks.map((link, index) => (
                      <li key={index}>
                        <Link
                          className="dropdown-item"
                          to={link.path}
                          onClick={closeMobileMenuAndDropdown}
                        >
                          {link.icon} {link.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle"
                    onClick={() => toggleDropdown('user')}
                    aria-haspopup="true"
                    aria-expanded={activeDropdown === 'user'}
                  >
                    <FaUserCircle /> My Account
                  </button>
                  <ul className={`dropdown-menu ${activeDropdown === 'user' ? 'show' : ''}`} aria-labelledby="user-dropdown">
                    {userLinks.map((link, index) => (
                      <li key={index}>
                        {link.isButton ? (
                          <button className="dropdown-item" onClick={link.onClick}>
                            {link.icon} {link.title}
                          </button>
                        ) : (
                          <Link
                            className="dropdown-item"
                            to={link.path}
                            onClick={closeMobileMenuAndDropdown}
                          >
                            {link.icon} {link.title}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              </>
            )}

            {!isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/login/"
                    onClick={closeMobileMenuAndDropdown}
                  >
                    <FaSignInAlt /> Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link"
                    to="/signup/"
                    onClick={closeMobileMenuAndDropdown}
                  >
                    <FaUserPlus /> Signup
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;