'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Location } from '@/types/database';

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('locations')
        .select('id, name, org_id, address, created_at')
        .order('name');

      if (data && data.length > 0) {
        const typed = data as unknown as Location[];
        setLocations(typed);
        const savedId = localStorage.getItem('safecheck_location');
        const saved = typed.find(l => l.id === savedId);
        setCurrentLocation(saved || typed[0]);
      }
      setLoading(false);
    };

    fetchLocations();
  }, []);

  const switchLocation = (locationId: string) => {
    const loc = locations.find(l => l.id === locationId);
    if (loc) {
      setCurrentLocation(loc);
      localStorage.setItem('safecheck_location', loc.id);
      // Reload page to refresh data for new location
      window.location.reload();
    }
  };

  const selectLocation = (location: Location) => {
    setCurrentLocation(location);
    localStorage.setItem('safecheck_location', location.id);
  };

  return { locations, currentLocation, selectLocation, switchLocation, loading };
}

// Alias for convenience
export const useLocation = useLocations;
