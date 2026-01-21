// ============================================
// AI TEXT GENERATOR - Brand Voice aware
// ============================================

/**
 * Generiert einen System-Prompt basierend auf der Brand Voice
 */
export function buildBrandPrompt(brand) {
  const toneDescriptions = {
    professional: 'professionell, sachlich und kompetent',
    friendly: 'freundlich, nahbar und warm',
    innovative: 'innovativ, visionär und zukunftsorientiert',
    premium: 'exklusiv, hochwertig und elegant',
    playful: 'spielerisch, locker und humorvoll',
    trustworthy: 'vertrauenswürdig, seriös und zuverlässig'
  };

  const formalityGuide = {
    du: 'Verwende die informelle "Du"-Ansprache.',
    sie: 'Verwende die formelle "Sie"-Ansprache.',
    wir: 'Verwende eine inklusive "Wir"-Perspektive.'
  };

  const dos = brand.voice.dos ? brand.voice.dos.split(',').map(s => s.trim()).filter(Boolean) : [];
  const donts = brand.voice.donts ? brand.voice.donts.split(',').map(s => s.trim()).filter(Boolean) : [];

  return `Du bist ein Marketing-Texter für die Marke "${brand.name}".

TONALITÄT: ${toneDescriptions[brand.voice.tone] || 'professionell'}
ANSPRACHE: ${formalityGuide[brand.voice.formality] || formalityGuide.sie}
${brand.voice.tagline ? `KERNBOTSCHAFT: "${brand.voice.tagline}"` : ''}

${dos.length > 0 ? `BEVORZUGTE WÖRTER/PHRASEN: ${dos.join(', ')}` : ''}
${donts.length > 0 ? `VERMEIDE DIESE WÖRTER: ${donts.join(', ')}` : ''}

Schreibe immer auf Deutsch, sei prägnant und markenkonform.`;
}

/**
 * Text-Generierungs-Typen mit spezifischen Prompts
 */
export const textTypes = {
  headline: {
    name: 'Headlines',
    icon: '📰',
    prompt: 'Generiere 5 verschiedene Headline-Varianten für das Thema. Jede sollte unter 10 Wörtern sein. Nummeriere sie 1-5.',
    placeholder: 'z.B. "Produktlaunch E-Mobility Lösung"'
  },
  subline: {
    name: 'Subline / Teaser',
    icon: '✏️',
    prompt: 'Schreibe eine überzeugende Subline (1-2 Sätze, max. 150 Zeichen) für das Thema.',
    placeholder: 'z.B. "Neue Ladeinfrastruktur für Unternehmen"'
  },
  social: {
    name: 'Social Media Post',
    icon: '📱',
    prompt: 'Schreibe einen Social Media Post (LinkedIn-Stil) mit: Hook, Hauptaussage, Call-to-Action und 3-5 passende Hashtags. Max. 200 Wörter.',
    placeholder: 'z.B. "Ankündigung Partnerschaft mit Stadtwerken"'
  },
  email: {
    name: 'Newsletter-Text',
    icon: '✉️',
    prompt: 'Schreibe einen Newsletter-Abschnitt mit: Begrüßung, Einleitung, Hauptinhalt, Call-to-Action. Ca. 150-200 Wörter.',
    placeholder: 'z.B. "Einladung zum Webinar Energiewende"'
  },
  flyer: {
    name: 'Flyer-Texte',
    icon: '📄',
    prompt: 'Generiere Texte für einen Flyer: 1x Headline (max. 6 Wörter), 1x Kurzbeschreibung (2 Sätze), 1x Call-to-Action (3 Wörter).',
    placeholder: 'z.B. "Rabattaktion Frühjahr 2025"'
  },
  bullets: {
    name: 'Aufzählungspunkte',
    icon: '📋',
    prompt: 'Generiere 4-6 prägnante Aufzählungspunkte (je max. 8 Wörter) für eine Präsentation zum Thema.',
    placeholder: 'z.B. "Vorteile unserer Cloud-Lösung"'
  },
  cta: {
    name: 'Call-to-Actions',
    icon: '🎯',
    prompt: 'Generiere 5 verschiedene Call-to-Action Button-Texte (je 2-4 Wörter) für das Thema. Nummeriere sie 1-5.',
    placeholder: 'z.B. "Newsletter-Anmeldung"'
  },
  alttext: {
    name: 'Bild-Alternativtext',
    icon: '🖼️',
    prompt: 'Schreibe einen barrierefreien Alternativtext (BITV 2.0 konform) für ein Bild. Beschreibe sachlich und präzise in 1-2 Sätzen, max. 125 Zeichen.',
    placeholder: 'Beschreibe das Bild kurz, z.B. "Foto einer Ladestation"'
  }
};

/**
 * Simulierte AI-Generierung (für Demo ohne API)
 * In Produktion: Ersetzen durch echten API-Call
 */
export async function generateText(brand, textType, topic, apiKey = null) {
  const brandPrompt = buildBrandPrompt(brand);
  const typeConfig = textTypes[textType];
  
  // Wenn API-Key vorhanden, echten Call machen
  if (apiKey) {
    return await callAI(brandPrompt, typeConfig.prompt, topic, apiKey);
  }
  
  // Sonst Demo-Texte generieren
  return generateDemoText(brand, textType, topic);
}

/**
 * Echter API-Call (OpenAI-kompatibel)
 */
async function callAI(systemPrompt, typePrompt, topic, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${typePrompt}\n\nThema: ${topic}` }
      ],
      temperature: 0.8,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error('AI-Anfrage fehlgeschlagen');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Demo-Texte für Vorschau ohne API
 */
function generateDemoText(brand, textType, topic) {
  const tagline = brand.voice.tagline || 'Ihre Lösung für morgen';
  const formal = brand.voice.formality === 'sie';
  const anrede = formal ? 'Sie' : 'du';
  const ihr = formal ? 'Ihr' : 'dein';
  
  const demos = {
    headline: `1. ${topic} – ${tagline}
2. Die Zukunft von ${topic} beginnt jetzt
3. ${topic}: Einfach. Effizient. ${brand.name}.
4. Entdecken ${formal ? 'Sie' : ''} ${topic} neu
5. ${brand.name} präsentiert: ${topic}`,

    subline: `Entdecken ${anrede} die Möglichkeiten von ${topic}. ${brand.name} macht ${formal ? 'Ihren' : 'deinen'} Weg in die Zukunft einfacher.`,

    social: `🚀 ${topic} – das bewegt uns bei ${brand.name}!

${tagline}

Wir arbeiten jeden Tag daran, ${topic} für ${formal ? 'Sie' : 'dich'} noch besser zu machen. Denn wir glauben: Die Zukunft gehört denen, die heute handeln.

Was bedeutet ${topic} für ${formal ? 'Sie' : 'dich'}? 👇

#${brand.name.replace(/\s/g, '')} #${topic.replace(/\s/g, '')} #Innovation #Zukunft`,

    email: `${formal ? 'Sehr geehrte Damen und Herren' : 'Hallo'},

${topic} ist mehr als nur ein Schlagwort – es ist ${formal ? 'Ihre' : 'deine'} Chance.

Bei ${brand.name} haben wir es uns zur Aufgabe gemacht, ${topic} greifbar zu machen. ${tagline}

${formal ? 'Erfahren Sie' : 'Erfahre'} mehr darüber, wie wir ${formal ? 'Ihnen' : 'dir'} helfen können.

Mit besten Grüßen
${formal ? 'Ihr' : 'Dein'} ${brand.name} Team`,

    flyer: `HEADLINE: ${topic} erleben

BESCHREIBUNG: ${brand.name} bringt ${topic} auf den Punkt. ${tagline}

CALL-TO-ACTION: Jetzt entdecken`,

    bullets: `• ${topic} verstehen und anwenden
• Effizienz steigern durch Innovation
• Nachhaltige Lösungen für morgen
• Individuelle Beratung von Experten
• Schnelle Implementierung garantiert`,

    cta: `1. Jetzt entdecken
2. Mehr erfahren
3. ${formal ? 'Kontaktieren Sie uns' : 'Kontaktiere uns'}
4. Kostenlos testen
5. Termin vereinbaren`,

    alttext: `Symbolbild für ${topic}: Darstellung eines modernen Konzepts im Bereich ${topic.split(' ')[0]}.`
  };

  return demos[textType] || `Demo-Text für ${topic}`;
}

/**
 * Batch-Generierung für Kampagnen
 */
export async function generateCampaignTexts(brand, campaignTopic, apiKey = null) {
  const results = {};
  
  for (const [type, config] of Object.entries(textTypes)) {
    if (['headline', 'subline', 'social', 'email', 'cta'].includes(type)) {
      results[type] = await generateText(brand, type, campaignTopic, apiKey);
      // Kleine Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export default { generateText, generateCampaignTexts, textTypes, buildBrandPrompt };
