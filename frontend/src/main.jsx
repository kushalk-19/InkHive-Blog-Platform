import { createRoot } from "react-dom/client";
import axios from 'axios';
import App from "./App.jsx";
import "./index.css";

axios.defaults.withCredentials = true;

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
