// Modificaciones para App.tsx
// - Quitar capas de isocronas y asambleas regionales
// - Agregar capa "polos"
// - Eliminar slider de isocronas
// - Ajustar visibilidad y switches

import React, { useState } from 'react';
import InfoBox, { InfoBoxSection } from './components/InfoBox/InfoBox';
import Map from './components/Map/Map';
import './App.css';

const App: React.FC = () => {
  const [layersVisibility, setLayersVisibility] = useState<Record<string, boolean>>({
    mesas_cercanas_zona1: false,
    mesas_cercanas_zona2: false,
    regiones_zona1: false,
    regiones_zona2: false,
    LocalidadesSedeINPI: false,
    PresidenciasMunicipales: false,
    PuntosWiFiCFE_4G: false,
    PuntosWiFiCFE_FIBRA: false,
    PuntosWiFiCFE_SATELITAL: false,
    or_zona1: false,
    or_zona2: false,
    polos: false
  });

  const handleToggle = (id: string) => {
    setLayersVisibility(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: InfoBoxSection[] = [
    {
      title: 'Zona 1',
      items: [
        { id: 'or_zona1', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona1'] },
        { id: 'mesas_cercanas_zona1', label: 'Mesas de Paz', color: '#f8e71c', shape: 'square', switch: true, checked: layersVisibility['mesas_cercanas_zona1'] },
        { id: 'regiones_zona1', label: 'Regiones de Paz', color: '#66c2a5', shape: 'square', switch: true, checked: layersVisibility['regiones_zona1'] },
      ],
    },
    {
      title: 'Zona 2',
      items: [
        { id: 'or_zona2', label: 'Oficinas de Representación INPI', color: '#BC955C', shape: 'circle', switch: true, checked: layersVisibility['or_zona2'] },
        { id: 'mesas_cercanas_zona2', label: 'Mesas de Paz', color: '#f8e71c', shape: 'square', switch: true, checked: layersVisibility['mesas_cercanas_zona2'] },
        { id: 'regiones_zona2', label: 'Regiones de Paz', color: '#fc8d62', shape: 'square', switch: true, checked: layersVisibility['regiones_zona2'] }
      ],
    },
    {
      title: 'Comunidades Indígenas y Afromexicanas',
      items: [
        { id: 'LocalidadesSedeINPI', label: 'Pueblos Indígenas', color: '#666666', shape: 'circle', switch: true, checked: layersVisibility['LocalidadesSedeINPI'] },
      ],
    },
    {
      title: 'Presidencias Municipales',
      items: [
        { id: 'PresidenciasMunicipales', label: 'Cabeceras Municipales', color: '#000000', shape: 'circle', switch: true, checked: layersVisibility['PresidenciasMunicipales'] },
      ],
    },
    {
      title: 'Despliegue WiFi CFE',
      items: [
        { id: 'PuntosWiFiCFE_4G', label: '4G', color: '#9f2241', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_4G'] },
        { id: 'PuntosWiFiCFE_FIBRA', label: 'Fibra o Cobre', color: '#cda578', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_FIBRA'] },
        { id: 'PuntosWiFiCFE_SATELITAL', label: 'Satelital', color: '#235b4e', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_SATELITAL'] },
      ],
    },
    {
      title: 'Nuevos polos de desarrollo',
      items: [
        { id: 'polos', label: 'Polos', color: '#264653', shape: 'circle', switch: true, checked: layersVisibility['polos'] },
      ],
    },
  ];

  return (
    <>
      <InfoBox
        title="Mapa de Polos de Desarrollo"
        sections={sections}
        onToggle={handleToggle}
      />

      <Map layersVisibility={layersVisibility} isocronaMin={0} />
    </>
  );
};

export default App;

