import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from '../types';
import { DollarSign, PieChart as PieIcon } from 'lucide-react';

interface DashboardProps {
  assets: Asset[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ assets }) => {
  
  const stats = useMemo(() => {
    // Note: In a real app we need real-time price for each asset to calc Value.
    // Here we use avgCost as a proxy for current Value for the pie chart visualization 
    // to avoid fetching 10 quotes simultaneously in this demo.
    const totalValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.avgCost), 0);
    
    const chartData = assets.map(asset => ({
      name: asset.symbol,
      value: asset.quantity * asset.avgCost
    }));

    return { totalValue, chartData };
  }, [assets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Value Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-2 text-slate-500">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <DollarSign size={20} />
          </div>
          <span className="font-medium">總資產估值 (成本計)</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 ml-1">
          ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        <p className="text-xs text-slate-400 mt-2 ml-1">
          包含 {assets.length} 檔持股
        </p>
      </div>

      {/* Pie Chart Card */}
      <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center">
        <div className="flex-1 w-full h-64">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={stats.chartData}
                 cx="50%"
                 cy="50%"
                 innerRadius={60}
                 outerRadius={80}
                 paddingAngle={5}
                 dataKey="value"
               >
                 {stats.chartData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
               <Legend verticalAlign="middle" align="right" layout="vertical" />
             </PieChart>
           </ResponsiveContainer>
        </div>
        <div className="sm:w-1/3 mt-4 sm:mt-0 pl-4 border-l border-slate-100">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <PieIcon size={16} /> 資產配置
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {assets.map((asset, i) => (
              <div key={asset.symbol} className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  {asset.symbol}
                </span>
                <span className="font-mono text-slate-500">{asset.quantity}股</span>
              </div>
            ))}
            {assets.length === 0 && <span className="text-slate-400 text-sm">尚無資產</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
