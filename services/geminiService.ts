
import { GoogleGenAI, Type } from "@google/genai";
import { DreamAnalysis, MusicRecommendation, SoundscapeParams, CreativeWriting, TarotCard, TarotReadingResult, TarotSpread, DreamEntry, SecondLifeProfile, SecondLifeEvent, SecondLifeState } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDream = async (dreamText: string): Promise<DreamAnalysis> => {
  const ai = getAiClient();
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
  const ai = getAiClient();
  
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
    const ai = getAiClient();

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
  const ai = getAiClient();

  // Create a structured prompt that is clear for the model
  const prompt = `Create a high-quality, artistic image based on this dream.
    
    Art Style: ${style} (Masterpiece quality, highly detailed, evocative)
    Dream Subject: ${analysis.title}
    Key Imagery: ${analysis.keywords.join(', ')}
    Emotional Mood: ${analysis.emotionalState}
    
    Context: ${analysis.summary}
    
    Requirements: 
    - No text in image.
    - Deeply atmospheric and dreamlike.
    - Focus on the surreal nature of the dream.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
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
    
    // Check if the model returned text refusal (e.g. safety policy)
    const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
    if (textPart?.text) {
        console.warn("Image generation refusal:", textPart.text);
        throw new Error(`无法生成图片: ${textPart.text.substring(0, 50)}...`);
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

// --- Creative Writing Function ---

export const generateCreativeWriting = async (dream: string, analysis: DreamAnalysis, type: 'story' | 'poem'): Promise<CreativeWriting> => {
    const ai = getAiClient();

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

export const interpretTarotReading = async (question: string, cards: TarotCard[], spread: TarotSpread): Promise<TarotReadingResult> => {
    const ai = getAiClient();

    // Format cards for the prompt with spread position context
    const cardDescriptions = cards.map((card, index) => {
        const position = spread.positions[index];
        const orientation = card.isReversed ? "逆位 (Reversed)" : "正位 (Upright)";
        return `[位置${index + 1}: ${position.name} - ${position.description}] 抽到的牌: ${card.name_cn} (${card.name}) - ${orientation}`;
    }).join('\n');

    const prompt = `
      你是一位精通荣格心理学和神秘学的塔罗牌解读大师。
      用户使用牌阵："${spread.name}"，提出了一个问题（或者在冥想中）："${question || '（用户未明确问题，请针对当下的生命状态进行解读）'}"
      
      抽到的牌阵如下：
      ${cardDescriptions}

      请进行深度解读。
      请以 JSON 格式输出，包含以下字段：
      1. overview: 综合所有牌的能量流动，给出整体基调。
      2. interpretations: 一个数组，针对每个位置进行详细解读。每个元素包含：
         - positionName: 位置名称 (如"${spread.positions[0].name}")
         - cardName: 卡牌名称
         - content: 该位置的深度解读
      3. guidance: 给出富有哲理和启发性的行动建议或心理指引。

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
                        interpretations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    positionName: { type: Type.STRING },
                                    cardName: { type: Type.STRING },
                                    content: { type: Type.STRING }
                                },
                                required: ['positionName', 'cardName', 'content']
                            }
                        },
                        guidance: { type: Type.STRING },
                    },
                    required: ['overview', 'interpretations', 'guidance']
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

// --- Second Life (RPG) Function ---

export const evolveSecondLife = async (
    dream: DreamEntry, 
    currentState: SecondLifeState
): Promise<{ event: SecondLifeEvent, profileUpdates: Partial<SecondLifeProfile> }> => {
    const ai = getAiClient();

    const prompt = `
      你是一款名为“第二人生 (Second Life)”的文字角色扮演游戏的地下城主 (DM)。
      这个游戏的世界是由用户的梦境构建的平行宇宙。
      
      当前角色档案:
      - 称号: ${currentState.profile.title}
      - 原型: ${currentState.profile.archetype}
      - 等级: ${currentState.profile.level}
      - 属性: 清醒度(Lucidity)=${currentState.profile.attributes.lucidity}, 想象力(Imagination)=${currentState.profile.attributes.imagination}, 韧性(Resilience)=${currentState.profile.attributes.resilience}

      最新梦境:
      - 标题: ${dream.analysis?.title}
      - 摘要: ${dream.analysis?.summary}
      - 关键词: ${dream.analysis?.keywords.join(', ')}

      任务：
      1. Narrative (剧情): 基于最新梦境，续写“第二人生”的冒险篇章。将梦境中的元素转化为奇幻/科幻/超现实的冒险经历。
      2. Stats (属性): 根据梦境体现的特质，奖励 1-3 点属性值（如：做了清醒梦增加清醒度，做了噩梦并战胜它增加韧性）。
      3. Quest (现实任务): 发布一个“同步性任务 (Synchronicity Quest)”。这是一个在现实生活中可以执行的小行动，用于连接梦境与现实（例如：“寻找一块蓝色的石头”或“给久未联系的朋友发消息”）。
      4. Totem (图腾): 如果梦境中有显著物品，将其转化为一件“图腾”装备。

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
                        chapterTitle: { type: Type.STRING },
                        narrative: { type: Type.STRING },
                        attributeChanges: {
                            type: Type.OBJECT,
                            properties: {
                                lucidity: { type: Type.INTEGER },
                                imagination: { type: Type.INTEGER },
                                resilience: { type: Type.INTEGER }
                            }
                        },
                        realWorldQuest: { type: Type.STRING },
                        acquiredTotem: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                rarity: { type: Type.STRING, enum: ['common', 'rare', 'epic', 'legendary'] },
                                icon: { type: Type.STRING, description: "Suggest a simple emoji for this item" }
                            }
                        }
                    },
                    required: ['chapterTitle', 'narrative', 'attributeChanges', 'realWorldQuest']
                }
            }
        });

        if (response.text) {
            const result = JSON.parse(response.text);
            
            const event: SecondLifeEvent = {
                id: Date.now().toString(),
                date: new Date().toLocaleDateString(),
                dreamId: dream.id,
                chapterTitle: result.chapterTitle,
                narrative: result.narrative,
                attributeChanges: result.attributeChanges,
                realWorldQuest: result.realWorldQuest,
                acquiredTotem: result.acquiredTotem ? {
                    ...result.acquiredTotem,
                    id: `totem_${Date.now()}`,
                    sourceDreamId: dream.id
                } : undefined
            };

            // Calculate profile updates
            const profileUpdates: Partial<SecondLifeProfile> = {
                attributes: {
                    lucidity: currentState.profile.attributes.lucidity + (result.attributeChanges.lucidity || 0),
                    imagination: currentState.profile.attributes.imagination + (result.attributeChanges.imagination || 0),
                    resilience: currentState.profile.attributes.resilience + (result.attributeChanges.resilience || 0)
                }
                // Experience/Level logic can be handled in the component or here. 
                // For simplicity, we just return attribute deltas and let the UI handler sum them up.
            };

            return { event, profileUpdates };
        }
        throw new Error("No RPG response");
    } catch (error) {
        console.error("Second Life evolution failed:", error);
        throw error;
    }
}
