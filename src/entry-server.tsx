import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';

export function render(path: string): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return renderToString(
    <StaticRouter basename={import.meta.env.BASE_URL} location={`${basePath}${path}`}>
      <App />
    </StaticRouter>
  );
}
