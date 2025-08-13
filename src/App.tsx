import React, { useState } from 'react';
import InfoBox, { InfoBoxSection } from './components/InfoBox/InfoBox';
import Map from './components/Map/Map';
import './App.css';

const App: React.FC = () => {
  const [layersVisibility, setLayersVisibility] = useState<Record<string, boolean>>({
    trazo_actual: true,
    comunidades1y2: true,
    nucleos_directos: true,
    nucleos5km: true,
    LocalidadesSedeINPI: true,
    PuntosWiFiCFE_4G: false,
    PuntosWiFiCFE_FIBRA: false,
    PuntosWiFiCFE_SATELITAL: false,
    PresidenciasMunicipales: false,
    anp: false,
    nucleos_agrarios: false,
       
  });

  const handleToggle = (id: string) => {
    setLayersVisibility(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const sections: InfoBoxSection[] = [
  {
    title: 'Tren México - Quéretaro',
    items: [
      { id: 'trazo_actual',      label: 'Trazo actual',           color: '#ff0000', shape: 'line',   switch: true, checked: layersVisibility['trazo_actual'] },
      { id: 'comunidades1y2',    label: 'Comunidades (1 y 2)',    color: '#ff8c00', shape: 'circle', switch: true, checked: layersVisibility['comunidades1y2'] },
      { id: 'nucleos_directos',  label: 'Núcleos directos',       color: '#85b66f', shape: 'square', switch: true, checked: layersVisibility['nucleos_directos'] },
      { id: 'nucleos5km',        label: 'Núcleos a 5 km',         color: '#356c61', shape: 'square', switch: true, checked: layersVisibility['nucleos5km'] },
    ],
  },

  {
    title: 'Comunidades Indígenas y Afromexicanas',
    items: [
      { id: 'LocalidadesSedeINPI', label: 'Pueblos Indígenas', color: '#666666', shape: 'circle', switch: true, checked: layersVisibility['LocalidadesSedeINPI'] },
    ],
  },

  {
    title: 'Núcleos Agrarios en México 2024',
    items: [
      { id: 'nucleos_agrarios', label: 'Núcleos Agrarios', color: '#4b352a', shape: 'square', switch: true, checked: layersVisibility['nucleos_agrarios'] },
    ],
  },
  {
    title: 'Áreas Naturales Protegidas Federales 2024',
    items: [
      { id: 'anp', label: 'Áreas Naturales Protegidas Federales', color: '#93DA97', shape: 'square', switch: true, checked: layersVisibility['anp'] },
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
      { id: 'PuntosWiFiCFE_4G', label: '4G',             color: '#9f2241', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_4G'] },
      { id: 'PuntosWiFiCFE_FIBRA', label: 'Fibra o Cobre', color: '#cda578', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_FIBRA'] },
      { id: 'PuntosWiFiCFE_SATELITAL', label: 'Satelital', color: '#235b4e', shape: 'circle', switch: true, checked: layersVisibility['PuntosWiFiCFE_SATELITAL'] },
    ],
  },
];


  return (
    <>
      <InfoBox
        title="Mapa de la Dirección General de Participación y Consultas - SEGOB"
        sections={sections}
        onToggle={handleToggle}
      />

      <Map layersVisibility={layersVisibility} isocronaMin={0} />
    </>
  );
};

export default App;

