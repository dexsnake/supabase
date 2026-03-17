import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { supabase } from './supabaseClient';

import '@ionic/react/css/ionic.bundle.css';

/* Theme variables */
import './theme/variables.css';
import { LoginPage } from './pages/Login';
import { AccountPage } from './pages/Account';
import { useEffect, useState } from 'react';
import { Claims } from '@supabase/supabase-js';

setupIonicReact();

const App: React.FC = () => {
  const [claims, setClaims] = useState<Claims | null>(null);

  useEffect(() => {
    supabase.auth.getClaims().then(({ data: { claims } }) => {
      setClaims(claims);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getClaims().then(({ data: { claims } }) => {
        setClaims(claims);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route
            exact
            path="/"
            render={() => {
              return claims ? <Redirect to="/account" /> : <LoginPage />;
            }}
          />
          <Route exact path="/account">
            <AccountPage />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
