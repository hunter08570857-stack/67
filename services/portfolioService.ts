import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Asset, Transaction, DataMode } from '../types';
import { getAppMode, getEnv } from './configService';

// --- FIREBASE INIT ---
let db: any = null;

const initFirebase = () => {
  if (db) return db;
  const configStr = getEnv().FIREBASE_CONFIG;
  if (!configStr) return null;
  try {
    const firebaseConfig = JSON.parse(configStr);
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error("Firebase init failed", e);
    return null;
  }
};

// --- MOCK STORAGE ---
const LOCAL_STORAGE_KEY_ASSETS = 'mock_assets';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'mock_transactions';

const getMockAssets = (): Asset[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ASSETS);
  return saved ? JSON.parse(saved) : [
    { symbol: 'AAPL', quantity: 10, avgCost: 145.5 },
    { symbol: 'TSLA', quantity: 5, avgCost: 210.0 }
  ];
};

const getMockTransactions = (): Transaction[] => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
  return saved ? JSON.parse(saved) : [];
};

// --- SERVICE METHODS ---

export const getAssets = async (): Promise<Asset[]> => {
  const mode = getAppMode();
  if (mode === DataMode.REAL) {
    const firestore = initFirebase();
    if (!firestore) return getMockAssets(); // Fallback
    
    // Simplified: In a real app, this would be grouped by User ID
    // Here we just fetch a collection for demo purposes
    // Note: This logic assumes we manually aggregate trades to assets or store assets directly
    // For this demo, we will read 'transactions' and calculate assets on the fly to ensure consistency
    const txs = await getTransactions();
    const assetMap = new Map<string, { qty: number, cost: number }>();
    
    txs.forEach(tx => {
      if (!assetMap.has(tx.symbol)) assetMap.set(tx.symbol, { qty: 0, cost: 0 });
      const current = assetMap.get(tx.symbol)!;
      
      if (tx.type === 'BUY') {
        const totalCost = (current.qty * current.cost) + (tx.quantity * tx.price);
        const newQty = current.qty + tx.quantity;
        assetMap.set(tx.symbol, { qty: newQty, cost: totalCost / newQty });
      } else {
        const newQty = current.qty - tx.quantity;
        // Cost basis doesn't change on sell (FIFO/Avg Cost simplicity)
        assetMap.set(tx.symbol, { qty: newQty, cost: current.cost });
      }
    });

    const assets: Asset[] = [];
    assetMap.forEach((val, key) => {
      if (val.qty > 0) {
        assets.push({ symbol: key, quantity: val.qty, avgCost: val.cost });
      }
    });
    return assets;

  } else {
    return getMockAssets();
  }
};

export const getTransactions = async (): Promise<Transaction[]> => {
  const mode = getAppMode();
  if (mode === DataMode.REAL) {
    const firestore = initFirebase();
    if (!firestore) return getMockTransactions();
    
    try {
      const q = query(collection(firestore, 'transactions'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (e) {
      console.error("Firestore read error", e);
      return getMockTransactions();
    }
  } else {
    return getMockTransactions();
  }
};

export const addTransaction = async (tx: Omit<Transaction, 'id'>): Promise<void> => {
  const mode = getAppMode();
  
  if (mode === DataMode.REAL) {
    const firestore = initFirebase();
    if (firestore) {
      try {
        await addDoc(collection(firestore, 'transactions'), tx);
        return;
      } catch (e) {
        console.error("Firestore write error", e);
        // Fallthrough to local storage if real fails? No, just throw or alert.
        alert("交易寫入雲端失敗，請檢查 API 設定");
      }
    }
  } 
  
  // Mock Logic
  const newTx = { ...tx, id: Date.now().toString() };
  const currentTxs = getMockTransactions();
  const updatedTxs = [newTx, ...currentTxs];
  localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(updatedTxs));

  // Update Assets for Mock
  const currentAssets = getMockAssets();
  const assetIndex = currentAssets.findIndex(a => a.symbol === tx.symbol);
  
  if (tx.type === 'BUY') {
    if (assetIndex >= 0) {
      const asset = currentAssets[assetIndex];
      const totalCost = (asset.quantity * asset.avgCost) + (tx.quantity * tx.price);
      asset.quantity += tx.quantity;
      asset.avgCost = totalCost / asset.quantity;
    } else {
      currentAssets.push({ symbol: tx.symbol, quantity: tx.quantity, avgCost: tx.price });
    }
  } else {
    if (assetIndex >= 0) {
      currentAssets[assetIndex].quantity -= tx.quantity;
      if (currentAssets[assetIndex].quantity <= 0) {
        currentAssets.splice(assetIndex, 1);
      }
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_ASSETS, JSON.stringify(currentAssets));
};
