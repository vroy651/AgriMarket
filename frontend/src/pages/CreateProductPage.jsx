// frontend/src/pages/CreateProductPage.js
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api from '../api';
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import "./styles/CreateProductpage.css";
import { useAuth } from "../contexts/AuthContext";

const CreateProductPage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
    const [unit, setUnit] = useState("kg");
    const [isAvailable, setIsAvailable] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const navigate = useNavigate();
  const { authTokens } = useAuth();

    // Memoized fetching of categories
    const fetchCategories = useCallback(async () => {
        setLoadingCategories(true);
        try {
            const response = await api.get("marketplace/categories/");
            if (Array.isArray(response.data)) {
                setCategories(response.data);
            } else if (
                response.data.results &&
                Array.isArray(response.data.results)
            ) {
                setCategories(response.data.results);
            } else {
                console.error("Unexpected categories data structure:", response.data);
                setFormErrors(prev => ({ ...prev, category: "Could not load categories." }));
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            setFormErrors(prev => ({ ...prev, category: "Failed to fetch categories." }));
        } finally {
            setLoadingCategories(false);
        }
    }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

      if (files.length > 5) {
          setFormErrors(prev => ({ ...prev, images: "Maximum 5 images allowed" }));
          return;
      }

      const validationError = files.some((file) => {
          if (file.size > 5 * 1024 * 1024) {
              setFormErrors(prev => ({ ...prev, images: `${file.name} exceeds 5MB limit` }));
              return true;
          }
          if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
              setFormErrors(prev => ({ ...prev, images: `${file.name} must be JPEG, PNG, or WEBP` }));
              return true;
          }
          return false;
      });

      if (!validationError) {
          setImages(files);
          setFormErrors(prev => ({ ...prev, images: null })); // Clear specific error
      }
  };

  const handlePriceChange = (value) => {
      if (parseFloat(value) <= 0) {
          setFormErrors(prev => ({ ...prev, price: "Price must be greater than 0" }));
      } else if (parseFloat(value) > 999999.99) {
          setFormErrors(prev => ({ ...prev, price: "Price exceeds the maximum limit" }));
      } else {
          setFormErrors(prev => ({ ...prev, price: null }));
      }
    setPrice(value);
  };

  const handleStockChange = (value) => {
      if (parseFloat(value) < 0) {
          setFormErrors(prev => ({ ...prev, stock: "Stock cannot be negative" }));
      } else {
          setFormErrors(prev => ({ ...prev, stock: null }));
      }
    setStock(value);
  };

  const validateForm = () => {
      const errors = {};

      if (!name.trim()) errors.name = "Product name is required.";
      if(name.length < 3) errors.name = "Product name should be at least 3 characters long."
      if(name.length > 100) errors.name = "Product name should be less than 100 characters."
      if (!category) errors.category = "Please select a category.";
      if (!description.trim()) errors.description = "Description is required.";
      if(description.length < 10) errors.description = "Description should be at least 10 characters long"

      if (!price.trim()) {
          errors.price = "Price is required."
      } else if (parseFloat(price) <= 0) {
          errors.price = "Price must be greater than 0";
      } else if (parseFloat(price) > 999999.99) {
          errors.price = "Price exceeds the maximum limit";
      }
      if (!stock.trim()) {
          errors.stock = "Stock is required"
      }
      else if (parseFloat(stock) < 0) errors.stock = "Stock cannot be negative";


      setFormErrors(errors);

      return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
      if (!validateForm()) {
          return;
      }


    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("stock", stock);
    formData.append("category_id", category);
      formData.append("unit", unit)
      formData.append("is_available", isAvailable)

    if (images.length > 0) {
      images.forEach((image) => formData.append("images", image));
    }

      try {
      const response = await api.post("marketplace/products/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authTokens?.access}`,
        },
      });

      if (response.status === 201) {
        navigate("/marketplace/my-products/");
      } else {
          let errorMessage = "Failed to create product.";
          if (typeof response.data === 'string') {
              errorMessage = response.data;
          } else if (typeof response.data === 'object') {
              const errors = [];
              for (const [key, value] of Object.entries(response.data)) {
                  if (Array.isArray(value)) {
                      errors.push(`${key}: ${value.join(", ")}`);
                  } else {
                      errors.push(`${key}: ${value}`);
                  }
              }
              errorMessage = errors.join("\n");
          }
          setFormErrors(prev => ({ ...prev, submit: errorMessage }));
      }
    } catch (err) {
          let errorMessage = "Failed to create product.";
          if (err.response?.data) {
              if (typeof err.response.data === 'string') {
                  errorMessage = err.response.data
              } else if(typeof err.response.data === 'object') {
                  const errors = [];
                  for (const [key, value] of Object.entries(err.response.data)) {
                      if (Array.isArray(value)) {
                          errors.push(`${key}: ${value.join(", ")}`);
                      } else {
                          errors.push(`${key}: ${value}`);
                      }
                  }
                  errorMessage = errors.join("\n");
              }

          }
        setFormErrors(prev => ({ ...prev, submit: errorMessage }));
    }
  };

  return (
    <div className="create-product-page">
      <h2>List a New Product</h2>
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label htmlFor="name">Product Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`form-control ${formErrors.name ? "is-invalid" : ""}`}
            placeholder="Enter product name"
              aria-label="Product Name"
              aria-invalid={!!formErrors.name}
              required
          />
            {formErrors.name && (
                <div className="invalid-feedback">{formErrors.name}</div>
            )}

        </div>
        <div className="form-group">
          <label htmlFor="category_id">Category:</label>
          <select
            id="category_id"
            value={category}
            onChange={(e) => {
                setCategory(e.target.value);
            }}
            className={`form-select ${formErrors.category ? "is-invalid" : ""}`}
              aria-label="Category"
              aria-invalid={!!formErrors.category}
              required
            disabled={loadingCategories || (categories.length === 0 && !formErrors.category)}
          >
            <option value="">Select a category</option>
            {loadingCategories ? (
              <option value="" disabled>
                Loading categories...
              </option>
            ) : categories.length > 0 ? (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No categories available
              </option>
            )}
          </select>
            {formErrors.category && (
                <div className="invalid-feedback">{formErrors.category}</div>
            )}

        </div>

        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`form-control ${
              formErrors.description ? "is-invalid" : ""
            }`}
            placeholder="Enter product description"
            rows="4"
              aria-label="Description"
              aria-invalid={!!formErrors.description}
              required
          />
            {formErrors.description && (
                <div className="invalid-feedback">{formErrors.description}</div>
            )}

        </div>
        <div className="form-group">
          <label htmlFor="price">Price:</label>
          <div className="input-group">
            <span className="input-group-text">$</span>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={`form-control ${formErrors.price ? "is-invalid" : ""}`}
              placeholder="0.00"
                min="0.01"
                step="0.01"
                max="999999.99"
                aria-label="Price"
                aria-invalid={!!formErrors.price}
              required
            />
              {formErrors.price && (
                  <div className="invalid-feedback">{formErrors.price}</div>
              )}

          </div>

        </div>
        <div className="form-group">
          <label htmlFor="unit">Unit:</label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="form-select"
              aria-label="Unit"
            required
          >
            <option value="kg">Kilograms (kg)</option>
            <option value="g">Grams (g)</option>
            <option value="ton">Tons (ton)</option>
            <option value="l">Liters (l)</option>
              <option value="d">Dozen(l)</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            value={stock}
            onChange={(e) => handleStockChange(e.target.value)}
              className={`form-control ${formErrors.stock ? "is-invalid" : ""}`}
            placeholder="Enter stock quantity"
              min="0"
              aria-label="Stock"
              aria-invalid={!!formErrors.stock}
              required
          />
            {formErrors.stock && (
                <div className="invalid-feedback">{formErrors.stock}</div>
            )}

        </div>
        <div className="form-group form-check form-switch">
          <input
            type="checkbox"
            id="is_available"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="form-check-input"
            role="switch"
              aria-label="Enable this to make the product visible in the marketplace"
          />
          <label className="form-check-label" htmlFor="is_available">
            Active
          </label>
            <small className="form-text text-muted">
                Enable this to make the product visible in the marketplace
            </small>
        </div>
        <div className="form-group">
          <label htmlFor="images">Additional Images:</label>
          <input
            type="file"
            id="images"
            multiple
            onChange={handleImageChange}
              className={`form-control ${formErrors.images ? "is-invalid" : ""}`}
            accept="image/jpeg, image/png, image/webp"
              aria-label="Additional Images"
              aria-invalid={!!formErrors.images}
          />
            {formErrors.images && (
                <div className="invalid-feedback">{formErrors.images}</div>
            )}
        </div>
        <button type="submit" className="button primary" disabled={loadingCategories}>
          List Product
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;