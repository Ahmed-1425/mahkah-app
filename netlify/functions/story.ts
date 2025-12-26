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
    const prompt = `You are a storytelling guide at Al-Hariq Citrus Festival. Create a ${lang === 'ar' ? 'short Arabic' : 'short English'} story (80-120 words) about this plant for ${visitorName}, a ${visitorType}.

Return ONLY valid JSON:
{
  "title": "Story title",
  "story": "80-120 word story connecting to Al-Hariq citrus heritage",
  "fun_fact": "Agricultural fact",
  "question": "Question for visitor",
  "suggested_plant_name": "Plant nickname",
  "seasonal_status_hint": "Season info"
}

Style: ${visitorType === 'child' ? 'magical' : visitorType === 'family' ? 'nostalgic' : 'inspiring'}. No markdown.`.trim();

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
        maxOutputTokens: 4096,
        stopSequences: []
      }
    };

    console.log('[Story Function] Calling Gemini API...');
    
    // محاولة مع retry للـ rate limiting
    let response;
    let retries = 3;
    
    for (let i = 0; i < retries; i++) {
      response = await fetch(`${apiUrl}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[Story Function] Gemini API response status:', response.status, `(attempt ${i + 1}/${retries})`);

      // إذا نجح، نكمل
      if (response.ok) {
        break;
      }

      // إذا 429 (rate limit), ننتظر ونعيد المحاولة
      if (response.status === 429 && i < retries - 1) {
        const waitTime = (i + 1) * 2000; // 2s, 4s, 6s
        console.log(`[Story Function] Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // إذا خطأ ثاني، نرجع الخطأ
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Story Function] Gemini API Error:', errorText);
        return {
          statusCode: response.status,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: response.status === 429 
              ? 'الخدمة مزدحمة حالياً، يرجى المحاولة بعد قليل' 
              : 'Failed to generate story', 
            details: errorText 
          })
        };
      }
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
      
      // محاولة إصلاح JSON الناقص
      let fixedText = text.trim();
      
      // إذا ما فيه إغلاق للـ JSON، نحاول نكمله
      const openBraces = (fixedText.match(/{/g) || []).length;
      const closeBraces = (fixedText.match(/}/g) || []).length;
      
      if (openBraces > closeBraces) {
        console.log('[Story Function] Attempting to fix incomplete JSON...');
        // نضيف إغلاق للـ strings والـ object
        if (!fixedText.endsWith('"')) {
          fixedText += '..."}';
        }
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          fixedText += '}';
        }
        
        try {
          aiResponse = JSON.parse(fixedText);
          console.log('[Story Function] Successfully fixed and parsed JSON!');
        } catch (e2) {
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
      } else {
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
