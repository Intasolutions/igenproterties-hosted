import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import Input from '../../components/Input';
import Button from '../../components/Button';
import DateRangePicker from '../../components/DateRangePicker';
import { motion } from 'framer-motion';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend);

function Dashboard() {
  const [stats, setStats] = useState({});
  const [trend, setTrend] = useState([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [spendData, setSpendData] = useState([]);


useEffect(() => {
  API.get('dashboard-stats/')
    .then(res => {
      console.log('Dashboard stats response:', res.data);
      setStats(res.data);
      setTrend(res.data.trend_data || []);
    })
    .catch(err => console.error('Dashboard error:', err));

  // ✅ Fetch Spend by Cost Centre
  API.get('spend-by-cost-centre/')
    .then(res => {
      console.log('Spend by Cost Centre:', res.data);
      setSpendData(res.data || []);
    })
    .catch(err => console.error('Spend Pie Chart error:', err));
}, []);

  const filteredTrend = trend.filter(item => {
    const matchesSearch = !search || item.date.includes(search);
    const inDateRange = (!dateRange.from || new Date(item.date) >= new Date(dateRange.from)) &&
                        (!dateRange.to || new Date(item.date) <= new Date(dateRange.to));
    return matchesSearch && inDateRange;
  });

  const chartData = {
    labels: filteredTrend.map(item => item.date),
    datasets: [
      {
        label: 'Transactions (Past Days)',
        data: filteredTrend.map(item => item.transactions),
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

const pieData = {
  labels: spendData.map(item => item.cost_centre),
  datasets: [
    {
      label: 'Spend by Cost Centre',
      data: spendData.map(item => item.total),
      backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      borderWidth: 1,
    },
  ],
};


  return (
    <div className="p-6 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Main Dashboard</h1>
        {/* <div className="flex gap-2 items-center w-full md:w-auto">
          <Input placeholder="Search by date..." value={search} onChange={e => setSearch(e.target.value)} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div> */}
      </div>

      {/* Stat Cards */}
      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
        {Object.entries({
          Users: stats.total_users,
          Companies: stats.total_companies,
          Projects: stats.total_projects,
          Properties: stats.total_properties,
          Assets: stats.total_assets,
          Contacts: stats.total_contacts,
          'Cost Centres': stats.total_cost_centres,
          Banks: stats.total_banks,
          Vendors: stats.total_vendors,
          'Transaction Types': stats.total_transaction_types,
          Transactions: stats.total_transactions,
        }).map(([label, value]) => (
         <motion.div
  key={label}
  whileHover={{ scale: 1.05 }}
  className="bg-white rounded-2xl shadow-md p-5 text-center border border-gray-100 transition-all hover:shadow-lg hover:border-indigo-200"
>
  <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase">{label}</p>
  <p className="text-3xl font-extrabold text-indigo-600 mt-2">{value ?? 0}</p>
</motion.div>

        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div layout className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Transaction Trends</h2>
          <Line data={chartData} />
        </motion.div>

        <motion.div layout className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Spend by Cost Centre</h2>
          <Pie data={pieData} />
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
