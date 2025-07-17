import { useState, useEffect } from 'react';
import { getSavedThreats, saveThreat, removeSavedThreat } from '../utils/api';
import toast from 'react-hot-toast';

export const useSavedThreats = () => {
  const [savedThreats, setSavedThreats] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedThreats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSavedThreats = async () => {
    try {
      setIsLoading(true);
      const response = await getSavedThreats();
      if (response.success && Array.isArray(response.data)) {
        setSavedThreats(new Set(response.data.map(t => t.id)));
      } else {
        setSavedThreats(new Set());
      }
    } catch (error) {
      console.error('Failed to load saved threats:', error);
      setSavedThreats(new Set());
      // Use localStorage as fallback
      try {
        const localSaved = localStorage.getItem('savedThreats');
        if (localSaved) {
          setSavedThreats(new Set(JSON.parse(localSaved)));
        }
      } catch (e) {
        console.error('Failed to parse local saved threats:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveThreat = async (threat) => {
    try {
      const threatId = threat.id || threat;
      const wasSaved = savedThreats.has(threatId);
      let newSavedThreats;
      
      if (wasSaved) {
        // Remove from saved - call backend delete API
        await removeSavedThreat(threatId);
        newSavedThreats = new Set(savedThreats);
        newSavedThreats.delete(threatId);
        setSavedThreats(newSavedThreats);
        toast.success('Removed from saved threats');
      } else {
        // Add to saved - pass complete threat data if available
        if (typeof threat === 'object' && threat.id) {
          await saveThreat(threat);
        } else {
          // Fallback for old usage with just ID
          await saveThreat({ id: threat });
        }
        newSavedThreats = new Set([...savedThreats, threatId]);
        setSavedThreats(newSavedThreats);
        toast.success('Threat saved successfully');
      }

      // Update localStorage with the new state
      localStorage.setItem('savedThreats', JSON.stringify(Array.from(newSavedThreats)));

    } catch (error) {
      toast.error('Failed to save threat');
      console.error('Error saving threat:', error);
    }
  };

  const isThreatSaved = (threatId) => {
    return savedThreats.has(threatId);
  };

  return {
    savedThreats,
    isLoading,
    toggleSaveThreat,
    isThreatSaved,
    refreshSavedThreats: loadSavedThreats,
  };
};

export default useSavedThreats;
