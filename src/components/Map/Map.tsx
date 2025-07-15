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
      center: [-105.15135, 23.55291],
      zoom: 4.47,
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
      const zonas = ['zona1', 'zona2'];
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
      zonas.forEach(zona => {
        map.addSource(`mesas_cercanas_${zona}`, {
          type: 'vector',
          url: `pmtiles://data/mesas_cercanas_${zona}.pmtiles`
        });
        
        map.addLayer({
          id: `mesas_cercanas_${zona}`,
          type: 'fill',
          source: `mesas_cercanas_${zona}`,
          'source-layer': `mesas_cercanas_${zona}_tile`,
          paint: {
            'fill-color': '#f8e71c',
            'fill-opacity': 0.4,
            'fill-outline-color': '#333333'
          },
          layout: { visibility: 'none' }
        });

        map.on('mouseenter', `mesas_cercanas_${zona}`, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features?.[0]?.properties;
          if (!props) return;
          popup.setLngLat(e.lngLat).setHTML(`
            <strong>Entidad:</strong> ${props._NOM_ENT || 'Sin dato'}<br/>
            <strong>Región:</strong> ${props._REGION || 'Sin dato'}<br/>
            <strong>Nombre Región:</strong> ${props._NOM_REGION || 'Sin dato'}
          `).addTo(map);
        });

        map.on('mouseleave', `mesas_cercanas_${zona}`, () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        map.addSource(`regiones_${zona}`, {
          type: 'vector',
          url: `pmtiles://data/regiones_${zona}.pmtiles`
        });

        const colorSet = ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'];
        const matchValues: (string | number)[] = [];
        for (let i = 1; i <= 266; i++) {
          matchValues.push(i, colorSet[i % colorSet.length]);
        }
        const matchExpression = ['match', ['get', '_REGION'], ...matchValues, '#cccccc'] as any;

        map.addLayer({
          id: `regiones_${zona}`,
          type: 'fill',
          source: `regiones_${zona}`,
          'source-layer': `regiones_${zona}_tile`,
          paint: {
            'fill-color': matchExpression,
            'fill-opacity': 0.5,
            'fill-outline-color': '#333333'
          },
          layout: { visibility: 'none' }
        });

        map.on('mousemove', `regiones_${zona}`, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features?.[0]?.properties;
          if (!props) return;
          popup.setLngLat(e.lngLat).setHTML(`
            <strong>Entidad:</strong> ${props._NOM_ENT || 'Sin dato'}<br/>
            <strong>Municipio:</strong> ${props.NOMGEO || 'Sin dato'}<br/>
            <strong>Región:</strong> ${props._REGION || 'Sin dato'}<br/>
            <strong>Nombre Región:</strong> ${props._NOM_REGION || 'Sin dato'}
          `).addTo(map);
        });

        map.on('mouseleave', `regiones_${zona}`, () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });

        map.addSource(`or_${zona}`, {
          type: 'vector',
          url: `pmtiles://data/or_${zona}.pmtiles`
        });

        map.addLayer({
          id: `or_${zona}`,
          type: 'circle',
          source: `or_${zona}`,
          'source-layer': `or_${zona}_tile`,
          paint: {
            'circle-radius': 5.5,
            'circle-color': '#BC955C',
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1
          },
          layout: { visibility: 'none' }
        });

        map.on('mouseenter', `or_${zona}`, (e) => {
          map.getCanvas().style.cursor = 'pointer';
          const props = e.features?.[0]?.properties;
          if (!props) return;
          popup.setLngLat(e.lngLat).setHTML(`
            <strong>Entidad:</strong> ${props.nom_ent || 'Sin dato'}<br/>
            <strong>Municipio:</strong> ${props.nom_mun || 'Sin dato'}<br/>
            <strong>Localidad:</strong> ${props.nom_loc || 'Sin dato'}<br/>
            <strong>Oficina de Representación:</strong> ${props.or_ccpi || 'Sin dato'}
          `).addTo(map);
        });

        map.on('mouseleave', `or_${zona}`, () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
      });

      map.addSource('LocalidadesSedeINPI', { type: 'vector', url: 'pmtiles://data/inpi.pmtiles' });
      const dark2 = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'];
const puebloMatch: (string | number)[] = [];
for (let i = 1; i <= 72; i++) {
  puebloMatch.push(i, dark2[i % dark2.length]);  // NOTA: i como número
}
const puebloExpression = ['match', ['get', 'ID_Pueblo'], ...puebloMatch, '#666666'] as any;

      map.addLayer({
        id: 'LocalidadesSedeINPI',
        type: 'circle',
        source: 'LocalidadesSedeINPI',
        'source-layer': 'inpi_tile',
        paint: {
          'circle-radius': 2.5,
          'circle-color': puebloExpression,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.3  
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
          <strong>Estimación de la población:</strong> ${props.PTC_1}<br/>
          <strong>Número de asentamientos:</strong> ${props.NA_2}<br/>
          <strong>Población en hogares indígenas (loc sede) :</strong> ${props.PHOG_IND}<br/>
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
    'fill-outline-color': '#333333'
  },
  layout: {
    visibility: layersVisibility['nucleos_agrarios'] ? 'visible' : 'none'
  }
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
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
