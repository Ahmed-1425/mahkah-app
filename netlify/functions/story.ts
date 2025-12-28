import { Handler, HandlerEvent } from '@netlify/functions';

interface RequestBody {
  imageBase64: string;
  visitorName: string;
  visitorType: 'child' | 'family' | 'tourist';
  lang: 'ar' | 'en';
}

interface AIResponse {
  is_plant: boolean;
  error_message?: string;
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
    const prompt = `You are a plant expert at Al-Hariq Agri-Tourism Festival in Saudi Arabia.

STEP 1: Analyze the image. Is it a PLANT (tree, flower, herb, vegetable, fruit, shrub, cactus, etc.)?

If NOT a plant (person, animal, building, object, food, etc.):
Return JSON: {"is_plant": false, "error_message": "${lang === 'ar' ? 'عذراً، هذه الصورة لا تحتوي على نبتة! 🌱 يرجى تصوير نبتة أو شجرة.' : 'Sorry, this image does not contain a plant! 🌱 Please photograph a plant or tree.'}", "title": "", "story": "", "fun_fact": "", "question": "", "suggested_plant_name": "", "seasonal_status_hint": ""}

If YES a plant:
Create a ${lang === 'ar' ? 'captivating Arabic' : 'captivating English'} story (100-150 words) for ${visitorName}, a ${visitorType}.

Return JSON:
{
  "is_plant": true,
  "title": "Engaging title",
  "story": "Story connecting plant to Saudi agriculture/Al-Hariq region if citrus, otherwise general agricultural wisdom",
  "fun_fact": "Interesting fact about this plant type",
  "question": "Thought-provoking question",
  "suggested_plant_name": "Creative nickname in ${lang === 'ar' ? 'Arabic' : 'English'}",
  "seasonal_status_hint": "Season/growth info"
}

Style: ${visitorType === 'child' ? 'magical, wonder-filled' : visitorType === 'family' ? 'warm, nostalgic' : 'inspiring, cultural'}. 
Return ONLY valid JSON, no markdown.`.trim();

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
      
      // التأكد من وجود جميع الحقول الضرورية
      if (!aiResponse.hasOwnProperty('is_plant')) {
        aiResponse.is_plant = true; // افتراض أنه نبات إذا لم يذكر
      }
      
      // إضافة default values للحقول المفقودة
      aiResponse.title = aiResponse.title || 'نبتة جميلة';
      aiResponse.story = aiResponse.story || 'هذه نبتة رائعة!';
      aiResponse.fun_fact = aiResponse.fun_fact || 'النباتات تنتج الأكسجين!';
      aiResponse.question = aiResponse.question || 'هل تعرف اسم هذه النبتة؟';
      aiResponse.suggested_plant_name = aiResponse.suggested_plant_name || 'نبتة الطبيعة';
      aiResponse.seasonal_status_hint = aiResponse.seasonal_status_hint || 'موسم النمو';
      
      console.log('[Story Function] Validated AI response with defaults');
    } catch (e) {
      console.error('[Story Function] Failed to parse. Full text:', text);
      console.error('[Story Function] Parse error:', e);
      
      // محاولة إصلاح JSON الناقص
      let fixedText = text.trim();
      
      // إزالة أي markdown code blocks
      fixedText = fixedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // إذا ما فيه إغلاق للـ JSON، نحاول نكمله
      const openBraces = (fixedText.match(/{/g) || []).length;
      const closeBraces = (fixedText.match(/}/g) || []).length;
      
      if (openBraces > closeBraces) {
        console.log('[Story Function] Attempting to fix incomplete JSON...');
        
        // نشوف إذا فيه string مفتوح
        const lastQuote = fixedText.lastIndexOf('"');
        const afterLastQuote = fixedText.substring(lastQuote + 1);
        
        // إذا فيه محتوى بعد آخر quote ولا فيه quote ختامية
        if (afterLastQuote && !afterLastQuote.includes('"') && !afterLastQuote.trim().endsWith('}')) {
          fixedText += '..."';
        }
        
        // نضيف الأقواس المفقودة
        for (let i = 0; i < (openBraces - closeBraces); i++) {
          fixedText += '}';
        }
        
        try {
          aiResponse = JSON.parse(fixedText);
          console.log('[Story Function] Successfully fixed and parsed JSON!');
          
          // إضافة defaults للحقول المفقودة
          aiResponse.is_plant = aiResponse.is_plant !== false; // true if not explicitly false
          aiResponse.title = aiResponse.title || 'نبتة جميلة';
          aiResponse.story = aiResponse.story || 'هذه نبتة رائعة تنمو في طبيعتنا الخلابة.';
          aiResponse.fun_fact = aiResponse.fun_fact || 'النباتات أساس الحياة على الأرض.';
          aiResponse.question = aiResponse.question || 'هل تعرف فوائد هذه النبتة؟';
          aiResponse.suggested_plant_name = aiResponse.suggested_plant_name || 'نبتة الطبيعة';
          aiResponse.seasonal_status_hint = aiResponse.seasonal_status_hint || 'نبتة موسمية';
          
        } catch (e2) {
          console.error('[Story Function] Failed to fix JSON:', e2);
          // آخر محاولة: نرجع response افتراضي بدلاً من error
          aiResponse = {
            is_plant: true,
            title: 'نبتة جميلة',
            story: 'التقطت صورة رائعة لهذه النبتة! النباتات جزء مهم من تراثنا الزراعي وطبيعتنا الخلابة.',
            fun_fact: 'النباتات تساهم في تنقية الهواء وإنتاج الأكسجين.',
            question: 'هل تعتني بالنباتات في منزلك؟',
            suggested_plant_name: 'نبتة الطبيعة',
            seasonal_status_hint: 'نبتة جميلة'
          };
          console.log('[Story Function] Using fallback response');
        }
      } else {
        console.error('[Story Function] Cannot fix JSON');
        // استخدام fallback response
        aiResponse = {
          is_plant: true,
          title: 'نبتة رائعة',
          story: 'التقطت صورة جميلة لهذه النبتة! النباتات تضفي جمالاً على حياتنا وبيئتنا.',
          fun_fact: 'كل نبتة لها دور مهم في النظام البيئي.',
          question: 'ما رأيك في جمال هذه النبتة؟',
          suggested_plant_name: 'نبتة الحديقة',
          seasonal_status_hint: 'نبتة طبيعية'
        };
        console.log('[Story Function] Using fallback response due to parse error');
      }
    }

    console.log('[Story Function] Success! Parsing complete');
    
    // التحقق من أن الصورة تحتوي على نبات
    if (!aiResponse.is_plant) {
      console.log('[Story Function] Image is not a plant, returning error');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'not_a_plant',
          message: aiResponse.error_message || (lang === 'ar' 
            ? 'عذراً، هذه الصورة لا تحتوي على نبتة! 🌱'
            : 'Sorry, this image does not contain a plant! 🌱')
        })
      };
    }
    
    console.log('[Story Function] Success! Returning story for plant');
    
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
