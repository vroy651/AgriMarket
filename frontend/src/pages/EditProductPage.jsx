// frontend/src/pages/EditProductPage.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate,Link } from 'react-router-dom';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const EditProductPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authTokens } = useAuth();

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      try {
        const productResponse = await api.get(`marketplace/products/${slug}/`);
        setProduct(productResponse.data);
        setName(productResponse.data.name);
        setDescription(productResponse.data.description);
        setPrice(productResponse.data.price);
        setStock(productResponse.data.stock);
        setCategory(productResponse.data.category.id);
        setImages(productResponse.data.images);

        const categoriesResponse = await api.get('marketplace/categories/');
        setCategories(categoriesResponse.data);
      } catch (err) {
        setError('Failed to fetch product or categories.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndCategories();
  }, [slug]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'name': setName(value); break;
      case 'description': setDescription(value); break;
      case 'price': setPrice(value); break;
      case 'stock': setStock(value); break;
      case 'category': setCategory(value); break;
      default: break;
    }
  };

  const handleNewImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await api.delete(`marketplace/products/${slug}/images/${imageId}/delete/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        setImages(images.filter((img) => img.id !== imageId));
      } catch (err) {
        setError('Failed to delete image.');
        console.error(err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    newImages.forEach((image) => formData.append('images', image));

    try {
      const response = await api.patch(`marketplace/products/${slug}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      if (response.status === 200) {
        navigate(`marketplace/products/${slug}/`);
      } else {
        setError('Failed to update product.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update product.');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div className="edit-product-page">
      <h2>Edit Product: {product.name}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name:</label>
          <input type="text" id="name" name="name" value={name} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={description} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <input type="number" id="price" name="price" value={price} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="stock">Stock:</label>
          <input type="number" id="stock" name="stock" value={stock} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select id="category" name="category" value={category} onChange={handleInputChange} required>
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="newImages">Add More Images:</label>
          <input type="file" id="newImages" multiple onChange={handleNewImageChange} accept="image/*" />
        </div>
        <div className="form-group">
          <label>Current Images:</label>
          <div className="current-images">
            {images.map((img) => (
              <div key={img.id} className="image-preview">
                <img src={img.image} alt={product.name} />
                <button type="button" onClick={() => handleDeleteImage(img.id)} className="button small danger">Delete</button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="button primary">Update Product</button>
        <Link to={`/products/${slug}/`} className="button secondary">Cancel</Link>
      </form>
    </div>
  );
};

export default EditProductPage;