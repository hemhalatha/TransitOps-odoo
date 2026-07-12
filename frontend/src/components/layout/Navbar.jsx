import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import api from '../../services/api';
import './Navbar.css';

const Navbar = ({ title }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            if (response.data.status) {
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        const handleUpdate = () => fetchUnreadCount();
        window.addEventListener('notifications:updated', handleUpdate);

        const interval = window.setInterval(fetchUnreadCount, 60000);
        return () => {
            window.removeEventListener('notifications:updated', handleUpdate);
            window.clearInterval(interval);
        };
    }, []);

    return (
        <header className="navbar glass-effect">
            <div className="navbar-left">
                <h1>{title}</h1>
            </div>
            <div className="navbar-right">
                <Link to="/notifications" className="notification-bell" aria-label="Notifications">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
};

export default Navbar;
