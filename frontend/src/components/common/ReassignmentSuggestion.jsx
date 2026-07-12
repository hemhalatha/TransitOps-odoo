import { useNavigate } from 'react-router-dom';
import { Sparkles, Truck, Users } from 'lucide-react';
import Button from './Button';
import './ReassignmentSuggestion.css';

const ReassignmentSuggestion = ({ suggestions, onClose, tripDefaults = {} }) => {
    const navigate = useNavigate();

    if (!suggestions?.suggestedDriver && !suggestions?.suggestedVehicle) {
        return null;
    }

    const handleCreateTrip = () => {
        const params = new URLSearchParams();
        if (suggestions.suggestedVehicle?._id) {
            params.set('vehicle', suggestions.suggestedVehicle._id);
        }
        if (suggestions.suggestedDriver?._id) {
            params.set('driver', suggestions.suggestedDriver._id);
        }
        if (suggestions.cargoWeight) {
            params.set('cargoWeight', String(suggestions.cargoWeight));
        }
        if (tripDefaults.origin) params.set('origin', tripDefaults.origin);
        if (tripDefaults.destination) params.set('destination', tripDefaults.destination);

        navigate(`/trips?${params.toString()}`);
        onClose?.();
    };

    return (
        <div className="reassignment-panel glass-card">
            <div className="reassignment-header">
                <Sparkles size={18} />
                <h3>Suggested Replacement</h3>
            </div>

            <div className="reassignment-grid">
                <div className="reassignment-item">
                    <Users size={16} />
                    <div>
                        <span>Driver</span>
                        <strong>{suggestions.suggestedDriver?.name || 'No match found'}</strong>
                        {suggestions.suggestedDriver && (
                            <small>Safety score: {suggestions.suggestedDriver.safetyScore}</small>
                        )}
                    </div>
                </div>
                <div className="reassignment-item">
                    <Truck size={16} />
                    <div>
                        <span>Vehicle</span>
                        <strong>{suggestions.suggestedVehicle?.licensePlate || 'No match found'}</strong>
                        {suggestions.suggestedVehicle && (
                            <small>{suggestions.suggestedVehicle.name}</small>
                        )}
                    </div>
                </div>
            </div>

            <div className="reassignment-actions">
                <Button onClick={handleCreateTrip} disabled={!suggestions.suggestedDriver || !suggestions.suggestedVehicle}>
                    Create New Trip
                </Button>
                {onClose && (
                    <Button variant="secondary" onClick={onClose}>
                        Dismiss
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ReassignmentSuggestion;
