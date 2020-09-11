import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import './index.css';
import App from './Frontend/App';
import * as serviceWorker from './serviceWorker';
import { CookiesProvider } from 'react-cookie';
import BackOffice from './BackOffice/BackOffice';
import Firebase from './Firestore';

const firestore = new Firebase();

ReactDOM.render(
    <Router basename={process.env.PUBLIC_URL}>
        <Route exact path="/admin" component={() => <BackOffice firestore={firestore} />} />
        <Route exact path="/" render={() => <CookiesProvider> <App firestore={firestore}/> </CookiesProvider> } />
    </Router>
, document.getElementById('root'));
serviceWorker.unregister();
