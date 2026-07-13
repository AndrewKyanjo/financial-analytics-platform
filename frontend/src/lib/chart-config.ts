import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
);

ChartJS.defaults.color = "#45464d";
ChartJS.defaults.font.family = "Inter, sans-serif";
ChartJS.defaults.borderColor = "rgba(198, 198, 205, 0.35)";
