import { VisitorInfo, AIResponse } from "../types";

export const generatePlantStory = async (
  imageB64: string,
  visitor: VisitorInfo
): Promise<AIResponse> => {
  // استدعاء Netlify Function بدلاً من Google AI مباشرة
  const response = await fetch('/.netlify/functions/story', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: imageB64,
      visitorName: visitor.name,
      visitorType: visitor.type,
      lang: visitor.language
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Netlify Function Error:', response.status, errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }
    
    // رمي error مع تفاصيل أكثر
    const errorMsg = errorData.error || errorText || response.statusText;
    throw new Error(`[${response.status}] ${errorMsg}`);
  }

  const data = await response.json();
  return data as AIResponse;
};
