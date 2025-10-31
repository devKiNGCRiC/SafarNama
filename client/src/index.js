import React from "react";
//import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/ReduxStore"; // Make sure you import your store
import { BrowserRouter , Routes , Route } from 'react-router-dom';


// Get the root element from the HTML
const rootElement = document.getElementById("root");

// Create a root and render the App component wrapped in Provider
const root = createRoot(rootElement);
root.render(
  <Provider store={store}>{/* Wrap the app in BrowserRouter */}
    <BrowserRouter future={{ v7_startTransition: true , v7_relativeSplatPath: true }}> 
      <Routes>
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
    {/* <App/> */}
  </Provider>
);




// //import '@mantine/core/styles.css';

// ReactDOM.render(
//   <Provider store={store}>
//     <App/>
//   </Provider>,
//   document.getElementById("root")
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals