import React, { useEffect, useState, useContext } from 'react';
import { 
  LineChart, Wallet, BookOpen, Settings, Info, TrendingUp, DollarSign, BrainCircuit 
} from 'lucide-react';
import { getAppMode, setAppMode, isRealDataAvailable } from './services/configService';
import { DataMode, CandleData, Asset, Transaction } from './types';
import { fetchCandles, fetchQuote } from './services/marketService';
import { getAssets, getTransactions } from './services/portfolioService';
import { analyzeStock } from './services/geminiService';

// Components
import CandleChart from './components/CandleChart';
import Dashboard from './components/Dashboard';
import TradePanel from './components/TradePanel';

const App: React.FC = () => {
  const [mode, setMode] = useState<DataMode>(getAppMode());
  const [activeTab, setActiveTab] = useState<'MARKET' | 'PORTFOLIO'>('MARKET');
  
  // Market State
  const [symbol, setSymbol] = useState('AAPL');
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'1D' | '1M' | '1Y'>('1M');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  // Portfolio State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Init Data
  useEffect(() => {
    refreshData();
  }, [symbol, timeRange, mode]);

  useEffect(() => {
    refreshPortfolio();
  }, [mode]);

  const refreshData = async () => {
    const cData = await fetchCandles(symbol, timeRange);
    setCandles(cData);
    const qData = await fetchQuote(symbol);
    if (qData) setCurrentPrice(qData.c);
  };

  const refreshPortfolio = async () => {
    const a = await getAssets();
    setAssets(a);
    const t = await getTransactions();
    setTransactions(t);
  };

  const handleModeToggle = () => {
    // Only allow switching to Real if keys exist, or for demo allow toggle but it will fail/warn
    const newMode = mode === DataMode.REAL ? DataMode.MOCK : DataMode.REAL;
    setAppMode(newMode);
    setMode(newMode);
  };

  const handleAnalyze = async () => {
    if (!currentPrice) return;
    setAnalyzing(true);
    setAiAnalysis("Gemini 正在分析市場數據與技術型態...");
    const result = await analyzeStock(symbol, currentPrice);
    setAiAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-2 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 hidden md:block">AlphaTrade Pro</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${mode === DataMode.REAL ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-xs font-bold text-slate-600">
                {mode === DataMode.REAL ? '真實模式 (Real)' : '模擬模式 (Mock)'}
              </span>
            </div>
            
            <button 
              onClick={handleModeToggle}
              className="text-sm text-accent hover:underline"
            >
              切換模式
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-6 border-b border-slate-200 mb-8">
          <button 
            onClick={() => setActiveTab('MARKET')}
            className={`pb-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'MARKET' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
          >
            <LineChart size={18} /> 專業行情分析
          </button>
          <button 
             onClick={() => setActiveTab('PORTFOLIO')}
             className={`pb-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'PORTFOLIO' ? 'text-primary border-b-2 border-primary' : 'text-slate-400'}`}
          >
            <Wallet size={18} /> 資產與交易
          </button>
        </div>

        {/* MARKET VIEW */}
        {activeTab === 'MARKET' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Chart & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <input 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="border border-slate-300 rounded px-3 py-1 font-bold w-24 text-center"
                  />
                  <span className="text-2xl font-bold text-slate-900">
                    {currentPrice ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {['1D', '1M', '1Y'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range as any)}
                      className={`px-3 py-1 rounded text-sm font-medium transition ${timeRange === range ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
                <CandleChart data={candles} />
                <div className="flex justify-end gap-2 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500"></div> 收盤價</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-300"></div> 成交量</span>
                </div>
              </div>

              {/* Gemini AI Analysis */}
              <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 relative overflow-hidden">
                <div className="flex items-start gap-4 z-10 relative">
                  <div className="bg-white p-2 rounded-lg shadow-sm text-indigo-600">
                    <BrainCircuit size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-2">Gemini 智能投顧</h3>
                    {aiAnalysis ? (
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
                    ) : (
                      <p className="text-slate-400 text-sm">點擊下方按鈕，讓 AI 為您分析當前市場局勢。</p>
                    )}
                    <button 
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                      {analyzing ? '分析中...' : '生成投資建議'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Education & Tips */}
            <div className="space-y-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <BookOpen size={18} className="text-accent"/> 新手教學：如何看K線？
                 </h3>
                 <ul className="space-y-3 text-sm text-slate-600">
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">紅K (陽線):</span>
                     收盤價 &gt; 開盤價，代表買氣強，價格上漲。
                   </li>
                   <li className="flex gap-2">
                     <span className="text-green-500 font-bold">綠K (陰線):</span>
                     收盤價 &lt; 開盤價，代表賣壓重，價格下跌。
                   </li>
                   <li className="flex gap-2">
                     <span className="text-slate-900 font-bold">影線:</span>
                     上下突出的細線，代表當日最高與最低價的波動範圍。
                   </li>
                 </ul>
               </div>

               <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                 <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                   <Info size={18}/> 系統提示
                 </h3>
                 <p className="text-xs text-orange-700 leading-relaxed">
                   您目前處於 <strong>{mode === DataMode.REAL ? '真實模式' : '模擬演示模式'}</strong>。
                   {mode === DataMode.MOCK && " 在模擬模式下，所有數據均為亂數生成，交易紀錄僅保存在您的瀏覽器中。"}
                   {mode === DataMode.REAL && " 真實模式將連線至 Finnhub 取得即時報價，並將交易寫入 Firestore 資料庫。"}
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* PORTFOLIO VIEW */}
        {activeTab === 'PORTFOLIO' && (
          <div>
            <Dashboard assets={assets} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <TradePanel onTradeComplete={refreshPortfolio} />
              </div>

              <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">歷史交易紀錄</h3>
                  <span className="text-xs text-slate-400">最近 20 筆</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3 font-medium">時間</th>
                        <th className="px-6 py-3 font-medium">代號</th>
                        <th className="px-6 py-3 font-medium">類別</th>
                        <th className="px-6 py-3 font-medium text-right">價格</th>
                        <th className="px-6 py-3 font-medium text-right">股數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400">尚無交易紀錄</td>
                        </tr>
                      ) : (
                        transactions.slice(0, 20).map((tx, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-6 py-3 text-slate-600">
                              {new Date(tx.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-3 font-bold text-slate-800">{tx.symbol}</td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {tx.type === 'BUY' ? '買進' : '賣出'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right font-mono">${tx.price.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right">{tx.quantity}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;