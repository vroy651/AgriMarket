import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import './styles/OrderListPage.css';
import { Search } from "lucide-react";

const OrderListPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { authTokens } = useAuth();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState('');
    const [orderStatusOptions, setOrderStatusOptions] = useState([])


    // Fetch Status Options
    const fetchOrderStatus = useCallback(async () => {
        try {
            const response = await api.get("marketplace/orders/");
            const statusOptions = [...new Set(response.data.results.map(order => order.status))]
            setOrderStatusOptions(statusOptions)
        }
        catch (err) {
            console.error(err)
            setError("Failed to load status options")
        }
    }, [])

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                ...(searchQuery && { search: searchQuery }),
                ...(statusFilter && { status: statusFilter })
            });
            const response = await api.get(`marketplace/orders/?${queryParams}`, {
                headers: { Authorization: `Bearer ${authTokens?.access}` },
            });
            setOrders(response.data.results);
            setTotalPages(Math.ceil(response.data.count / 10));

            setError("");
        } catch (err) {
            setError(err.message || 'Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    }, [authTokens, currentPage, searchQuery, statusFilter]);


    useEffect(() => {
        fetchOrderStatus()
        fetchOrders();
    }, [authTokens, fetchOrders, fetchOrderStatus]);

    useEffect(() => {
        setCurrentPage(1);
        fetchOrders();
    }, [statusFilter, searchQuery, fetchOrders]);


    const handleStatusChange = (e) => {
        setStatusFilter(e.target.value);
    };


    if (loading) {
        return <div className="loading">Loading orders...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="order-list-page">
            <h2>My Orders</h2>
            <div className='order-filter-section'>
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <select
                    className="order-select"
                    value={statusFilter}
                    onChange={handleStatusChange}
                >
                    <option value="">All Statuses</option>
                    {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>
            <div className="order-table">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product</th>
                            <th>Image</th>
                            <th>Quantity</th>
                            <th>Total Price</th>
                            <th>Status</th>
                            <th>Order Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders && orders.length > 0 ? (
                         orders.map((order) => (
                            <tr key={order?.id}>
                                <td>{order?.id}</td>
                                <td>{order?.product?.name ?? 'N/A'}</td>
                                <td>
                                    {order?.product?.images && order?.product?.images.length > 0 && (
                                        <img
                                            src={order.product.images[0]?.image}
                                            alt={order?.product?.name}
                                            className="product-image-small"
                                        />
                                    )}
                                </td>
                                <td>{order?.quantity}</td>
                                <td>${order?.total_price}</td>
                                <td>
                                    <span className={`order-status ${order?.status?.toLowerCase()?.replace(' ', '-')}`}>
                                        {order?.status}
                                    </span>
                                </td>
                                <td>{new Date(order?.created_at)?.toLocaleDateString()}</td>
                            </tr>
                            ))
                        ) : (
                            <tr><td colSpan={7} style={{textAlign:"center"}}>No orders found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
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
        </div>
    );
};

export default OrderListPage;