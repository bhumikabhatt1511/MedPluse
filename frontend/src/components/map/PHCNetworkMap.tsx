import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PHC, RiskLevel } from '../../types';
import { ShieldAlert, Navigation, Layers, ChevronDown, Check, MapPin, Building2 } from 'lucide-react';
import {
  LanguageCode,
  getTranslation,
  getLocalizedPHC,
  getLocalizedRiskLevel,
  getLocalizedMedicineRisk,
} from '../../utils/i18n';
import { INITIAL_PHCS } from '../../data/mockData';

interface PHCNetworkMapProps {
  phcs: PHC[];
  selectedPhcId?: string;
  onSelectPhc: (phcId: string) => void;
  onOpenOptimizer?: (phcId: string) => void;
  onSelectJurisdiction?: (jurisdiction: string) => void;
  showCorridors?: boolean;
  language?: LanguageCode;
}

const CORRIDOR_SOURCE_ID = 'reallocation-corridor-source';
const CORRIDOR_LINE_ID = 'reallocation-corridor-line';
const CORRIDOR_GLOW_ID = 'reallocation-corridor-glow';

const PUNE_PHC_IDS = ['phc-alpha', 'phc-beta', 'phc-gamma', 'phc-delta', 'phc-epsilon'];

/**
 * Standard OpenStreetMap Raster Style Specification as robust baseline / fallback
 */
const OSM_RASTER_FALLBACK: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Updates vector style symbol layers to display labels in the active language (English or Hindi).
 * Uses OpenFreeMap / OpenMapTiles standard multilingual name fields.
 */
function applyMapLanguage(map: maplibregl.Map, lang: LanguageCode) {
  if (!map || !map.isStyleLoaded()) return;

  const style = map.getStyle();
  if (!style || !style.layers) return;

  const textFieldExpr =
    lang === 'hi'
      ? ['coalesce', ['get', 'name:hi'], ['get', 'name_hi'], ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']]
      : ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']];

  style.layers.forEach((layer) => {
    if (layer.type === 'symbol') {
      try {
        const layout = map.getLayoutProperty(layer.id, 'text-field');
        if (layout !== undefined) {
          map.setLayoutProperty(layer.id, 'text-field', textFieldExpr);
        }
      } catch {
        // Skip layers that do not accept dynamic text-field expressions
      }
    }
  });
}

/**
 * Manages the dynamic inter-PHC reallocation corridor route layer.
 */
function updateCorridorLayer(
  map: maplibregl.Map,
  active: boolean,
  phcsList: PHC[],
  lang: LanguageCode
) {
  if (!map || !map.isStyleLoaded()) return;

  const alpha = phcsList.find((p) => p.id === 'phc-alpha') || INITIAL_PHCS.find((p) => p.id === 'phc-alpha');
  const beta = phcsList.find((p) => p.id === 'phc-beta') || INITIAL_PHCS.find((p) => p.id === 'phc-beta');

  const shouldShow = active && Boolean(alpha) && Boolean(beta);

  const coordinates: [number, number][] = shouldShow && alpha && beta
    ? [
        [beta.lng, beta.lat],
        [74.0000, 18.4900],
        [alpha.lng, alpha.lat],
      ]
    : [];

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: shouldShow && coordinates.length > 0
      ? [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates,
            },
            properties: {
              title:
                lang === 'hi'
                  ? 'सक्रिय पुनर्वितरण कॉरिडोर: एसएच-64 / हड़पसर'
                  : 'Active Reallocation Corridor: SH-64 / Hadapsar',
            },
          },
        ]
      : [],
  };

  try {
    const source = map.getSource(CORRIDOR_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      source.setData(geojson);
    } else if (shouldShow) {
      map.addSource(CORRIDOR_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: CORRIDOR_GLOW_ID,
        type: 'line',
        source: CORRIDOR_SOURCE_ID,
        paint: {
          'line-color': '#06b6d4',
          'line-width': 8,
          'line-opacity': 0.35,
          'line-blur': 3,
        },
      });

      map.addLayer({
        id: CORRIDOR_LINE_ID,
        type: 'line',
        source: CORRIDOR_SOURCE_ID,
        paint: {
          'line-color': '#0891b2',
          'line-width': 4,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      });
    }
  } catch {
    // Style might still be transitioning
  }
}

export const PHCNetworkMap: React.FC<PHCNetworkMapProps> = ({
  phcs = [],
  selectedPhcId,
  onSelectPhc,
  onOpenOptimizer,
  onSelectJurisdiction,
  showCorridors = true,
  language = 'en',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ id: string; marker: maplibregl.Marker; popup: maplibregl.Popup }[]>([]);
  const isStyleLoadedRef = useRef<boolean>(false);
  const puneDropdownRef = useRef<HTMLDivElement>(null);

  // Map Filter and Scope State
  const [mapScope, setMapScope] = useState<'all-india' | 'pune-cluster' | 'pune-phc'>('all-india');
  const [selectedPunePhcId, setSelectedPunePhcId] = useState<string | null>(null);
  const [puneDropdownOpen, setPuneDropdownOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | RiskLevel>('all');
  const [corridorActive, setCorridorActive] = useState<boolean>(showCorridors);

  const t = getTranslation(language);

  // Ensure we have access to the 5 Pune demo PHCs
  const punePhcs = useMemo(() => {
    return PUNE_PHC_IDS.map((id) => {
      return phcs.find((p) => p.id === id) || INITIAL_PHCS.find((p) => p.id === id)!;
    }).filter(Boolean);
  }, [phcs]);

  // Determine active visible PHCs based on mapScope and selectedPunePhcId
  const currentScopedPhcs = useMemo(() => {
    if (mapScope === 'pune-cluster') {
      return punePhcs;
    }
    if (mapScope === 'pune-phc' && selectedPunePhcId) {
      const single = punePhcs.filter((p) => p.id === selectedPunePhcId);
      return single.length > 0 ? single : punePhcs;
    }
    return phcs.length > 0 ? phcs : INITIAL_PHCS;
  }, [mapScope, selectedPunePhcId, punePhcs, phcs]);

  // Filtered by risk status
  const visiblePhcs = useMemo(() => {
    if (activeFilter === 'all') return currentScopedPhcs;
    return currentScopedPhcs.filter((p) => p.riskLevel === activeFilter);
  }, [currentScopedPhcs, activeFilter]);

  // Dynamic counts for toolbar
  const criticalCount = currentScopedPhcs.filter((p) => p.riskLevel === 'critical').length;
  const warningCount = currentScopedPhcs.filter((p) => p.riskLevel === 'warning').length;
  const stableCount = currentScopedPhcs.filter((p) => p.riskLevel === 'stable').length;

  // Close Pune dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (puneDropdownRef.current && !puneDropdownRef.current.contains(e.target as Node)) {
        setPuneDropdownOpen(false);
      }
    };
    if (puneDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [puneDropdownOpen]);

  // Initialize MapLibre GL with clean vector style + raster fallback
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Geometric Center of India [78.9629, 22.5937]
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [78.9629, 22.5937],
      zoom: 4.5,
      attributionControl: false,
    });

    // Handle style load errors gracefully by falling back to standard OSM tiles
    map.on('error', (e) => {
      if (e && e.error && !isStyleLoadedRef.current) {
        console.warn('Vector map style fallback triggered:', e.error);
        try {
          map.setStyle(OSM_RASTER_FALLBACK);
        } catch {
          // ignore fallback transition
        }
      }
    });

    // Custom OpenStreetMap attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }),
      'bottom-right'
    );

    // Zoom Navigation Controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    const handleStyleReady = () => {
      isStyleLoadedRef.current = true;
      applyMapLanguage(map, language);
      updateCorridorLayer(map, corridorActive, INITIAL_PHCS, language);
      map.resize();
    };

    map.on('load', handleStyleReady);
    map.on('style.load', handleStyleReady);

    // ResizeObserver ensures canvas dimensions stay in sync with container layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    mapInstanceRef.current = map;

    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
      isStyleLoadedRef.current = false;
    };
  }, []);

  // Update vector map language when language prop changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.isStyleLoaded()) {
      applyMapLanguage(map, language);
      updateCorridorLayer(map, corridorActive, currentScopedPhcs, language);
    } else {
      map.once('styledata', () => {
        applyMapLanguage(map, language);
        updateCorridorLayer(map, corridorActive, currentScopedPhcs, language);
      });
    }
  }, [language, corridorActive, currentScopedPhcs]);

  // Adjust Camera based on scope and selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (mapScope === 'all-india') {
      map.flyTo({ center: [78.9629, 22.5937], zoom: 4.5, duration: 800 });
    } else if (mapScope === 'pune-cluster') {
      const bounds = new maplibregl.LngLatBounds();
      punePhcs.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 10,
        duration: 800,
      });
    } else if (mapScope === 'pune-phc' && selectedPunePhcId) {
      const phc = punePhcs.find((p) => p.id === selectedPunePhcId);
      if (phc) {
        map.flyTo({ center: [phc.lng, phc.lat], zoom: 12, duration: 800 });
      }
    }
  }, [mapScope, selectedPunePhcId, punePhcs]);

  // Update Markers and Popups whenever visiblePhcs, selection, or language changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];

    const colors: Record<RiskLevel, { fill: string; border: string; ring: string }> = {
      critical: { fill: '#ef4444', border: '#b91c1c', ring: 'rgba(239, 68, 68, 0.4)' },
      high: { fill: '#f97316', border: '#c2410c', ring: 'rgba(249, 115, 22, 0.4)' },
      warning: { fill: '#f59e0b', border: '#b45309', ring: 'rgba(245, 158, 11, 0.4)' },
      stable: { fill: '#10b981', border: '#047857', ring: 'rgba(16, 185, 129, 0.4)' },
    };

    visiblePhcs.forEach((phc) => {
      const c = colors[phc.riskLevel] || colors.stable;
      const isSelected = phc.id === selectedPhcId || phc.id === selectedPunePhcId;
      const isCritical = phc.riskLevel === 'critical';
      const locPhc = getLocalizedPHC(phc, language);
      const localizedRisk = getLocalizedRiskLevel(phc.riskLevel, language);
      const localizedMedRisk = getLocalizedMedicineRisk(phc.medicineRisk, language);

      // Custom HTML Marker Element
      const markerEl = document.createElement('div');
      markerEl.className = 'relative flex items-center justify-center cursor-pointer group';
      markerEl.style.width = '36px';
      markerEl.style.height = '36px';

      markerEl.innerHTML = `
        ${
          isCritical
            ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${c.ring};"></div>`
            : ''
        }
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md transition-transform duration-200 group-hover:scale-110 ${
          isSelected ? 'ring-4 ring-cyan-400 scale-110 shadow-lg' : ''
        }" style="background-color: ${c.fill}; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);">
          ${isCritical ? '!' : phc.code.slice(-2)}
        </div>
        <div class="absolute -bottom-5 whitespace-nowrap bg-white/95 text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm border border-slate-200 pointer-events-none">
          ${locPhc.shortName}
        </div>
      `;

      // Interactive Localized Popup
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-slate-800 font-sans min-w-[240px]';
      popupContent.innerHTML = `
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
          <div>
            <div class="font-bold text-sm text-slate-900">${locPhc.name}</div>
            <div class="text-[11px] text-slate-500">${locPhc.district}, ${locPhc.state}</div>
          </div>
          <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style="background-color: ${c.ring}; color: ${c.border};">
            ${localizedRisk}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-400 block text-[10px]">${t.mapPatientsToday}</span>
            <span class="font-mono font-bold text-slate-800">${phc.patientsToday}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-400 block text-[10px]">${t.mapBedAvailable}</span>
            <span class="font-mono font-bold text-slate-800">${phc.availableBeds} / ${phc.totalBeds}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-400 block text-[10px]">${t.mapDoctorsRoster}</span>
            <span class="font-mono font-bold text-slate-800">${phc.doctorsPresent} / ${phc.doctorsTotal}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded border border-slate-100">
            <span class="text-slate-400 block text-[10px]">${t.mapMedicineRisk}</span>
            <span class="font-semibold text-xs ${
              phc.medicineRisk === 'critical'
                ? 'text-rose-600 font-bold'
                : phc.medicineRisk === 'moderate'
                ? 'text-amber-600'
                : 'text-emerald-600'
            }">${localizedMedRisk}</span>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 pt-1">
          <button id="popup-view-details-${phc.id}" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            ${t.mapViewDetails}
          </button>
          ${
            phc.riskLevel === 'critical' || phc.riskLevel === 'warning'
              ? `<button id="popup-optimize-${phc.id}" class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                  ${t.mapOpenOptimizer}
                </button>`
              : ''
          }
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 18, maxWidth: '300px', closeButton: true }).setDOMContent(
        popupContent
      );

      popupContent.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const detailsBtn = target.closest(`[id="popup-view-details-${phc.id}"]`);
        const optBtn = target.closest(`[id="popup-optimize-${phc.id}"]`);

        if (detailsBtn) {
          onSelectPhc(phc.id);
          popup.remove();
        } else if (optBtn && onOpenOptimizer) {
          onOpenOptimizer(phc.id);
          popup.remove();
        }
      });

      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([phc.lng, phc.lat])
        .setPopup(popup)
        .addTo(map);

      markerEl.addEventListener('click', () => {
        onSelectPhc(phc.id);
      });

      markersRef.current.push({ id: phc.id, marker, popup });

      // If this is the individually selected Pune PHC, open its popup automatically
      if (mapScope === 'pune-phc' && phc.id === selectedPunePhcId) {
        setTimeout(() => {
          if (!popup.isOpen()) {
            marker.togglePopup();
          }
        }, 300);
      }
    });

    if (map.isStyleLoaded()) {
      updateCorridorLayer(map, corridorActive, currentScopedPhcs, language);
    }
  }, [
    visiblePhcs,
    selectedPhcId,
    selectedPunePhcId,
    mapScope,
    language,
    corridorActive,
    currentScopedPhcs,
    onSelectPhc,
    onOpenOptimizer,
    t,
  ]);

  const handleCenterCritical = () => {
    const criticalNode = currentScopedPhcs.find((p) => p.riskLevel === 'critical') || currentScopedPhcs[0];
    if (criticalNode && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [criticalNode.lng, criticalNode.lat], zoom: 11, duration: 1000 });
      onSelectPhc(criticalNode.id);
    }
  };

  const handleResetToIndia = () => {
    setMapScope('all-india');
    setSelectedPunePhcId(null);
    setPuneDropdownOpen(false);
    if (onSelectJurisdiction) {
      onSelectJurisdiction('All India (National Grid - 39 Nodes)');
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [78.9629, 22.5937], zoom: 4.5, duration: 800 });
    }
  };

  const handleSelectAllPune = () => {
    setMapScope('pune-cluster');
    setSelectedPunePhcId(null);
    setPuneDropdownOpen(false);
    if (onSelectJurisdiction) {
      onSelectJurisdiction('Pune District Sub-Division (5 Nodes)');
    }
  };

  const handleSelectIndividualPunePhc = (phcId: string) => {
    setMapScope('pune-phc');
    setSelectedPunePhcId(phcId);
    setPuneDropdownOpen(false);
    onSelectPhc(phcId);
    if (onSelectJurisdiction) {
      onSelectJurisdiction('Pune District Sub-Division (5 Nodes)');
    }
  };

  const getPunePhcDisplayName = (id: string): string => {
    switch (id) {
      case 'phc-alpha':
        return t.mapPuneAlphaEast;
      case 'phc-beta':
        return t.mapPuneBetaSouth;
      case 'phc-gamma':
        return t.mapPuneGammaMetro;
      case 'phc-delta':
        return t.mapPuneDeltaNorth;
      case 'phc-epsilon':
        return t.mapPuneEpsilonFoothills;
      default:
        return id;
    }
  };

  return (
    <div
      id="phc-network-map-container"
      className="relative w-full h-[540px] min-h-[480px] rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col"
    >
      {/* Map Control Floating Toolbar (Top Left) */}
      <div className="absolute top-2.5 left-2.5 z-[10] flex flex-wrap items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg border border-slate-200 shadow-sm text-xs max-w-[calc(100%-1.25rem)] sm:max-w-none">
        <div className="flex items-center gap-1 font-semibold text-slate-700 px-1 border-r border-slate-200">
          <Layers className="w-3.5 h-3.5 text-cyan-600" />
          <span className="hidden xs:inline">{t.mapFilter}</span>
        </div>

        <button
          onClick={() => {
            setActiveFilter('all');
            if (mapScope !== 'all-india') {
              handleResetToIndia();
            }
          }}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors font-medium text-[11px] sm:text-xs cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white font-bold shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.mapFilterAll} ({currentScopedPhcs.length})
        </button>
        {criticalCount > 0 && (
          <button
            onClick={() => setActiveFilter('critical')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors font-medium flex items-center gap-1 text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'critical'
                ? 'bg-rose-600 text-white font-bold shadow-2xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {t.mapFilterCritical} ({criticalCount})
          </button>
        )}
        {warningCount > 0 && (
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors font-medium text-[11px] sm:text-xs cursor-pointer ${
              activeFilter === 'warning'
                ? 'bg-amber-500 text-white font-bold shadow-2xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {t.mapFilterWarning} ({warningCount})
          </button>
        )}
        <button
          onClick={() => setActiveFilter('stable')}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors font-medium text-[11px] sm:text-xs cursor-pointer ${
            activeFilter === 'stable'
              ? 'bg-emerald-600 text-white font-bold shadow-2xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {t.mapFilterStable} ({stableCount})
        </button>
      </div>

      {/* Map Actions Floating Toolbar (Top Right) */}
      <div className="absolute top-12 sm:top-2.5 right-2.5 z-[15] flex items-center gap-1 sm:gap-1.5 bg-white/95 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
        <button
          onClick={handleResetToIndia}
          className={`px-2 py-1 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer ${
            mapScope === 'all-india'
              ? 'bg-cyan-700 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
          }`}
          title="Zoom to Full India National Grid"
        >
          <span>{t.mapActionAllIndia}</span>
        </button>

        {/* Pune Cluster Dropdown Menu Anchor */}
        <div className="relative" ref={puneDropdownRef}>
          <button
            onClick={() => setPuneDropdownOpen(!puneDropdownOpen)}
            className={`px-2 py-1 rounded font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
              mapScope !== 'all-india'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Open Pune Sub-Division Cluster Options"
          >
            <span>{t.mapActionPuneCluster}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${puneDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Pune Submenu Popover */}
          {puneDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs space-y-1">
              <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>{t.mapPuneMenuTitle}</span>
              </div>

              {/* Option 1: All Pune PHCs */}
              <button
                onClick={handleSelectAllPune}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] font-medium ${
                  mapScope === 'pune-cluster'
                    ? 'bg-cyan-50 text-cyan-900 font-bold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>{t.mapAllPunePhcs}</span>
                </div>
                {mapScope === 'pune-cluster' && <Check className="w-3.5 h-3.5 text-cyan-600" />}
              </button>

              <div className="border-t border-slate-100 my-1" />

              {/* Options 2-6: Individual Pune PHCs */}
              {punePhcs.map((phc) => {
                const isCurrent = mapScope === 'pune-phc' && selectedPunePhcId === phc.id;
                const riskDot =
                  phc.riskLevel === 'critical'
                    ? 'bg-rose-500 animate-pulse'
                    : phc.riskLevel === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500';

                return (
                  <button
                    key={phc.id}
                    onClick={() => handleSelectIndividualPunePhc(phc.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-[11px] ${
                      isCurrent
                        ? 'bg-cyan-50 text-cyan-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-1">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${riskDot}`} />
                      <span className="truncate">{getPunePhcDisplayName(phc.id)}</span>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setCorridorActive(!corridorActive)}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border font-medium flex items-center gap-1 sm:gap-1.5 transition-colors text-[11px] sm:text-xs cursor-pointer ${
            corridorActive
              ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
          title="Toggle Reallocation Corridors"
        >
          <Navigation className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          <span className="hidden sm:inline">
            {corridorActive ? t.mapActionCorridors : t.mapActionCorridorsOff}
          </span>
        </button>

        <button
          onClick={handleCenterCritical}
          className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-medium flex items-center gap-1 transition-colors text-[11px] sm:text-xs cursor-pointer"
          title="Locate Critical Deficit Node"
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>{t.mapActionLocate}</span>
        </button>
      </div>

      {/* Map Canvas Wrapper (Explicit dimensions for MapLibre WebGL) */}
      <div className="relative w-full flex-1 min-h-[380px] sm:min-h-[440px]">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
      </div>

      {/* Legend Footer */}
      <div className="bg-white border-t border-slate-200 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600 z-10">
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
          <span className="font-semibold text-slate-700">{t.mapLegendTitle}</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t.mapLegendStable}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t.mapLegendWarning}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            {t.mapLegendHighRisk}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {t.mapLegendCritical}
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 flex-wrap">
          <span>{t.mapGridTitle}</span>
          <span>•</span>
          <span className="font-bold text-slate-700">
            {visiblePhcs.length} {t.mapActiveCenters}
          </span>
        </div>
      </div>
    </div>
  );
};
