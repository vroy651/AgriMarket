// frontend/src/pages/NotFoundPage.js
// import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <h1>404 - Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="button primary">Go to Homepage</Link>
    </div>
  );
};

export default NotFoundPage;