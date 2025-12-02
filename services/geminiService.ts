import { GoogleGenAI, Type } from "@google/genai";
import { DreamAnalysis, MusicRecommendation, SoundscapeParams, CreativeWriting, TarotCard, TarotReadingResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeDream = async (dreamText: string): Promise<DreamAnalysis> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const model = "gemini-2.5-flash"; 

  const systemInstruction = `
    你是一位资深的心理咨询师和梦境解析专家，擅长荣格心理学和情绪疗愈。
    你的任务是根据用户描述的梦境，提供深度的心理分析和情绪调节建议。
    
    此外，你需要敏锐地察觉梦境描述中模糊或缺失的关键细节，并提出引导性问题帮助用户回忆。
    
    请以温暖、包容、富有洞察力的语气回答。
    
    输出必须是严格的 JSON 格式。
    不要使用 Markdown 代码块包裹 JSON，直接返回 JSON 对象。
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: dreamText,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "为这个梦起一个富有诗意或概括性的标题",
            },
            summary: {
              type: Type.STRING,
              description: "简要概括梦境的主要情节",
            },
            interpretation: {
              type: Type.STRING,
              description: "详细解析梦境的象征意义和潜在隐喻",
            },
            emotionalState: {
              type: Type.STRING,
              description: "分析梦境反映出的潜意识情绪状态（如焦虑、渴望、释怀等）",
            },
            psychologicalMeaning: {
              type: Type.STRING,
              description: "从心理学角度（如内心冲突、成长需求）进行深度解读",
            },
            guidance: {
              type: Type.STRING,
              description: "针对用户的情绪调节建议或现实生活的行动指导",
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "提取3-5个关键象征词汇",
            },
            dominantEmotion: {
              type: Type.STRING,
              description: "梦境体现的主要情绪（如焦虑、平静、兴奋），2-4字",
            },
            emotionalIntensity: {
              type: Type.INTEGER,
              description: "情绪强度，1-10之间的整数",
            },
            followUpQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "提出3个引导性问题，引导用户回忆梦中模糊的细节（如颜色、面孔、声音等），以激发更深层的潜意识连接。",
            }
          },
          required: ["title", "summary", "interpretation", "emotionalState", "psychologicalMeaning", "guidance", "keywords", "dominantEmotion", "emotionalIntensity", "followUpQuestions"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DreamAnalysis;
    } else {
      throw new Error("No response text received from Gemini.");
    }
  } catch (error) {
    console.error("Dream analysis failed:", error);
    throw error;
  }
};

export const suggestDreamMusic = async (analysis: DreamAnalysis): Promise<MusicRecommendation> => {
  if (!apiKey) throw new Error("API Key is missing.");
  
  const prompt = `
    基于以下梦境分析，推荐一首最能产生共鸣的背景音乐（纯音乐、古典、氛围音乐或后摇）。
    
    梦境标题: ${analysis.title}
    情绪状态: ${analysis.emotionalState}
    关键词: ${analysis.keywords.join(', ')}
    主导情绪: ${analysis.dominantEmotion} (强度: ${analysis.emotionalIntensity}/10)

    请在网络上搜索一首真实存在的曲目。
    请简要描述为什么这首曲子适合这个梦境（60字以内）。
    
    重点：请确保利用 Google Search 找到可播放的链接（如 YouTube, Spotify, 网易云音乐等）。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const intro = response.text || "无法生成推荐描述。";
    
    // Extract links from grounding chunks
    const tracks: { title: string; uri: string }[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          tracks.push({
            title: chunk.web.title || "未知曲目",
            uri: chunk.web.uri || "#"
          });
        }
      });
    }

    const uniqueTracks = Array.from(new Map(tracks.map(item => [item.uri, item])).values()).slice(0, 3);

    return {
      intro,
      tracks: uniqueTracks
    };

  } catch (error) {
    console.error("Music suggestion failed:", error);
    throw error;
  }
};

// --- New Audio Generation Function ---

export const generateSoundscapeParams = async (analysis: DreamAnalysis): Promise<SoundscapeParams> => {
    if (!apiKey) throw new Error("API Key is missing.");

    const prompt = `
      根据以下梦境分析，为 Web Audio API 合成器生成音频参数，以创造一个符合梦境氛围的生成式音景（Soundscape）。
      
      梦境: ${analysis.title}
      主导情绪: ${analysis.dominantEmotion} (强度: ${analysis.emotionalIntensity}/10)
      解析: ${analysis.interpretation}

      请决定：
      1. 根音频率 (rootFreq): 低频更压抑，高频更空灵。
      2. 调式 (scale): major(明亮), minor(忧郁), lydian(梦幻), dorian(神秘), whole_tone(迷离/噩梦).
      3. 波形 (waveShape): sine(柔和), triangle(温暖), sawtooth(尖锐/紧张), square(空洞).
      4. 纹理 (texture): ethereal(空灵), warm(温暖), dark(黑暗), gritty(粗糙).
      5. 速度 (tempo): 30-90 BPM，影响调制速度。
      6. 简短描述这个音景的感觉。

      Output strictly JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        rootFreq: { type: Type.NUMBER },
                        scale: { type: Type.STRING, enum: ['major', 'minor', 'pentatonic_major', 'pentatonic_minor', 'lydian', 'dorian', 'whole_tone'] },
                        waveShape: { type: Type.STRING, enum: ['sine', 'triangle', 'sawtooth', 'square'] },
                        texture: { type: Type.STRING, enum: ['ethereal', 'warm', 'dark', 'gritty'] },
                        tempo: { type: Type.NUMBER },
                        moodDescription: { type: Type.STRING }
                    },
                    required: ['rootFreq', 'scale', 'waveShape', 'texture', 'tempo', 'moodDescription']
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as SoundscapeParams;
        }
        throw new Error("No response for soundscape params");
    } catch (error) {
        console.error("Soundscape generation failed:", error);
        // Fallback default
        return {
            rootFreq: 220,
            scale: 'pentatonic_major',
            waveShape: 'sine',
            texture: 'warm',
            tempo: 60,
            moodDescription: "默认的平静音景"
        };
    }
}

// --- Image Generation Function ---

export const generateDreamImage = async (analysis: DreamAnalysis, style: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const prompt = `
    Draw an artistic visualization of the following dream.
    
    Style: ${style}
    Dream Title: ${analysis.title}
    Visual Imagery: ${analysis.keywords.join(', ')}
    Atmosphere/Mood: ${analysis.emotionalState}
    Summary: ${analysis.summary}

    Create a high-quality, evocative image that captures the surreal nature of this dream.
    Do not include text in the image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      // Note: responseMimeType and responseSchema are not supported for image generation models
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${base64}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

// --- Creative Writing Function ---

export const generateCreativeWriting = async (dream: string, analysis: DreamAnalysis, type: 'story' | 'poem'): Promise<CreativeWriting> => {
    if (!apiKey) throw new Error("API Key is missing.");

    const prompt = `
      将用户的梦境改写为一篇${type === 'story' ? '微小说（Short Story）' : '现代诗（Poem）'}。
      
      原始梦境: ${dream}
      梦境解析: ${analysis.interpretation}
      情绪基调: ${analysis.emotionalState}

      要求：
      1. 保持梦境的超现实感和核心意象。
      2. 语言优美，富有文学性。
      3. ${type === 'story' ? '以第一人称叙述，字数在300字左右，增强沉浸感。' : '意象朦胧，分行排列，字数不限。'}
      4. 输出JSON格式，包含 title (作品标题) 和 content (正文)。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING },
                    },
                    required: ['title', 'content']
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            return {
                type,
                title: result.title,
                content: result.content
            };
        }
        throw new Error("No creative writing response");
    } catch (error) {
        console.error("Creative writing generation failed:", error);
        throw error;
    }
}

// --- Tarot Function ---

export const interpretTarotReading = async (question: string, cards: TarotCard[]): Promise<TarotReadingResult> => {
    if (!apiKey) throw new Error("API Key is missing.");

    // Format cards for the prompt
    const cardDescriptions = cards.map((card, index) => {
        const position = index === 0 ? "过去 (Past)" : index === 1 ? "现在 (Present)" : "未来 (Future)";
        const orientation = card.isReversed ? "逆位 (Reversed)" : "正位 (Upright)";
        return `${position}: ${card.name_cn} (${card.name}) - ${orientation}`;
    }).join('\n');

    const prompt = `
      你是一位精通荣格心理学和神秘学的塔罗牌解读大师。
      用户提出了一个问题（或者在冥想中）："${question || '（用户未明确问题，请针对当下的生命状态进行解读）'}"
      
      抽出的牌阵（时间流牌阵）：
      ${cardDescriptions}

      请进行深度解读：
      1. Overview: 综合三张牌的能量流动，给出整体基调。
      2. Past/Present/Future: 分别解读每一张牌在对应位置的含义，结合正逆位。
      3. Guidance: 给出富有哲理和启发性的行动建议或心理指引。

      请输出 JSON 格式。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overview: { type: Type.STRING },
                        past: { type: Type.STRING },
                        present: { type: Type.STRING },
                        future: { type: Type.STRING },
                        guidance: { type: Type.STRING },
                    },
                    required: ['overview', 'past', 'present', 'future', 'guidance']
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as TarotReadingResult;
        }
        throw new Error("No tarot interpretation response");
    } catch (error) {
        console.error("Tarot interpretation failed:", error);
        throw error;
    }
}