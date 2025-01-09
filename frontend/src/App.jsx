// frontend/src/App.js
// import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CreateProductPage from './pages/CreateProductPage';
import EditProductPage from './pages/EditProductPage';
import MyProductsPage from './pages/MyProductsPage';
import PlaceOrderPage from './pages/PlaceOrderPage';
import OrderListPage from './pages/OrderListPage';
import SellerOrderListPage from './pages/SellerOrderListPage';
import WeatherPage from './pages/WeatherPage';
import CropCalendarPage from './pages/CropCalendarPage';
import MarketPricesPage from './pages/MarketPricesPage';
import PestDiseaseTrackerPage from './pages/PestDiseaseTrackerPage';
import NotFoundPage from './pages/NotFoundPage';
import UserProfilePage from './pages/UserProfilePage'; // Import the new component
import OrderDetailPage from './pages/OrderDetailPage'; // Import the new component
import SearchResults from './pages/SearchResults';
import './App.css'; // Global styles

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup/" element={<SignupPage />} />
          <Route path="/login/" element={<LoginPage />} />
          <Route path="/products/search" element={<SearchResults />} />
          <Route path="/products/" element={<ProductListPage />} />
          <Route path="/products/:slug/" element={<ProductDetailPage />} />
          <Route path="/products/create/" element={<CreateProductPage />} />
          <Route path="/products/edit/:slug/" element={<EditProductPage />} />
          <Route path="/my-products/" element={<MyProductsPage />} />
          <Route path="/products/:productId/place-order/" element={<PlaceOrderPage />} />
          <Route path="/orders/" element={<OrderListPage />} />
          <Route path="/orders/:orderId/" element={<OrderDetailPage />} /> {/* Add route for order details */}
          <Route path="/seller-orders/" element={<SellerOrderListPage />} />
          <Route path="/weather/" element={<WeatherPage />} />
          <Route path="/crop-calendar/" element={<CropCalendarPage />} />
          <Route path="/market-prices/" element={<MarketPricesPage />} />
          <Route path="/pest-disease-tracker/" element={<PestDiseaseTrackerPage />} />
          <Route path="/profile/" element={<UserProfilePage />} /> {/* Add route for user profile */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;