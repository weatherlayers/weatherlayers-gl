import './logo.css';

export function getLogo(): HTMLElement {
  const div = document.createElement('div');
  div.className = 'weatherlayers-logo';

  const a = document.createElement('a');
  a.href = 'https://weatherlayers.com';
  a.target = '_blank';
  a.ariaLabel = 'WeatherLayers';
  div.appendChild(a);
  
  return div;
}