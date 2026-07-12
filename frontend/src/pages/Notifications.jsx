import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Bell,
    CheckCheck,
    Gauge,
    ShieldAlert,
    Wrench,
} from 'lucide-react';
import Button from '../components/common/Button';
import api from '../services/api';
import './Notifications.css';

const TYPE_ICONS = {
    license_expiry: ShieldAlert,
    maintenance_overdue: Wrench,
    fleet_utilization: Gauge,
    safety_score: AlertTriangle,
    expense_approval: AlertTriangle,
};

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString();
};

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);
    const [error, setError] = useState('');

    const fetchNotifications = useCallback(async () => {
        try {
            setError('');
            const response = await api.get('/notifications');
            if (response.data.status) {
                setNotifications(response.data.notifications || []);
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load notifications.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}/read`);
            setNotifications((current) =>
                current.map((item) =>
                    item._id === notificationId
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item
                )
            );
            window.dispatchEvent(new Event('notifications:updated'));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to mark notification as read.');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setMarkingAll(true);
            await api.patch('/notifications/read-all');
            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    isRead: true,
                    readAt: new Date().toISOString(),
                }))
            );
            window.dispatchEvent(new Event('notifications:updated'));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to mark all notifications as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    if (loading) {
        return (
            <div className="notifications-loading">
                <div className="loader"></div>
                <p>Loading notifications...</p>
            </div>
        );
    }

    return (
        <div className="notifications-page animate-fade-in">
            <div className="notifications-header glass-effect">
                <div>
                    <h2>Notification Center</h2>
                    <p>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
                </div>
                <div className="notifications-actions">
                    <Button
                        variant="secondary"
                        icon={CheckCheck}
                        onClick={handleMarkAllRead}
                        isLoading={markingAll}
                        disabled={unreadCount === 0}
                    >
                        Mark All as Read
                    </Button>
                </div>
            </div>

            {error && <p className="notifications-error">{error}</p>}

            {notifications.length === 0 ? (
                <div className="notifications-empty glass-card">
                    <Bell size={28} />
                    <h3>No notifications yet</h3>
                    <p>Automated alerts for license expiry and maintenance will appear here.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notification) => {
                        const Icon = TYPE_ICONS[notification.type] || Bell;
                        return (
                            <article
                                key={notification._id}
                                className={`notification-card glass-card ${notification.isRead ? 'read' : 'unread'}`}
                            >
                                <div className={`notification-icon severity-${notification.severity}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="notification-content">
                                    <div className="notification-top">
                                        <h3>{notification.title}</h3>
                                        <span className={`severity-badge ${notification.severity}`}>
                                            {notification.severity}
                                        </span>
                                    </div>
                                    <p>{notification.message}</p>
                                    <small>{formatDate(notification.createdAt)}</small>
                                </div>
                                <div className="notification-actions">
                                    {!notification.isRead && (
                                        <Button
                                            variant="outline"
                                            onClick={() => handleMarkRead(notification._id)}
                                        >
                                            Mark as Read
                                        </Button>
                                    )}
                                    {notification.entityType === 'vehicle' && notification.entityId && (
                                        <Button variant="secondary" onClick={() => navigate('/maintenance')}>
                                            View Maintenance
                                        </Button>
                                    )}
                                    {notification.entityType === 'driver' && notification.entityId && (
                                        <Button variant="secondary" onClick={() => navigate('/drivers')}>
                                            View Drivers
                                        </Button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Notifications;
