import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import "./styles/SearchResults.css";
import {apiWrapper} from "../api";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const constructSearchParams = (searchParams) => {
    const params = {
      q: searchParams.get("q") || "",
      page: searchParams.get("page") || "1",
      page_size: "20",
    };
    if (searchParams.get("category"))
      params.category = searchParams.get("category");
    if (searchParams.get("min_price"))
      params.min_price = searchParams.get("min_price");
    if (searchParams.get("max_price"))
      params.max_price = searchParams.get("max_price");
    return params;
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = constructSearchParams(searchParams);

        const data = await apiWrapper.searchProducts(params);
        console.log(data);
        if (!Array.isArray(data.results)) {
          console.error("Invalid data structure:", data);
          throw new Error("Invalid data format received from server");
        }

        setResults(data.results);
        setTotalPages(data.total_pages);
        setCurrentPage(data.current_page);
      } catch (err) {
        console.error("Search error:", err);
        setError(
          err.message || "An unexpected error occurred while fetching results"
        );
        setResults([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  const handlePageChange = (newPage) => {
    const currentParams = new URLSearchParams(searchParams);
    currentParams.set("page", newPage.toString());
    window.history.pushState({}, "", `?${currentParams.toString()}`);
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="search-loading">
        <p>Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-error">
        <h3>Error Loading Results</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry Search
        </button>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="no-results">
        <p>No products found for {searchParams.get("q")}</p>
        <Link to="/marketplace" className="back-to-search">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <h2>Search Results for {searchParams.get("q")}</h2>

      <div className="search-results-grid">
        {results.map((product) => (
          <div key={product.id} className="product-card">
            {product.images?.length > 0 && (
              <img
                src={product.images[0].image}
                alt={product.name}
                className="product-image"
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg"; // Add a fallback image
                  e.target.alt = "Product image not available";
                }}
              />
            )}
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-price">₹{product.price}</p>
              <p className="product-seller">Sold by: {product.seller_name}</p>
              <div className="product-actions">
                <Link
                  to={`/marketplace/products/${product.slug}`}
                  className="view-details-btn"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
