import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Truck,
    Users,
    MapPin,
    Fuel,
    Wrench,
    BarChart3,
    Settings,
    Bell,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Fleet', icon: Truck, path: '/vehicles', roles: ['manager', 'dispatcher', 'safety_officer', 'financial_analyst'] },
    { name: 'Drivers', icon: Users, path: '/drivers', roles: ['manager', 'dispatcher'] },
    { name: 'Trips', icon: MapPin, path: '/trips', roles: ['manager', 'dispatcher'] },
    { name: 'Fuel & Expenses', icon: Fuel, path: '/expenses', roles: ['manager', 'financial_analyst'] },
    { name: 'Maintenance', icon: Wrench, path: '/maintenance', roles: ['manager', 'safety_officer'] },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['manager', 'financial_analyst'] },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Settings', icon: Settings, path: '/settings' },
];

const canAccessNavItem = (item, role) => !item.roles || item.roles.includes(role);

const Sidebar = () => {
    const { logout, user } = useAuth();
    const visibleNavItems = navItems.filter((item) => canAccessNavItem(item, user?.role));

    return (
        <aside className="sidebar glass-effect">
            <div className="sidebar-header">
                <div className="sidebar-logo">transit<span>Ops</span></div>
            </div>

            <nav className="sidebar-nav" aria-label="Main navigation">
                {visibleNavItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${item.path === '/settings' ? 'settings-nav-item' : ''} ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/profile" className="user-profile-link">
                    <div className="user-profile">
                        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="user-info">
                            <p className="user-name">{user?.name || 'User'}</p>
                            <p className="user-role">{user?.role || 'Manager'}</p>
                        </div>
                    </div>
                </NavLink>
                <button onClick={logout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;