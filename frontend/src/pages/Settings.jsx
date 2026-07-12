import { useEffect, useMemo, useState } from 'react';
import { Check, Minus, Save, Search, ShieldCheck } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Settings.css';

const permissions = [
    {
        role: 'Fleet Manager',
        fleet: 'full',
        drivers: 'full',
        trips: 'full',
        maintenance: 'full',
        fuel: 'full',
        analytics: 'full',
    },
    {
        role: 'Dispatcher',
        fleet: 'view',
        drivers: 'full',
        trips: 'full',
        maintenance: 'view',
        fuel: 'full',
        analytics: 'none',
    },
    {
        role: 'Safety Officer',
        fleet: 'view',
        drivers: 'view',
        trips: 'view',
        maintenance: 'view',
        fuel: 'none',
        analytics: 'none',
    },
    {
        role: 'Financial Analyst',
        fleet: 'view',
        drivers: 'view',
        trips: 'view',
        maintenance: 'view',
        fuel: 'full',
        analytics: 'full',
    },
];

const modules = [
    { key: 'fleet', label: 'Fleet' },
    { key: 'drivers', label: 'Drivers' },
    { key: 'trips', label: 'Trips' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'fuel', label: 'Fuel/Exp.' },
    { key: 'analytics', label: 'Analytics' },
];

const DEFAULT_SETTINGS = {
    depotName: 'Gandhinagar Depot GT4',
    currency: 'INR',
    distanceUnit: 'kilometers',
    licenseExpiryWarningDays: 30,
    minimumDriverSafetyScore: 70,
    fleetUtilizationWarningThreshold: 60,
    maintenanceReminderIntervalDays: 90,
    highExpenseApprovalThreshold: 10000,
};

const Settings = () => {
    const { user, isManager } = useAuth();
    const canEdit = isManager();
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                if (response.data.status && response.data.settings) {
                    const {
                        depotName,
                        currency,
                        distanceUnit,
                        licenseExpiryWarningDays,
                        minimumDriverSafetyScore,
                        fleetUtilizationWarningThreshold,
                        maintenanceReminderIntervalDays,
                        highExpenseApprovalThreshold,
                    } = response.data.settings;
                    setSettings({
                        depotName,
                        currency,
                        distanceUnit,
                        licenseExpiryWarningDays,
                        minimumDriverSafetyScore,
                        fleetUtilizationWarningThreshold,
                        maintenanceReminderIntervalDays,
                        highExpenseApprovalThreshold,
                    });
                }
            } catch (requestError) {
                setError(requestError.response?.data?.message || 'Unable to load settings.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const filteredPermissions = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return permissions;

        return permissions.filter((item) => item.role.toLowerCase().includes(normalized));
    }, [query]);

    const handleChange = (event) => {
        const { name, value, type } = event.target;
        setSettings((current) => ({
            ...current,
            [name]: type === 'number' ? Number(value) : value,
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            const response = await api.put('/settings', settings);
            if (response.data.status) {
                setSaved(true);
                window.setTimeout(() => setSaved(false), 2400);
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to save settings.');
        } finally {
            setSaving(false);
        }
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

    const renderNumberField = (name, label, min, max, step = 1) => (
        <label className="settings-field">
            <span>{label}</span>
            <input
                type="number"
                name={name}
                value={settings[name]}
                min={min}
                max={max}
                step={step}
                onChange={handleChange}
                disabled={!canEdit || loading}
            />
        </label>
    );

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

            {!canEdit && (
                <p className="settings-readonly-note glass-effect">
                    Settings are read-only for your role. Contact a Fleet Manager to make changes.
                </p>
            )}

            <div className="settings-content-grid">
                <div className="settings-left-column">
                    <section className="settings-panel general-panel" aria-labelledby="general-settings-title">
                        <div className="settings-section-title">
                            <ShieldCheck size={18} />
                            <h2 id="general-settings-title">Organization</h2>
                        </div>

                        <div className="settings-form">
                            <label className="settings-field">
                                <span>Depot Name</span>
                                <input
                                    name="depotName"
                                    value={settings.depotName}
                                    onChange={handleChange}
                                    disabled={!canEdit || loading}
                                />
                            </label>

                            <label className="settings-field">
                                <span>Currency</span>
                                <select
                                    name="currency"
                                    value={settings.currency}
                                    onChange={handleChange}
                                    disabled={!canEdit || loading}
                                >
                                    <option value="INR">INR (Rs)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                </select>
                            </label>

                            <label className="settings-field">
                                <span>Distance Unit</span>
                                <select
                                    name="distanceUnit"
                                    value={settings.distanceUnit}
                                    onChange={handleChange}
                                    disabled={!canEdit || loading}
                                >
                                    <option value="kilometers">kilometers</option>
                                    <option value="miles">miles</option>
                                </select>
                            </label>
                        </div>
                    </section>

                    <section className="settings-panel" aria-labelledby="business-rules-title">
                        <div className="settings-section-title">
                            <ShieldCheck size={18} />
                            <h2 id="business-rules-title">Business Rules</h2>
                        </div>

                        <div className="settings-form">
                            {renderNumberField('licenseExpiryWarningDays', 'License Expiry Warning (days)', 1, 365)}
                            {renderNumberField('minimumDriverSafetyScore', 'Minimum Driver Safety Score', 0, 100)}
                            {renderNumberField('fleetUtilizationWarningThreshold', 'Fleet Utilization Warning Threshold (%)', 0, 100)}
                        </div>
                    </section>

                    <section className="settings-panel" aria-labelledby="maintenance-settings-title">
                        <div className="settings-section-title">
                            <ShieldCheck size={18} />
                            <h2 id="maintenance-settings-title">Maintenance</h2>
                        </div>

                        <div className="settings-form">
                            {renderNumberField('maintenanceReminderIntervalDays', 'Maintenance Reminder Interval (days)', 1, 365)}
                        </div>
                    </section>

                    <section className="settings-panel" aria-labelledby="financial-settings-title">
                        <div className="settings-section-title">
                            <ShieldCheck size={18} />
                            <h2 id="financial-settings-title">Financial</h2>
                        </div>

                        <div className="settings-form">
                            {renderNumberField('highExpenseApprovalThreshold', 'High Expense Approval Threshold', 0, undefined, 100)}
                        </div>
                    </section>

                    {canEdit && (
                        <div className="settings-actions">
                            <Button icon={Save} onClick={handleSave} isLoading={saving} disabled={loading}>
                                Save Changes
                            </Button>
                            {saved && <p className="settings-save-note">Settings saved successfully.</p>}
                            {error && <p className="settings-save-error">{error}</p>}
                        </div>
                    )}
                </div>

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
