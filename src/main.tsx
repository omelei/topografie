import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Foutscherm } from './features/shell/Foutscherm';
import { OuderVraag } from './features/premium/OuderVraag';
import { Profielwisselaar } from './features/ouder/Profielwisselaar';
import { laatBijhouden } from './store/gezin/aanleiding';
import './index.css';
import './design/kleuren.css';

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
    {/* "Wie gebruikt de app?" (ADR-173). Hier om dezelfde reden als hierboven:
        de knop staat in de balk, diep in de Shell, en het venster hoort in de
        toplaag te staan zodat er één van is in plaats van één per tak van
        `App`. */}
    <Profielwisselaar />
  </React.StrictMode>,
);

// Wat er sinds de vorige keer geoefend is en nog niet in het account staat —
// een ronde die offline afliep — gaat mee zodra de app weer opent (ADR-188).
laatBijhouden();
