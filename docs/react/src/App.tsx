import FPSStats from 'react-fps-stats';

import Deck from './Deck.tsx';
import Maplibre from './Maplibre.tsx';
import Mapbox from './Mapbox.tsx';

export default function App() {
  return (
    <div className="relative w-full h-full">
      {/*
      <Deck />
      <Mapbox />
      */}
      <Maplibre />
      <FPSStats top='auto' right={0} bottom={0} left='auto' />
    </div>
  );
}
