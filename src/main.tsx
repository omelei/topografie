import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Foutscherm } from './features/shell/Foutscherm';
import { OuderVraag } from './features/premium/OuderVraag';
import { brand } from './config/brand';
import './index.css';
import './design/kleuren.css';

document.title = brand.name;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* Een fout in welk scherm dan ook liet een wit vlak achter (ADR-166).
        Hier en niet per scherm: de app is één boom en een fout die niet
        opgevangen wordt, haalt hem helemaal weg — waar hij ook vandaan kwam. */}
    <Foutscherm>
      <App />
    </Foutscherm>
    {/* "Vraag het even aan je ouders" (ADR-163). Hier en niet in een scherm:
        een slot zit overal — op een modulepagina, in de kolom, op het
        uitslagscherm na een ronde — en een `<dialog>` in de toplaag trekt zich
        toch niets aan van waar hij in het document staat. Zo is er één, en
        staat hij nooit half achter iets anders. */}
    <OuderVraag />
  </React.StrictMode>,
);
