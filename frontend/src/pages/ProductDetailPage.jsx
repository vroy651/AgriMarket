// frontend/src/pages/ProductListPage.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {api} from '../api';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('marketplace/products/');
        setProducts(response.data.results);
      } catch (err) {
        setError(err.message || 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="product-list-page">
      <h2>Available Products</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.slug} className="product-card">
            <Link to={`/products/${product.slug}/`}>
              <h3>{product.name}</h3>
              <p>Price: ${product.price}</p>
              {product.images.length > 0 && (
                <img src={product.images[0].image} alt={product.name} className="product-image" />
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductListPage;