import { Handler, HandlerEvent } from '@netlify/functions';

interface RequestBody {
  imageBase64: string;
  visitorName: string;
  visitorType: 'child' | 'family' | 'tourist';
  lang: 'ar' | 'en';
}

interface AIResponse {
  title: string;
  story: string;
  fun_fact: string;
  question: string;
  suggested_plant_name: string;
  seasonal_status_hint: string;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // فقط POST مسموح
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const API_KEY = process.env.API_KEY;
    
    console.log('[Story Function] Started. API Key present:', !!API_KEY);
    
    if (!API_KEY) {
      console.error('[Story Function] API_KEY not found in environment variables');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'API Key not configured' })
      };
    }

    const body: RequestBody = JSON.parse(event.body || '{}');
    const { imageBase64, visitorName, visitorType, lang } = body;

    console.log('[Story Function] Request data:', { visitorName, visitorType, lang, hasImage: !!imageBase64 });

    if (!imageBase64 || !visitorName || !visitorType || !lang) {
      console.error('[Story Function] Missing required fields');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // إزالة prefix من base64
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    // بناء System Instruction
    const prompt = `
You are an expert storytelling Agri-Tourism Guide at the Al-Hariq Citrus Festival (مهرجان الحمضيات بالحريق).

A visitor named ${visitorName} who is a ${visitorType} just took this photo in an Al-Hariq farm.

Create a magical story about this plant in ${lang === 'ar' ? 'Arabic' : 'English'}.

Guidelines:
- TONE: ${visitorType === 'child' ? 'Whimsical, magical, fairy-tale like' : visitorType === 'family' ? 'Nostalgic, bonding, about roots and heritage' : 'Inspiring, cultural, legendary'}.
- Story Length: 120-200 words.
- Connect to Al-Hariq's citrus heritage.
- Keep plant identification general (شجرة/نبتة).

IMPORTANT: Return ONLY a valid JSON object (no markdown, no code blocks, no backticks) with this exact structure:
{
  "title": "عنوان القصة",
  "story": "القصة الكاملة هنا...",
  "fun_fact": "معلومة زراعية ممتعة",
  "question": "سؤال للزائر",
  "suggested_plant_name": "اسم مقترح للنبتة",
  "seasonal_status_hint": "حالة موسمية"
}
    `.trim();

    // استدعاء Google Gemini API
    // استخدام gemini-2.5-flash - الأحدث ومتاح للـ free tier
    const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
    
    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    console.log('[Story Function] Calling Gemini API...');
    
    const response = await fetch(`${apiUrl}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[Story Function] Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Story Function] Gemini API Error:', errorText);
      return {
        statusCode: response.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to generate story', details: errorText })
      };
    }

    const data = await response.json();
    console.log('[Story Function] Received response from Gemini');
    
    // استخراج النص من الاستجابة
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('[Story Function] No text in response:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No response from AI', details: data })
      };
    }

    console.log('[Story Function] Raw response length:', text.length);
    console.log('[Story Function] Full response:', text);
    
    // تنظيف النص من markdown code blocks
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    text = text.trim();
    
    console.log('[Story Function] Parsing AI response...');
    
    // تحليل JSON من النص
    let aiResponse: AIResponse;
    try {
      aiResponse = JSON.parse(text);
      console.log('[Story Function] Successfully parsed AI response');
    } catch (e) {
      console.error('[Story Function] Failed to parse. Full text:', text);
      console.error('[Story Function] Parse error:', e);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid AI response format', 
          fullText: text,
          parseError: e instanceof Error ? e.message : 'Unknown error'
        })
      };
    }

    console.log('[Story Function] Success! Returning story');
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiResponse)
    };

  } catch (error) {
    console.error('[Story Function] Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
