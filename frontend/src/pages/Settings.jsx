import { useMemo, useState } from 'react';
import { Check, Minus, Save, Search, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const permissions = [
    {
        role: 'Fleet Manager',
        fleet: 'full',
        drivers: 'full',
        trips: 'none',
        fuel: 'none',
        analytics: 'full',
    },
    {
        role: 'Dispatcher',
        fleet: 'view',
        drivers: 'none',
        trips: 'full',
        fuel: 'none',
        analytics: 'none',
    },
    {
        role: 'Safety Officer',
        fleet: 'none',
        drivers: 'full',
        trips: 'view',
        fuel: 'none',
        analytics: 'none',
    },
    {
        role: 'Financial Analyst',
        fleet: 'view',
        drivers: 'none',
        trips: 'none',
        fuel: 'full',
        analytics: 'full',
    },
];

const modules = [
    { key: 'fleet', label: 'Fleet' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'trips', label: 'Trips' },
    { key: 'fuel', label: 'Fuel/Exp.' },
    { key: 'analytics', label: 'Analytics' },
];

const Settings = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        depotName: 'Gandhinagar Depot GT4',
        currency: 'INR (Rs)',
        distanceUnit: 'kilometers',
    });
    const [saved, setSaved] = useState(false);
    const [query, setQuery] = useState('');

    const filteredPermissions = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return permissions;

        return permissions.filter((item) => item.role.toLowerCase().includes(normalized));
    }, [query]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setSettings((current) => ({ ...current, [name]: value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2400);
    };

    const renderPermission = (value) => {
        if (value === 'full') {
            return <Check className="permission-icon allowed" size={16} aria-label="Allowed" />;
        }

        if (value === 'view') {
            return <span className="permission-view">view</span>;
        }

        return <Minus className="permission-icon denied" size={16} aria-label="Not allowed" />;
    };

    return (
        <div className="settings-page animate-fade-in">
            <div className="settings-topbar glass-effect">
                <label className="settings-search" aria-label="Search roles">
                    <Search size={16} />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search roles..."
                    />
                </label>

                <div className="settings-user-chip">
                    <span className="settings-user-name">{user?.name || 'TransitOps User'}</span>
                    <span className="settings-user-role">{user?.role?.replace('_', ' ') || 'manager'}</span>
                    <span className="settings-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'T'}</span>
                </div>
            </div>

            <div className="settings-content-grid">
                <section className="settings-panel general-panel" aria-labelledby="general-settings-title">
                    <div className="settings-section-title">
                        <ShieldCheck size={18} />
                        <h2 id="general-settings-title">General</h2>
                    </div>

                    <div className="settings-form">
                        <label className="settings-field">
                            <span>Depot Name</span>
                            <input
                                name="depotName"
                                value={settings.depotName}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="settings-field">
                            <span>Currency</span>
                            <select name="currency" value={settings.currency} onChange={handleChange}>
                                <option>INR (Rs)</option>
                                <option>USD ($)</option>
                                <option>EUR (€)</option>
                            </select>
                        </label>

                        <label className="settings-field">
                            <span>Distance Unit</span>
                            <select name="distanceUnit" value={settings.distanceUnit} onChange={handleChange}>
                                <option value="kilometers">kilometers</option>
                                <option value="miles">miles</option>
                            </select>
                        </label>

                        <Button icon={Save} onClick={handleSave}>Save Changes</Button>
                        {saved && <p className="settings-save-note">Settings saved for this session.</p>}
                    </div>
                </section>

                <section className="settings-panel rbac-panel" aria-labelledby="rbac-title">
                    <div className="settings-section-title">
                        <ShieldCheck size={18} />
                        <h2 id="rbac-title">Role-Based Access (RBAC)</h2>
                    </div>

                    <div className="rbac-table-wrap">
                        <table className="rbac-table">
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    {modules.map((module) => <th key={module.key}>{module.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPermissions.map((row) => (
                                    <tr key={row.role}>
                                        <td className="role-name">{row.role}</td>
                                        {modules.map((module) => (
                                            <td key={module.key}>{renderPermission(row[module.key])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;