import { GoogleGenAI } from "@google/genai";
import { getAppMode, getEnv } from "./configService";
import { DataMode } from "../types";

export const analyzeStock = async (symbol: string, currentPrice: number): Promise<string> => {
  const mode = getAppMode();

  if (mode === DataMode.REAL) {
    try {
      // Must use process.env.API_KEY as per instructions
      // Note: In a Vite app, this relies on define/replace plugin or the user strictly following the 'process.env.API_KEY' instruction format.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        你是一位專業的金融分析師。請針對股票代號 ${symbol} (現價: ${currentPrice}) 進行簡短的分析。
        包含：
        1. 市場情緒總結
        2. 短期操作建議 (買入/持有/賣出)
        3. 風險提示
        
        重要規定：請直接輸出純文字，不要使用 Markdown 格式 (如 **粗體**, # 標題等)，保持語氣專業且客觀。
        字數限制：200字以內。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text || "無法產生分析結果。";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "AI 分析服務暫時無法使用 (請檢查 API 金鑰)。";
    }
  } else {
    // Mock Response
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`[模擬分析] 針對 ${symbol} 的市場表現，目前技術指標顯示多頭排列，股價位於 ${currentPrice} 附近震盪。建議投資人可以分批佈局，但需注意近期大盤波動風險。若跌破支撐位建議暫時觀望。此為模擬數據，非真實投資建議。`);
      }, 1500);
    });
  }
};