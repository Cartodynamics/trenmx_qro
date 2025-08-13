import React, { useEffect, useRef, useState } from 'react';
import maplibregl, { LngLat, GeoJSONSource } from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

type MapProps = {
  layersVisibility: { [layerId: string]: boolean };
  isocronaMin: number;
};

const baseStyle = 'https://api.maptiler.com/maps/01976666-b449-7252-86b5-3e7b3213a9e6/style.json?key=QAha5pFBxf4hGa8Jk5zv';
const satelliteStyle = 'https://www.mapabase.atdt.gob.mx/style_satellite.json';

const Map: React.FC<MapProps> = ({ layersVisibility }) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<maplibregl.LngLat[]>([]);
  const [routesData, setRoutesData] = useState<any[]>([]);
const [selectedPueblo, setSelectedPueblo] = useState<string | null>(null);

  const applyVisibility = () => {
    const map = mapRef.current;
    if (!map) return;
    Object.entries(layersVisibility).forEach(([id, visible]) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
  };

  const toggleSatellite = () => {
    const map = mapRef.current;
    if (!map) return;
    const newStyle = isSatellite ? baseStyle : satelliteStyle;
    map.setStyle(newStyle, { diff: false });
    map.once('styledata', () => {
      map.fire('load');
      applyVisibility();
    });
    setIsSatellite(!isSatellite);
  };

const toggleMeasurement = () => {
  const wasMeasuring = isMeasuring;
  setIsMeasuring(!wasMeasuring);
  if (wasMeasuring) {
    const map = mapRef.current;
    if (!map) return;

    routesData.forEach((route) => {
      const { id } = route;
      if (map.getLayer(`route-layer-${id}`)) map.removeLayer(`route-layer-${id}`);
      if (map.getSource(`route-source-${id}`)) map.removeSource(`route-source-${id}`);
      if (map.getLayer(`start-point-${id}`)) map.removeLayer(`start-point-${id}`);
      if (map.getSource(`start-point-${id}`)) map.removeSource(`start-point-${id}`);
      if (map.getLayer(`end-point-${id}`)) map.removeLayer(`end-point-${id}`);
      if (map.getSource(`end-point-${id}`)) map.removeSource(`end-point-${id}`);
    });

    setRoutesData([]);
    setCurrentPoints([]);
  }
};

const addRouteToMap = async (points: maplibregl.LngLat[]) => {
  const map = mapRef.current;
  if (!map || points.length !== 2) return;

  const [start, end] = points;
  console.log('Calculando ruta entre:', start, end);
  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || data.routes.length === 0) return;
    const route = data.routes[0];

    const routeId = Date.now(); 

    // Agregar línea de ruta
    map.addSource(`route-source-${routeId}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: route.geometry,
        properties: {}
      }
    });
    map.addLayer({
      id: `route-layer-${routeId}`,
      type: 'line',
      source: `route-source-${routeId}`,
      paint: {
        'line-color': '#007cbf',
        'line-width': 5,
        'line-opacity': 0.8
      }
    });

    // Puntos de inicio y fin
    const pointStyle = {
      type: 'geojson',
      data: {
        type: 'Point',
        coordinates: [start.lng, start.lat]
      }
    };
    map.addSource(`start-point-${routeId}`, {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [start.lng, start.lat]
    },
    properties: {}
  }
});
map.addLayer({
  id: `start-point-${routeId}`,
  type: 'circle',
  source: `start-point-${routeId}`,
  paint: {
    'circle-radius': 6,
    'circle-color': '#007cbf',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff'
  }
});

    map.addSource(`end-point-${routeId}`, {
      type: 'geojson',
      data: {
        type: 'Point',
        coordinates: [end.lng, end.lat]
      }
    });
    map.addLayer({
      id: `end-point-${routeId}`,
      type: 'circle',
      source: `end-point-${routeId}`,
      paint: {
        'circle-radius': 6,
        'circle-color': '#007cbf',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    setRoutesData(prev => [...prev, {
  id: routeId,
  ...route,
  startPoint: start,
  endPoint: end
}]);

  } catch (error) {
    console.error("Error al calcular la ruta:", error);
  }
};

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: baseStyle,
      center: [-106.98189, 24.09162],
      zoom: 4.32,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: false
    }); 

    mapRef.current = map;

    map.addControl(new maplibregl.AttributionControl({
      customAttribution: 'Secretaría de Gobernación',
      compact: true
    }), 'bottom-right');

    map.on('load', () => {
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      map.addSource('trazo_actual', {
  type: 'vector',
  url: 'pmtiles://data/trazo_actual.pmtiles'
});
map.addLayer({
  id: 'trazo_actual',
  type: 'line',
  source: 'trazo_actual',
  'source-layer': 'trazo_actual_tile', // <-- ajusta si tu source-layer real es otro
  paint: {
    'line-color': '#ff0000',
    'line-width': 3
  },
  layout: { visibility: layersVisibility['trazo_actual'] ? 'visible' : 'none' }
});


map.addSource('comunidades1y2', {
  type: 'vector',
  url: 'pmtiles://data/comunidades1y2.pmtiles'
});
map.addLayer({
  id: 'comunidades1y2',
  type: 'circle',
  source: 'comunidades1y2',
  'source-layer': 'comunidades1y2_tile', // <-- ajusta si tu source-layer real es otro
  paint: {
    'circle-radius': [
      'interpolate', ['linear'], ['zoom'],
      5, 2,
      8, 3,
      11, 5,
      14, 8
    ],
    'circle-color': '#ff8c00',
    'circle-stroke-color': '#ffffff',
    'circle-stroke-width': 0.5
  },
  layout: { visibility: layersVisibility['comunidades1y2'] ? 'visible' : 'none' }
});
map.on('mouseenter', 'comunidades1y2', (e) => {
  map.getCanvas().style.cursor = 'pointer';
  const p = e.features?.[0]?.properties; if (!p) return;
  popup
    .setLngLat(e.lngLat)
    .setHTML(`
      <strong>Entidad:</strong> ${p.NOM_ENT ?? 'Sin dato'}<br/>
      <strong>Municipio:</strong> ${p.NOM_MUN ?? 'Sin dato'}<br/>
      <strong>Comunidad:</strong> ${p.NOM_COM ?? 'Sin dato'}<br/>
      <strong>Pueblo:</strong> ${p.Pueblo ?? 'Sin dato'}<br/>
      <strong>Estimación de la población:</strong> ${p.PTC_1 ?? 'Sin dato'}<br/>
      <strong>Distancia al trazo actual:</strong> ${p.HubDist ?? 'Sin dato'}
    `)
    .addTo(map);
});
map.on('mouseleave', 'comunidades1y2', () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

/** 3) Núcleos directos — polígonos #85b66f, CON popup **/
map.addSource('nucleos_directos', {
  type: 'vector',
  url: 'pmtiles://data/nucleos_directos.pmtiles'
});
map.addLayer({
  id: 'nucleos_directos',
  type: 'fill',
  source: 'nucleos_directos',
  'source-layer': 'nucleos_directos_tile', // <-- ajusta si tu source-layer real es otro
  paint: {
    'fill-color': '#85b66f',
    'fill-opacity': 0.45,
    'fill-outline-color': '#2f4f2f'
  },
  layout: { visibility: layersVisibility['nucleos_directos'] ? 'visible' : 'none' }
});
map.on('mouseenter', 'nucleos_directos', (e) => {
  map.getCanvas().style.cursor = 'pointer';
  const p = e.features?.[0]?.properties; if (!p) return;
  popup
    .setLngLat(e.lngLat)
    .setHTML(`
      <strong>Núcleo:</strong> ${p.nom_nucleo ?? 'Sin dato'}<br/>
      <strong>Tipo de propiedad:</strong> ${p.tipo_propi ?? 'Sin dato'}<br/>
      <strong>Programa:</strong> ${p.programa ?? 'Sin dato'}<br/>
      <strong>Fecha de creación:</strong> ${p.Fecha_Crea ?? 'Sin dato'}
    `)
    .addTo(map);
});
map.on('mouseleave', 'nucleos_directos', () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

/** 4) Núcleos a 5 km — polígonos #356c61, CON popup (mismos campos) **/
map.addSource('nucleos5km', {
  type: 'vector',
  url: 'pmtiles://data/nucleos5km.pmtiles'
});
map.addLayer({
  id: 'nucleos5km',
  type: 'fill',
  source: 'nucleos5km',
  'source-layer': 'nucleos5km_tile', // <-- ajusta si tu source-layer real es otro
  paint: {
    'fill-color': '#356c61',
    'fill-opacity': 0.30,
    'fill-outline-color': '#1c3a35'
  },
  layout: { visibility: layersVisibility['nucleos5km'] ? 'visible' : 'none' }
});
map.on('mouseenter', 'nucleos5km', (e) => {
  map.getCanvas().style.cursor = 'pointer';
  const p = e.features?.[0]?.properties; if (!p) return;
  popup
    .setLngLat(e.lngLat)
    .setHTML(`
      <strong>Núcleo:</strong> ${p.nom_nucleo ?? 'Sin dato'}<br/>
      <strong>Tipo de propiedad:</strong> ${p.tipo_propi ?? 'Sin dato'}<br/>
      <strong>Programa:</strong> ${p.programa ?? 'Sin dato'}<br/>
      <strong>Fecha de creación:</strong> ${p.Fecha_Crea ?? 'Sin dato'}
    `)
    .addTo(map);
});
map.on('mouseleave', 'nucleos5km', () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

      map.addSource('anp', {
  type: 'vector',
  url: 'pmtiles://data/anp.pmtiles'
});

map.addLayer({
  id: 'anp',
  type: 'fill',
  source: 'anp',
  'source-layer': 'anp_tile', 
  paint: {
    'fill-color': '#93DA97',
    'fill-opacity': 0.5
  },
  layout: { visibility: 'none' }
});

map.on('mouseenter', 'anp', (e) => {
  map.getCanvas().style.cursor = 'pointer';
  const props = e.features?.[0]?.properties;
  if (!props) return;
  popup.setLngLat(e.lngLat).setHTML(`
    <strong>Nombre ANP:</strong> ${props.NOMBRE || 'Sin dato'}<br/>
    <strong>Categoría de Manejo:</strong> ${props.CAT_MANEJO || 'Sin dato'}<br/>
    <strong>Ubicación:</strong> ${props.ESTADOS || 'Sin dato'}<br/>
    <strong>Región:</strong> ${props.REGION || 'Sin dato'}
  `).addTo(map);
});

map.on('mouseleave', 'anp', () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

map.addSource('nucleos_agrarios', {
  type: 'vector',
  url: 'pmtiles://data/nucleos_agrarios.pmtiles'
});

map.addLayer({
  id: 'nucleos_agrarios',
  type: 'fill',
  source: 'nucleos_agrarios',
  'source-layer': 'nucleos_agrarios_tile',
  paint: {
    'fill-color': '#4b352a',
    'fill-opacity': 0.5,
       
  },
  layout: { visibility: 'none' }
});

map.on('mouseenter', 'nucleos_agrarios', (e) => {
  map.getCanvas().style.cursor = 'pointer';
  const props = e.features?.[0]?.properties;
  if (!props) return;
  popup.setLngLat(e.lngLat).setHTML(`
    <strong>Entidad:</strong> ${props.nom_entida || 'Sin dato'}<br/>
    <strong>Municipio:</strong> ${props.nom_munici || 'Sin dato'}<br/>
    <strong>Tipo de propiedad:</strong> ${props.tipo_propi || 'Sin dato'}<br/>
    <strong>Programa:</strong> ${props.programa || 'Sin dato'}
  `).addTo(map);
});

map.on('mouseleave', 'nucleos_agrarios', () => {
  map.getCanvas().style.cursor = '';
  popup.remove();
});

map.addSource('LocalidadesSedeINPI', { type: 'vector', url: 'pmtiles://data/inpi.pmtiles' });

const puebloColors = [
  '#e6194b', '#d62728', '#ff4f00', '#ff7f0e', '#a65628',
  '#8b4513', '#6b4226', '#1f78b4', '#00429d', '#2171b5',
  '#08306b', '#7b3294', '#6a3d9a', '#990099', '#8e0152',
  '#f0027f', '#c11c78', '#e31a1c', '#f16913', '#a50f15',
  '#b2182b', '#c51b7d', '#dd3497', '#1b7837', '#4daf4a',
  '#006d2c', '#228b22', '#20b2aa', '#008080', '#2e8b57',
  '#ff1493', '#ff69b4', '#ff4500', '#b03060', '#cd5c5c',
  '#ff8c00', '#a0522d', '#9932cc', '#9400d3', '#8b008b',
  '#7cfc00', '#32cd32', '#4169e1', '#0000cd', '#00008b',
  '#00bfff', '#1e90ff', '#4682b4', '#5f9ea0', '#191970',
  '#ff0000', '#c71585', '#dc143c', '#b22222', '#ff6347'
];




const puebloMatch: (string | number)[] = [];
for (let i = 1; i <= 72; i++) {
  puebloMatch.push(i, puebloColors[i % puebloColors.length]);
}
const puebloExpression = ['match', ['get', 'ID_Pueblo'], ...puebloMatch, '#666666'] as any;


      map.addLayer({
        id: 'LocalidadesSedeINPI',
        type: 'circle',
        source: 'LocalidadesSedeINPI',
        'source-layer': 'inpi_tile',
        paint: {
        'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
          5, 2,
          8, 3,
          11, 6,
          14, 10
        ],
          'circle-color': puebloExpression,
          'circle-stroke-color': '#F2F2F2',
          'circle-stroke-width': 0.2  
        },
        layout: { visibility: layersVisibility['LocalidadesSedeINPI'] ? 'visible' : 'none' }

      });

      map.on('mouseenter', 'LocalidadesSedeINPI', (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        popup.setLngLat(e.lngLat).setHTML(`
          <strong>Entidad:</strong> ${props.NOM_ENT}<br/>
          <strong>Municipio:</strong> ${props.NOM_MUN}<br/>
          <strong>Comunidad:</strong> ${props.NOM_COM}<br/>
          <strong>Pueblo:</strong> ${props.Pueblo}<br/>
          <strong>Población total:</strong> ${props.POBTOT}<br/>
          <strong>Pobl en hogares indígenas:</strong> ${props.PHOG_IND}<br/>
          <strong>Afrodescendientes:</strong> ${props.POB_AFRO}<br/>
          <strong>Tipo:</strong> ${props.TIPOLOGIAA}<br/>
          <strong>Marginación:</strong> ${props.GM_2020}<br/>
          <strong>Tipo asentamiento:</strong> ${props.TIPOLOGIAC}<br/>
          <strong>Región:</strong> ${props.REGION}<br/>
          <strong>Oficina de Representación:</strong> ${props.UA}
        `).addTo(map);
      });

      map.on('mouseleave', 'LocalidadesSedeINPI', () => {
        popup.remove();
      });

      map.addSource('PresidenciasMunicipales', { type: 'vector', url: 'pmtiles://data/PresidenciasMunicipales.pmtiles' });
      map.addLayer({
        id: 'PresidenciasMunicipales',
        type: 'circle',
        source: 'PresidenciasMunicipales',
        'source-layer': 'PresidenciasMunicipales_tile',
        paint: {
          'circle-radius': 1.7,
          'circle-color': '#000000',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.5
        },
        layout: { visibility: 'none' }
      });

      map.on('mouseenter', 'PresidenciasMunicipales', (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;
        popup.setLngLat(e.lngLat).setHTML(`
          <strong>Entidad:</strong> ${props.entidad}<br/>
          <strong>Municipio:</strong> ${props.municipio}<br/>
          <strong>Dirección:</strong> ${props.direccion}
        `).addTo(map);
      });

      map.on('mouseleave', 'PresidenciasMunicipales', () => {
        popup.remove();
      });     

map.addSource('PuntosWiFiCFE', {
  type: 'vector',
  url: 'pmtiles://data/PuntosWiFiCFE.pmtiles'
});

const tecnologias = [
  { id: 'PuntosWiFiCFE_4G', color: '#9f2241', filtro: '4G' },
  { id: 'PuntosWiFiCFE_FIBRA', color: '#cda578', filtro: 'FIBRA O COBRE' },
  { id: 'PuntosWiFiCFE_SATELITAL', color: '#235b4e', filtro: 'SATELITAL' }
];

tecnologias.forEach(({ id, color, filtro }) => {
  map.addLayer({
    id,
    type: 'circle',
    source: 'PuntosWiFiCFE',
    'source-layer': 'PuntosWiFiCFE_tile',
    filter: ['==', ['get', 'TECNOLOGIA'], filtro],
    paint: {
      'circle-radius': 1.5,
      'circle-color': color,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 0
    },
    layout: { visibility: 'none' } // Por defecto oculto
  });

  map.on('mouseenter', id, (e) => {
    const props = e.features?.[0]?.properties;
    if (!props) return;
    popup.setLngLat(e.lngLat).setHTML(`
      <strong>Nombre:</strong> ${props['INMUEBLE NOMBRE']}<br/>
      <strong>Tipo:</strong> ${props['TIPO INMUEBLE']}<br/>
      <strong>AP:</strong> ${props['NOMBRE AP']}<br/>
      <strong>Tecnología:</strong> ${props['TECNOLOGIA']}
    `).addTo(map);
  });

  map.on('mouseleave', id, () => {
    popup.remove();
  });
});
      
    }); 
    
    return () => {
      map.remove();
      maplibregl.removeProtocol('pmtiles');
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.entries(layersVisibility).forEach(([id, visible]) => {
      const vis = visible ? 'visible' : 'none';
      try {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', vis);
        }
      } catch {}
    });
  }, [layersVisibility]);

  useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const handleClick = (e: maplibregl.MapMouseEvent) => {
  if (!isMeasuring) return;
  if (currentPoints.length >= 2) return;
  const newPoint = e.lngLat;
  console.log('Nuevo punto', newPoint);

  setCurrentPoints(prev => [...prev, newPoint]);
};

  map.on('click', handleClick);

  return () => {
    map.off('click', handleClick);
  };
}, [isMeasuring, currentPoints]);

useEffect(() => {
  if (currentPoints.length === 2) {
    addRouteToMap(currentPoints);
    
  }
}, [currentPoints]);

    return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'flex-end'  
}}>
  <div className="custom-tooltip">
    <button
      onClick={toggleSatellite}
      style={{
        padding: '8px 12px',
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '18px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
      aria-label="Cambiar vista del mapa"
    >
      {isSatellite ? '🗺️' : '🛰️'}

      
    </button>
    <span className="tooltip-text">Cambiar a vista de satélite</span>
  </div>
  <div className="custom-tooltip">
    <button
      onClick={toggleMeasurement}
      style={{
        padding: '8px 12px',
        backgroundColor: isMeasuring ? '#e6f7ff' : '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '18px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
      aria-label="Medir distancia"
    >
      📏 
    </button>
    
    <span className="tooltip-text">Seleccionar nodos para ruta</span>
  </div>
   <div className="custom-tooltip">
    <select
  onChange={(e) => {
    const value = e.target.value;
    setSelectedPueblo(value === 'ALL' ? null : value);
    const map = mapRef.current;
    if (!map) return;

    if (value === 'ALL') {
      map.setFilter('LocalidadesSedeINPI', null);
    } else {
      map.setFilter('LocalidadesSedeINPI', ['==', ['get', 'Pueblo'], value]);
    }
  }}
>

      <option value="ALL">Seleccionar Pueblo</option>
      <option>Mayo</option>
      <option>Afromexicano</option>
      <option>Akateko</option>
      <option>Amuzgo</option>
      <option>Ayapaneco</option>
      <option>Caxcan</option>
      <option>Chatino</option>
      <option>Chichimeco</option>
      <option>Chinanteco</option>
      <option>Chocholteco</option>
      <option>Ch'ol</option>
      <option>Chontal de Oaxaca</option>
      <option>Chuj</option>
      <option>Coca</option>
      <option>Cochimí</option>
      <option>Cora</option>
      <option>Cucapá</option>
      <option>Cuicateco</option>
      <option>Guarijío</option>
      <option>Huasteco</option>
      <option>Ikoots (Huave)</option>
      <option>Ixcateco</option>
      <option>Ixil</option>
      <option>Jakalteko</option>
      <option>Kaqchikel</option>
      <option>K'iche'</option>
      <option>Kickapoo</option>
      <option>Kiliwa</option>
      <option>Kumiai</option>
      <option>Lacandón</option>
      <option>Mam</option>
      <option>Matlatzinca</option>
      <option>Maya</option>
      <option>Mazahua</option>
      <option>Mazateco</option>
      <option>Me’phaa (Tlapaneco)</option>
      <option>Mexikan</option>
      <option>Mixe</option>
      <option>Mixteco</option>
      <option>N’dee</option>
      <option>Nahua</option>
      <option>Otomí</option>
      <option>Pa Ipai/Ku'ahl</option>
      <option>Pame</option>
      <option>Pima</option>
      <option>Pirinda</option>
      <option>Pluricultural</option>
      <option>Popoloca</option>
      <option>Popoluca de la Sierra</option>
      <option>P'urhépecha (Tarasco)</option>
      <option>Q'anjob'al</option>
      <option>Qato'k</option>
      <option>Q'eqchi'</option>
      <option>Rarámuli (Tarahumara)</option>
      <option>Seri</option>
      <option>Tacuate</option>
      <option>Tepehua</option>
      <option>Tepehuano del norte</option>
      <option>Tepehuano del sur</option>
      <option>Texistepequeño</option>
      <option>Tlahuica</option>
      <option>Tohono O’odham (Pápago)</option>
      <option>Tojolabal</option>
      <option>Totonaco</option>
      <option>Triqui</option>
      <option>Tseltal</option>
      <option>Tsotsil</option>
      <option>Wixárika (Huichol)</option>
      <option>Yaqui</option>
      <option>Yokot'an (Chontal de Tabasco)</option>
      <option>Zapoteco</option>
      <option>Zoque</option>
    </select>
    
  </div>
</div>

      <div className="custom-popup-container">
        {routesData.map(route => {
          if (!mapRef.current) return null;
const screenPoint = mapRef.current.project(route.endPoint);

          return (
            <div
              key={route.id}
              className="custom-route-popup"
              style={{
                position: 'absolute',
                left: `${screenPoint.x}px`,
                top: `${screenPoint.y}px`,
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -120%)',
              }}
            >
              <strong>Distancia:</strong> {(route.distance / 1000).toFixed(2)} km<br />
              {(() => {
  const totalMinutes = Math.round(route.duration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return (
    <>
      <strong>Tiempo:</strong> {hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`}
    </>
  );
})()}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Map;
