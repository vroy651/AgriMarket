import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../api";
import "./styles/ProductListPage.css";
import { useAuth } from "../contexts/AuthContext";

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Filter states with debounced search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const { authTokens, setAuthTokens, logout } = useAuth();

  // useRef for the timeout
  const searchTimer = useRef(null);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch (e) {
      console.log(e);
      return true;
    }
  };

  // Memoize fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/marketplace/categories/");
      const categoriesData = response.data.results || response.data;
      setCategories(categoriesData);
      setError("");
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load categories. Please try again later.");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(priceRange.min && { min_price: priceRange.min }),
        ...(priceRange.max && { max_price: priceRange.max }),
      });

      const response = await api.get(`/marketplace/products/?${queryParams}`);
      setProducts(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
    }
  }, [currentPage, searchQuery, selectedCategory, priceRange]);

  // Handle token refresh with correct endpoint
  const refreshToken = async () => {
    try {
      if (!authTokens?.refresh) {
        throw new Error("No refresh token available");
      }

      // The refresh token must be sent as { refresh: "your-refresh-token" }
      const response = await api.post("/jwt/refresh/", {
        refresh: authTokens.refresh,
      });

      if (!response.data.access) {
        throw new Error("No access token received");
      }

      // Update tokens while preserving the refresh token
      const newTokens = {
        ...authTokens,
        access: response.data.access,
      };
      setAuthTokens(newTokens);
      return newTokens;
    } catch (err) {
      console.error("Error refreshing token:", err);
      if (err.response?.status === 400) {
        console.error("Invalid refresh token:", err.response.data);
      }
      logout();
      throw new Error("Session expired. Please login again.");
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchProducts();
      setLoading(false);
    };

    initializeData();
  }, [fetchCategories, fetchProducts]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts();
    }, 300);

    return () => clearTimeout(searchTimer.current);
  }, [searchQuery, selectedCategory, priceRange, fetchProducts]);

  // Updated handleOrderClick function with token refresh
  const handleOrderClick = async (productId) => {
    try {
      if (!authTokens?.access) {
        setError("You must be logged in to place an order.");
        navigate("/login");
        return;
      }

      let currentTokens = authTokens;

      if (isTokenExpired(authTokens.access)) {
        try {
          currentTokens = await refreshToken();
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          setError("Session expired. Please login again.");
          navigate("/login");
          return;
        }
      }

      // Ensure productId is a number
      const numericProductId = parseInt(productId, 10);

      // Updated order data with explicit type conversion
      const orderData = {
        product_id: numericProductId,
        quantity: 1,
      };

      // Debug logs
      console.log("Sending order request:", {
        url: "/marketplace/orders/",
        data: orderData,
        headers: {
          Authorization: `Bearer ${currentTokens.access.slice(0, 10)}...`,
          "Content-Type": "application/json",
        },
      });

      // Make the request with explicit Content-Type
      const response = await api.post("/marketplace/orders/", orderData, {
        headers: {
          Authorization: `Bearer ${currentTokens.access}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("Order response:", response.data);
      navigate("/orders");
    } catch (err) {
      console.error("Full error object:", err);

      if (err.response?.status === 400) {
        // Log the complete error response
        console.error("Error Response:", {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers,
          config: {
            url: err.response.config.url,
            method: err.response.config.method,
            data: JSON.parse(err.response.config.data), // Parse the sent data
            headers: err.response.config.headers,
          },
        });

        // Try to get a detailed error message
        const errorDetail =
          err.response.data?.error ||
          err.response.data?.detail ||
          err.response.data?.message ||
          "Failed to place order";

        setError(errorDetail);
      } else if (err.response?.status === 403) {
        console.error("Authentication error:", err.response.data);
        setError("Please login again to continue.");
        logout();
        navigate("/login");
      } else if (err.response) {
        console.error("Server error:", err.response.data);
        setError(
          `Server error: ${err.response.data?.error || "An error occurred"}`
        );
      } else if (err.request) {
        console.error("Network error:", err.request);
        setError("Network error. Please try again.");
      } else {
        console.error("Other error:", err);
        setError(`Error: ${err.message || "An unknown error occurred"}`);
      }
    }
  };
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="price-filters">
          <input
            type="number"
            placeholder="Min Price"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange((prev) => ({ ...prev, min: e.target.value }))
            }
            className="price-input"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange((prev) => ({ ...prev, max: e.target.value }))
            }
            className="price-input"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-header">
                  <h2 className="product-title">{product.name}</h2>
                </div>
                <div className="product-content">
                  {product.images?.[0]?.image && (
                    <img
                      src={product.images[0].image}
                      alt={product.name}
                      className="product-image"
                    />
                  )}
                  <p className="product-description">{product.description}</p>
                  <p className="product-price">${product.price}</p>
                </div>
                <div className="product-footer">
                  <span className="stock-info">
                    Stock: {product.stock} {product.unit}
                  </span>
                  <button
                    onClick={() => handleOrderClick(product.id)}
                    disabled={!product.is_available || product.stock === 0}
                    className={`order-button ${
                      !product.is_available || product.stock === 0
                        ? "order-button-disabled"
                        : ""
                    }`}
                  >
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <button
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductListPage;
