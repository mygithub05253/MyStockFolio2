import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import reportWebVitals from './reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import router from './routes/router';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore } from 'redux'; // createStore import
import rootReducer from './modules'; // rootReducer import 확인
import store from './store';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}> {/* Provider로 App 감싸기 */}
      {/* App 대신 RouterProvider 사용 */}
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);

reportWebVitals();