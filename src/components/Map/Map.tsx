// Map.tsx actualizado
// - Elimina capas de isocronas y Asambleas Regionales
// - Mantiene capas deseadas: regiones, mesas, wifi, inpi, presidencias, or
// - Agrega capa "polos" tipo polígono con popup del campo 'layer'
// - Centra vista en { lng: -95.00485, lat: 16.64434 }

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';

type MapProps = {
  layersVisibility: { [layerId: string]: boolean };
  isocronaMin: number;
};

const baseStyle = 'https://api.maptiler.com/maps/01976666-b449-7252-86b5-3e7b3213a9e6/style.json?key=QAha5pFBxf4hGa8Jk5zv';
const satelliteStyle = 'https://api.maptiler.com/maps/satellite/style.json?key=QAha5pFBxf4hGa8Jk5zv';

const Map: React.FC<MapProps> = ({ layersVisibility }) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

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

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: baseStyle,
      center: [-95.00485, 16.64434],
      zoom: 6.5,
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
      map.addLayer({
        id: 'LocalidadesSedeINPI',
        type: 'circle',
        source: 'LocalidadesSedeINPI',
        'source-layer': 'inpi_tile',
        paint: {
          'circle-radius': 2,
          'circle-color': '#666666',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.2
        },
        layout: { visibility: 'none' }
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
          <strong>Oficina de Representación:</strong> ${props.UA}<br/>
          <strong>Sede que le corresponde:</strong> ${props.Sede}
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

      const tecnologias = [
        { id: 'PuntosWiFiCFE_4G', color: '#9f2241', filtro: '4G' },
        { id: 'PuntosWiFiCFE_FIBRA', color: '#cda578', filtro: 'FIBRA O COBRE' },
        { id: 'PuntosWiFiCFE_SATELITAL', color: '#235b4e', filtro: 'SATELITAL' },
      ];

      map.addSource('PuntosWiFiCFE', { type: 'vector', url: 'pmtiles://data/PuntosWiFiCFE.pmtiles' });

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
          layout: { visibility: 'none' }
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

      // Capa "polos"
      map.addSource('polos', {
        type: 'vector',
        url: 'pmtiles://data/polos.pmtiles'
      });

      map.addLayer({
        id: 'polos',
        type: 'fill',
        source: 'polos',
        'source-layer': 'polos_tile',
        paint: {
          'fill-color': '#264653',
          'fill-opacity': 0.6,
          'fill-outline-color': '#ffffff'
        },
        layout: { visibility: 'none' }
      });

      map.on('mouseenter', 'polos', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features?.[0]?.properties;
        if (!props) return;
        popup.setLngLat(e.lngLat).setHTML(`<strong>Polígono:</strong> ${props.layer || 'Sin dato'}`).addTo(map);
      });

      map.on('mouseleave', 'polos', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <button
        onClick={toggleSatellite}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
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
    </div>
  );
};

export default Map;

