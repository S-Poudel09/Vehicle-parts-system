import axios from "axios";

const API = axios.create({
  baseURL: "https://localhost:7134/api",
});

export default API;