import { Suspense, useEffect } from 'react';
import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Footer from './Footer';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';
import { ScrollToTop } from './ScrollToTop';
import "./styles/Layout.css";
// import CategorySidebar from '../pages/CategorySidebar';
import Banner from '../pages/Banner';

const Layout = ({ children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ErrorBoundary>
      <div className="layout-container">
        <Navbar />
        <Banner /> {/* Add a Banner Section below the Navbar */}
        <div className="content-wrapper">
          {/* <CategorySidebar /> Add Category Sidebar */}
          <Suspense fallback={<LoadingSpinner />}>
            <main className="main-content">
              {children}
            </main>
          </Suspense>
        </div>
        <Footer />
        <ScrollToTop />
      </div>
    </ErrorBoundary>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;