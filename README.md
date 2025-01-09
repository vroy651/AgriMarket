# `frontend/src/App.js` README

This file serves as the main entry point for the frontend application, defining the overall structure and routing using React Router.

## Overview

`App.js` sets up the application's routing using `BrowserRouter` and renders the core layout component `Layout` which wraps around all the page content. It then defines the routes for the various pages in the application using the `Routes` and `Route` components.

## Key Components and Functionality

- **`BrowserRouter`:** This component enables client-side routing using the history API. It is the core of React Router and enables navigation between different routes within our application.

- **`Layout`:** This is a custom component which is responsible for rendering the shared parts of the UI such as the header and footer. All pages are rendered within this component.

- **`Routes` and `Route`:**
  -   `Routes` acts as a container for all the individual routes of your application.
  -   `Route` defines a specific route with a path and corresponding component.

- **Pages (Components) and Corresponding Routes:**

  -   `/`: Renders the `HomePage` component. This serves as the home or landing page of the application.
  -   `/signup/`: Renders the `SignupPage` component, allowing users to create new accounts.
  -   `/login/`: Renders the `LoginPage` component, allowing users to log in with existing accounts.
    -   `/products/search`: Renders the `SearchResults` component, handling product search functionalities.
  -   `/products/`: Renders the `ProductListPage` component, displaying a list of all available products.
  -   `/products/:slug/`: Renders the `ProductDetailPage` component, displaying details for a specific product using its URL slug.
  -   `/products/create/`: Renders the `CreateProductPage` component, enabling users to create and add new products.
  -   `/products/edit/:slug/`: Renders the `EditProductPage` component, enabling users to edit existing products via their slug in URL.
  -   `/my-products/`: Renders the `MyProductsPage` component, displaying a list of the products created by the logged-in user.
  -   `/products/:productId/place-order/`: Renders the `PlaceOrderPage` component allowing a user to place an order.
  -   `/orders/`: Renders the `OrderListPage` component, showing a list of all orders for the logged in user.
  -   `/orders/:orderId/`: Renders the `OrderDetailPage` component displaying details for a specific order.
  -   `/seller-orders/`: Renders the `SellerOrderListPage` component, displaying orders for products created by the seller.
  -   `/weather/`: Renders the `WeatherPage` component, displaying weather information.
  -   `/crop-calendar/`: Renders the `CropCalendarPage` component, providing a crop calendar guide.
  -   `/market-prices/`: Renders the `MarketPricesPage` component, displaying market prices for crops.
  -   `/pest-disease-tracker/`: Renders the `PestDiseaseTrackerPage` component, allowing users to track pest and disease problems on their farms.
  -   `/profile/`: Renders the `UserProfilePage` component, allowing users to manage their profile settings.
  -   `*`: Renders the `NotFoundPage` component, for any invalid or unmapped routes in the application.

- **`./App.css`**: This imports the global styles for the application.

## Explanation

The code starts by importing required modules and components. It then sets up a `Router` using `BrowserRouter` which creates a routing context to navigate between pages.

The `Layout` component is responsible for providing a consistent structure to the pages. Inside the `Layout`, `Routes` are defined. Each `Route` specifies a URL path (`path`) and the React component (`element`) to render when that path is accessed.

The paths are used to navigate between different application features. For example, navigating to `/products/` will render the list of products, while navigating to `/products/some-product-slug/` will render the details for the product with the matching slug. The `*` route handles all undefined routes by rendering a `NotFoundPage`.

## Usage

This file is the starting point for the React application. It will be loaded when the application starts. The defined routes determine how the UI components are rendered in response to URL changes.

## Notes

- Ensure all the referenced components (`Layout`, `HomePage`, `SignupPage`, `LoginPage`, etc.) are properly implemented and exported in their respective files.
- The application utilizes URL parameters (`:slug` and `:productId`, `:orderId`) for product detail and order detail pages, requiring that the components extract those parameters using React Router's `useParams` hook.
- You can add or modify routes and components within the `Routes` section as per the project's requirements.



# FarmLand AI API - Backend Documentation

This document provides a detailed overview of the backend API for the FarmLand AI platform, built using Django REST Framework. It covers the API's functionality, endpoints, data models, authentication, and important development details.

## Overview

The FarmLand AI API facilitates various agricultural operations by providing a comprehensive set of endpoints for product management, order processing, user authentication, and agricultural data access. This document details how to interact with these endpoints and understand the underlying logic.

## Table of Contents

1.  **Setup and Environment**
    *   [Prerequisites](#prerequisites)
    *   [Environment Variables](#environment-variables)
2.  **Data Models**
    *   [Product](#product-model)
    *   [Category](#category-model)
    *   [Product Image](#product-image-model)
    *   [Order](#order-model)
    *   [Product View](#product-view-model)
    *   [Notification](#notification-model)
    *   [User](#user-model)
3.  **API Endpoints**
    *   [Product Management](#product-management-endpoints)
    *   [Order Management](#order-management-endpoints)
    *   [Category Management](#category-management-endpoints)
     *   [Product Search](#product-search-endpoints)
    *   [Weather Data](#weather-data-endpoints)
    *   [Market Prices Data](#market-prices-data-endpoints)
    *   [Crop Calendar](#crop-calendar-endpoints)
    *   [Pest/Disease Tracking](#pestdisease-tracking-endpoints)
    *   [User Authentication](#user-authentication-endpoints)
    *   [User Profile Management](#user-profile-endpoints)
4.  **Authentication and Authorization**
    *   [JWT Authentication](#jwt-authentication)
    *   [Permissions](#permissions)
5. **Caching**
    * [Product List Caching](#product-list-caching)
    * [Product Detail Caching](#product-detail-caching)
    * [Weather Data Caching](#weather-data-caching)
    * [Market Price Caching](#market-price-caching)
6.  **Error Handling**
    *   [General Error Handling](#general-error-handling)
    *   [Validation Errors](#validation-errors)
7.  **Logging**
    *   [Logging Configuration](#logging-configuration)
8.  **Testing**
    * [API Documentation](#api-documentation)
9.  **Development Tools**
    * [Debug Toolbar](#debug-toolbar)
10. **Urls**
     * [App Urls](#app-urls)
     * [Project Urls](#project-urls)

## 1. Setup and Environment

### Prerequisites

Before you begin, make sure you have the following installed:

*   **Python 3.8+**
*   **pip** (Python package installer)
*   **Virtualenv** (recommended for managing Python environments)
*   **PostgreSQL** or any other compatible database
*   **git** (for version control)

Steps to set up environment:

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  Create a virtual environment:

    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:

    ```bash
    # On macOS and Linux:
    source venv/bin/activate

    # On Windows:
    venv\Scripts\activate
    ```
4.  Install the required packages:
    ```bash
    pip install -r requirements.txt
    ```

5. Create a `.env` file in root directory using the `.env.example`
6. Make necessary configurations in `settings.py`

### Environment Variables

You must create a `.env` file in your project root to configure the following environment variables:

*   `SECRET_KEY`: Django's secret key.
*   `DEBUG`: Set to `True` for development, `False` for production.
*   `DATABASE_URL`: Database connection URL. e.g. `postgres://user:password@host:port/dbname`
*   `WEATHER_API_KEY`: API key for the weather service (`weatherapi.com`).
*   `MARKET_PRICE_API_KEY`: API key for market price data.
*   `GOOGLE_API_KEY`: Google API key for pest/disease analysis.
*   `EMAIL_HOST`: Email service hostname.
*   `EMAIL_HOST_USER`: Email service username.
*   `EMAIL_HOST_PASSWORD`: Email service password.
*   `EMAIL_PORT`: Email service port.
*   `EMAIL_USE_TLS`: Use TLS for email connection (set to `True`).
*   `DEFAULT_FROM_EMAIL`: Default 'from' email address.

## 2. Data Models

### Product Model
*   **Fields:**
    *   `name` (CharField): Name of the product.
    *   `slug` (SlugField): URL-friendly identifier for the product, automatically generated from `name`
    *   `description` (TextField): Detailed description of the product.
    *   `price` (DecimalField): Price of the product.
    *   `stock` (PositiveIntegerField): Available stock of the product.
    *   `is_available` (BooleanField): Indicates if the product is available for sale.
    *   `category` (ForeignKey to `Category`): Category the product belongs to.
    *   `seller` (ForeignKey to `User`): Seller of the product.
    *   `created_at` (DateTimeField): Timestamp of product creation.
    *   `updated_at` (DateTimeField): Timestamp of the last product update.
    *   `views`(PositiveIntegerField): Total views count of the product
*   **Methods:**
    *   `search(query, filters)`: Performs a search based on the given query and filters.

### Category Model
*   **Fields:**
    *   `name` (CharField): Name of the product category.

### Product Image Model
*   **Fields:**
    *   `product` (ForeignKey to `Product`): Product this image belongs to.
    *   `image` (ImageField): Image file.
    *   `created_at` (DateTimeField): Timestamp of image upload.

### Order Model
*   **Fields:**
    *   `buyer` (ForeignKey to `User`): Buyer who placed the order.
    *   `seller` (ForeignKey to `User`): Seller of the product in the order.
    *   `product` (ForeignKey to `Product`): Product ordered.
    *   `quantity` (PositiveIntegerField): Quantity of the product ordered.
    *   `total_price` (DecimalField): Total price of the order.
    *   `status` (CharField): Status of the order (`pending`, `processing`, `completed`, `cancelled`).
    *   `created_at` (DateTimeField): Timestamp of order creation.
    *   `updated_at` (DateTimeField): Timestamp of last order update.
    *   `cancellation_reason` (CharField, Nullable): The reason the order was cancelled
*   **Methods:**
    *   `confirm_order()`: Update order status to 'completed'
    *   `cancel_order(reason)`: Update order status to 'cancelled' and add reason for cancellation

### Product View Model
*   **Fields:**
    *   `product` (ForeignKey to `Product`): Product that was viewed.
    *   `user` (ForeignKey to `User`, Nullable): User who viewed the product, if authenticated.
    *   `viewed_at` (DateTimeField): Timestamp of when the product was viewed.

### Notification Model
*   **Fields:**
    *   `recipient` (ForeignKey to `User`): User who is recipient.
    *   `message` (TextField): Notification message.
    *   `type` (CharField): Type of notification (e.g., 'new_order').
    *    `reference_id` (IntegerField): Reference ID of the related object e.g. `order_id`
    *   `created_at` (DateTimeField): Timestamp of when the notification was created.
    *   `is_read` (BooleanField): True when the notification is read by user.

### User Model
*   **Fields:**
    *   Inherits from Django's default User model with additional fields like `first_name`, `last_name`.
    *   `is_seller`(BooleanField): True if the user is a seller

## 3. API Endpoints

### Product Management Endpoints

*   **`GET /api/v1/marketplace/products/`**: Get a paginated list of all available products. Supports query parameters for filtering and searching.
*   **`GET /api/v1/marketplace/products/{slug}/`**: Retrieve details of a specific product using its slug.
*   **`POST /api/v1/marketplace/products/`**: Create a new product (requires seller authentication). Supports multiple images uploaded using `multipart/form-data`
*   **`PUT /api/v1/marketplace/products/{slug}/`**: Update an existing product (requires seller authentication). Supports partial updates.
*   **`DELETE /api/v1/marketplace/products/{slug}/`**: Delete an existing product (requires seller authentication).
*   **`DELETE /api/v1/marketplace/products/{slug}/images/{image_id}/`**: Delete an image from a specific product (requires seller authentication).
*   **`GET /api/v1/marketplace/my-products/`**: Get a paginated list of the authenticated user's products (requires seller authentication).
*   **`GET /api/v1/marketplace/search/`**: Get a paginated list of products based on search query. Supports filters by category, min_price, and max_price.

### Order Management Endpoints
*   **`GET /api/v1/marketplace/orders/`**: Get a paginated list of orders of the authenticated user. Supports filtering by order status.
*   **`POST /api/v1/marketplace/orders/`**: Create a new order (requires buyer authentication). Requires `product_id`, `quantity` in request body.
*   **`GET /api/v1/marketplace/orders/{id}/`**: Retrieve details of a specific order.
*    **`PUT /api/v1/marketplace/orders/{id}/`**: Update an order's detail (requires seller or buyer authentication).
*    **`DELETE /api/v1/marketplace/orders/{id}/`**: Delete an order (requires seller or buyer authentication).
*   **`GET /api/v1/marketplace/seller-orders/`**: Get a paginated list of orders for the authenticated seller.
*   **`POST /api/v1/marketplace/order/{id}/confirm/`**: Confirm an order (requires seller authentication).
*   **`POST /api/v1/marketplace/order/{id}/cancel/`**: Cancel an order (requires seller or buyer authentication).

### Category Management Endpoints
*   **`GET /api/v1/marketplace/categories/`**: Get a paginated list of all categories.

### Product Search Endpoints
*   **`GET /api/v1/marketplace/search/?q=keyword&category=id&min_price=10&max_price=100&page=1&page_size=20`**: Get a paginated list of products matching the search criteria.

   *   `q`: Search keyword
   *   `category`: Category ID to filter by
   *   `min_price`: Minimum price filter
   *   `max_price`: Maximum price filter
   *   `page`: page number (default=1)
   *   `page_size`: items per page (default=20)

### Weather Data Endpoints
*   **`GET /api/v1/marketplace/weather/?latitude=value&longitude=value`**: Get current weather data for a given latitude and longitude (requires authentication).

### Market Prices Data Endpoints
*   **`GET /api/v1/marketplace/market-prices/?commodity=optional-value`**: Get market price data, can filter by commodity (requires authentication).

### Crop Calendar Endpoints
*   **`GET /api/v1/marketplace/crop-calendar/?latitude=value&longitude=value&month=optional-month`**: Get a crop calendar based on location, optionally by month (requires authentication).

### Pest/Disease Tracking Endpoints
*   **`POST /api/v1/marketplace/pest-disease-tracker/`**: Analyze images for pest/disease detection using Google Gemini (requires authentication). Requires `soilImage` or `leafImage` in the form data.

### User Authentication Endpoints
*   **`POST /api/v1/users/signup/`**: Create a new user account.
*   **`POST /api/v1/users/login/`**: Login a user and generate JWT token
*   **`POST /api/v1/users/jwt/create/`**: Get a new pair of access and refresh tokens.
*   **`POST /api/v1/users/jwt/refresh/`**: Refresh an access token using a refresh token.

### User Profile Endpoints
*   **`GET /api/v1/users/me/`**: Retrieve details of the authenticated user.
*   **`PUT /api/v1/users/me/`**: Update details of the authenticated user.
*   **`DELETE /api/v1/users/me/`**: Delete details of the authenticated user.

## 4. Authentication and Authorization

### JWT Authentication

This API uses JSON Web Tokens (JWT) for authentication.

*   Users can log in with username and password to receive access and refresh tokens.
*   The `Authorization` header with `Bearer <access-token>` is required for most API endpoints.
*   A refresh token is used to obtain a new access token when the current access token expires.

### Permissions

The following custom permission classes are used:

*   **`IsSellerOrReadOnly`**: Allows sellers to modify product data, others can only read.
*   **`IsOrderParticipant`**: Allows order participants (buyers and sellers) to view, update or cancel orders.

## 5. Caching

This application uses Django's caching system to improve performance and reduce database load.

### Product List Caching
*   The `ProductViewSet.get_queryset()` method caches the product list for 5 minutes per user. This cache is bypassed if the user makes a search or filter request
*   The cache key is made unique for each user (or anonymous user).

### Product Detail Caching
*   The product detail view is cached using `@method_decorator(cache_page(60 * 5))` for 5 minutes to reduce the load on the database.

### Weather Data Caching
*   Weather data from the external API is cached for 30 minutes (1800 seconds).

### Market Price Caching
*   Market price data from the external API is cached for 1 hour (3600 seconds).

## 6. Error Handling

### General Error Handling

*   The API returns appropriate HTTP status codes for different errors.
*   Error responses are structured in JSON format.

### Validation Errors

*   Input validation is performed using Django REST Framework serializers.
*   Invalid input data results in a `400 Bad Request` response.
*   Validation error messages are included in the JSON response.

## 7. Logging

### Logging Configuration

*   Python's `logging` module is used.
*   Errors are logged to the console and file (if configured).
*   Logger named `__name__` in `views.py`

## 8. Testing
### API Documentation
* The API includes documentation using DRF's `include_docs_urls`, viewable on `/api/docs/`
* Documentation includes all API endpoints, request and response schemas

## 9. Development Tools

### Debug Toolbar

*   Django Debug Toolbar is included for development (only if DEBUG = True)
*   Allows detailed performance analysis of queries and requests

## 10. Urls

### App Urls
All urls are defined under `marketplace/urls.py`

*   `r'products'` : URLS for product management.
*   `r'orders'`: URLS for order management.
*   `r'categories'`: URLS for category management.
*   `search/`: URLS for product search.
*   `my-products/`: URLS to fetch user's products.
*   `seller-orders/`: URLS to fetch seller's order.
*   `order/<int:pk>/confirm/`: URLS for confirming order by seller.
*   `order/<int:pk>/cancel/`: URLS for cancelling order by seller or buyer.
*   `weather/`: URLS to fetch weather data.
*   `crop-calendar/`: URLS for crop calendar generation.
*   `market-prices/`: URLS for market price retrieval.
*   `pest-disease-tracker/`: URLS for pest and disease tracking.
*   `signup/`: URLS for user sign up.
*   `login/`: URLS for user login.
*   `user/`: URLS for user profile management.

### Project Urls
All urls for the project are defined in `config/urls.py`

*   `admin/`: URLS for accessing admin panel.
*   `api/v1/` : URLS for api endpoints
     *    `users/`: URLS for user related functionalities like signup and login
     *    `marketplace/`: URLS for marketplace apis
     *    `store/` : URLS for store related APIs.
*   `api/docs/`: URLS for API documentation
*   `jwt/create/`: URLS for generating token pair
*   `jwt/refresh/`: URLS for refreshing the token
*   `__debug__/'`:  URLS for Django Debug Toolbar when in Debug Mode.
*   `media/` URLS for media files in the application.
*   `static/` URLS for static files in the application.


---

This comprehensive documentation should help you understand, use, and contribute to the FarmLand AI API effectively. If you encounter any issues, please feel free to raise questions.