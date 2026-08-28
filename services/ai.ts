import { AIAnalysisResult, UrgencyLevel } from '../types';

interface ServiceKeywordMatch {
  serviceId: string;
  serviceName: string;
  keywords: string[];
  emergencyKeywords: string[];
}

const SERVICE_RULES: ServiceKeywordMatch[] = [
  {
    serviceId: 'electrician',
    serviceName: 'Electrician',
    keywords: [
      'fan', 'light', 'spark', 'fuse', 'switch', 'wiring', 'geyser', 'mcb',
      'power', 'current', 'shock', 'short circuit', 'bulb', 'plug', 'inverter'
    ],
    emergencyKeywords: ['spark', 'shock', 'short circuit', 'smoke', 'fire', 'burning smell', 'power out']
  },
  {
    serviceId: 'plumber',
    serviceName: 'Plumber',
    keywords: [
      'water', 'tap', 'leak', 'pipe', 'drain', 'flush', 'sink', 'toilet',
      'shower', 'tank', 'overflow', 'blockage', 'sewage', 'clog'
    ],
    emergencyKeywords: ['flood', 'major leak', 'pipe burst', 'overflow', 'sewage backup', 'no water']
  },
  {
    serviceId: 'tailor',
    serviceName: 'Tailor',
    keywords: [
      'shirt', 'pant', 'stitching', 'alteration', 'zip', 'dress', 'cloth',
      'fitting', 'suit', 'uniform', 'hem', 'saree', 'blouse'
    ],
    emergencyKeywords: ['wedding tomorrow', 'urgent alteration']
  },
  {
    serviceId: 'carpenter',
    serviceName: 'Carpenter',
    keywords: [
      'door', 'lock', 'wood', 'table', 'chair', 'cupboard', 'cabinet',
      'latch', 'window', 'hinge', 'bed', 'drawer', 'furniture'
    ],
    emergencyKeywords: ['locked out', 'door jammed', 'broken lock', 'security breach']
  },
  {
    serviceId: 'cleaner',
    serviceName: 'Cleaner',
    keywords: [
      'clean', 'dust', 'wash', 'sofa', 'bathroom', 'kitchen', 'carpet',
      'deep clean', 'sweeping', 'mopping', 'sanitize', 'pest'
    ],
    emergencyKeywords: ['spill', 'mold emergency']
  },
  {
    serviceId: 'mechanic',
    serviceName: 'Mechanic',
    keywords: [
      'bike', 'car', 'puncture', 'battery', 'engine', 'tyre', 'breakdown',
      'oil', 'starting problem', 'brake', 'chain', 'scooter'
    ],
    emergencyKeywords: ['stuck on road', 'flat tyre', 'battery dead', 'engine smoke', 'brake fail']
  },
  {
    serviceId: 'ac_repair',
    serviceName: 'AC Repair',
    keywords: [
      'ac', 'air conditioner', 'cooling', 'gas', 'compressor', 'split ac',
      'filter', 'water dripping from ac', 'cool'
    ],
    emergencyKeywords: ['ac fire', 'gas leak', 'severe heatwave']
  },
  {
    serviceId: 'computer_repair',
    serviceName: 'Computer Repair',
    keywords: [
      'laptop', 'computer', 'screen', 'wifi', 'os', 'windows', 'mac',
      'keyboard', 'virus', 'hard disk', 'ram', 'pc', 'boot'
    ],
    emergencyKeywords: ['data loss', 'system crash', 'blue screen']
  }
];

export async function analyzeProblemText(userPrompt: string): Promise<AIAnalysisResult> {
  const text = userPrompt.toLowerCase();
  
  let bestMatch: ServiceKeywordMatch | null = null;
  let highestScore = 0;
  let isEmergency: UrgencyLevel = 'normal';
  const matchedTags: string[] = [];

  for (const rule of SERVICE_RULES) {
    let score = 0;
    
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        score += 2;
        matchedTags.push(kw);
      }
    }

    for (const ekw of rule.emergencyKeywords) {
      if (text.includes(ekw)) {
        score += 5;
        isEmergency = 'emergency';
        matchedTags.push(`⚠️ ${ekw}`);
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  if (!bestMatch || highestScore === 0) {
    // Default fallback if unclassified
    return {
      recommended_service_id: 'electrician',
      service_name: 'Electrician',
      problem_summary: userPrompt || 'General service inquiry',
      urgency: 'normal',
      confidence: 0.6,
      suggested_tags: ['General Repair']
    };
  }

  const confidence = Math.min(0.98, 0.70 + (highestScore * 0.05));
  
  // Format clean problem summary
  const formattedSummary = userPrompt.trim().charAt(0).toUpperCase() + userPrompt.trim().slice(1);

  return {
    recommended_service_id: bestMatch.serviceId,
    service_name: bestMatch.serviceName,
    problem_summary: formattedSummary,
    urgency: isEmergency,
    confidence,
    suggested_tags: Array.from(new Set(matchedTags)).slice(0, 4)
  };
}

export async function analyzeProblemPhoto(imageUri: string): Promise<AIAnalysisResult> {
  // Simulates vision model inference on photo
  // e.g. detecting fan, pipe leak, wire spark
  return {
    recommended_service_id: 'plumber',
    service_name: 'Plumber',
    problem_summary: 'Detected pipe leakage & tap water damage',
    urgency: 'normal',
    confidence: 0.92,
    suggested_tags: ['Pipe Leak', 'Water Pressure', 'Tap Replacement']
  };
}
