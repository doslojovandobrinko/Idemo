import { Recommendation, Category } from '../types';
import { getLocalPreferenceBoost, LocalPreferenceProfile } from './preferenceEngine';

export interface UserPreferences {
  budget: number;
  time: number;
  days: string;
  timeOfDay: string;
  selectedCategories: string[];
  ratings?: Record<string, { vibe: 'like' | 'intrigue' | 'dislike'; tags?: string[] }>;
  implicitTastes?: Record<string, number>;
  lpeProfile?: LocalPreferenceProfile;
  
  // Contextual Intelligence Fields
  currentWeather?: 'Sunny' | 'Rainy' | 'Snowy' | 'Cloudy';
  currentDayOfWeek?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  currentTimeMinutes?: number;
  proximityReference?: 'expo' | 'hotel' | 'zemun' | 'none';
  maxWalkingDistanceKm?: number;
  orbitX?: number;
  orbitY?: number;
}

// Self-contained Haversine formula for distance calculation in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Quiet, context-aware helper to analyze if a recommendation represents an outdoor item
const isOutdoorRecommendation = (rec: Recommendation): boolean => {
  const category = (rec.category || '').toLowerCase();
  const locationText = (rec.location || '').toLowerCase();
  const titleText = (rec.title || '').toLowerCase();
  
  if (category.includes('nature') || (category.includes('clubbing') && locationText.includes('riverfront'))) {
    return true;
  }
  
  const outdoorKeywords = [
    'fortress', 'park', 'canyon', 'mountain', 'lake', 'river', 'gorge', 'wilderness', 
    'confluence', 'silosi', 'belgrade fortress', 'tara', 'uvac', 'tvrđava', 'dunav', 
    'danube', 'sava riverfront', 'savamala', 'gold gondola', 'kopaonik', 'waterfront',
    'viewpoint', 'hike'
  ];
  
  return outdoorKeywords.some(kw => titleText.includes(kw) || locationText.includes(kw));
};

export function scoreRecommendation(rec: Recommendation, prefs: UserPreferences): number {
  let score = 0;

  // 0. Sentiment Feedback Adjustments (Super high priority, direct user signal)
  if (prefs.ratings && prefs.ratings[rec.id]) {
    const feedback = prefs.ratings[rec.id];
    if (feedback.vibe === 'like') {
      score += 150;
    } else if (feedback.vibe === 'intrigue') {
      score += 50;
    } else if (feedback.vibe === 'dislike') {
      score -= 200; // Penalize so it drops to bottom
    }
  }

  // 0.1 On-Device Preference Learning (Implicit Taste Profile)
  if (prefs.implicitTastes) {
    const recInterest = prefs.implicitTastes[`rec_${rec.id}`] || 0;
    score += Math.min(60, recInterest * 15); // cap at +60

    const recCats = typeof rec.category === 'string'
      ? rec.category.split(',').map(s => s.trim())
      : [rec.category];
    
    let maxCatInterest = 0;
    for (const cat of recCats) {
      const catInterest = prefs.implicitTastes[`cat_${cat}`] || 0;
      if (catInterest > maxCatInterest) {
        maxCatInterest = catInterest;
      }
    }
    score += Math.min(45, maxCatInterest * 10); // cap at +45
  }

  // 0.2 Invisible Local Preference Engine (LPE) Boost
  const lpeBoost = getLocalPreferenceBoost(rec, prefs.lpeProfile);
  score += lpeBoost;

  // 0.3 Multi-dimensional Mood Orbit Proximity and Attribute Similarity
  if (prefs.orbitX !== undefined && prefs.orbitY !== undefined) {
    // Map orbit [0, 1] to [-5, +5] space
    const targetX = (prefs.orbitX - 0.5) * 10;
    const targetY = (0.5 - prefs.orbitY) * 10;

    const recX = rec.coordinateX ?? 0;
    const recY = rec.coordinateY ?? 0;

    // A. Spatial Proximity (Euclidean distance)
    const euclideanDistance = Math.hypot(targetX - recX, targetY - recY);
    const maxPossibleDist = 14.142; // Math.hypot(10, 10)
    const spatialProximity = Math.max(0, 100 - (euclideanDistance / maxPossibleDist) * 100);

    // B. Semantic Attribute Similarity (matching multi-dimensional features)
    const targetEnergy = Math.round((targetX + 5) * 10) / 10; // emotional/energy
    const targetUrbanity = Math.round((targetY + 5) * 10) / 10; // environment/urbanity
    const targetLuxury = Math.min(10, Math.max(1, (prefs.budget / 500) * 10)); // budget-based luxury

    const energyDiff = Math.abs((rec.energy ?? 5) - targetEnergy);
    const urbanityDiff = Math.abs((rec.urbanity ?? 5) - targetUrbanity);
    const luxuryDiff = Math.abs((rec.luxury ?? 5) - targetLuxury);
    const semanticDiff = (energyDiff + urbanityDiff + luxuryDiff) / 3;
    const semanticSimilarity = Math.max(0, 100 - (semanticDiff / 9) * 100);

    // Combined Spatial-Semantic matching score (60% spatial weight, 40% semantic attribute similarity weight)
    const combinedSpaceSemantic = (spatialProximity * 0.60) + (semanticSimilarity * 0.40);
    
    // Add up to 120 points boost based on high-quality matching
    score += (combinedSpaceSemantic / 100) * 120;
  }

  // 1. Category/Vibe Match (High Priority)
  const recCats = typeof rec.category === 'string'
    ? rec.category.split(',').map(s => s.trim())
    : [rec.category];
  const matchingCatsCount = recCats.filter(cat => prefs.selectedCategories.includes(cat)).length;
  
  // Normalized Vibe score: 1.0 if any category matches, plus extra weight for additional category matches
  const vibeScore = matchingCatsCount > 0 
    ? Math.min(1.0, 0.7 + 0.3 * (matchingCatsCount / Math.max(1, prefs.selectedCategories.length))) 
    : 0.0;

  // 2. Budget Match (Strong matching with Mood Orb)
  let minCost = 0;
  const costMatch = rec.estimatedCost.match(/\d+/);
  if (costMatch) {
    minCost = parseInt(costMatch[0]);
  }
  
  // Normalized Budget score
  let budgetScore = 0;
  if (minCost <= prefs.budget) {
    // High score for being within budget; higher for being closer to the target budget (optimal luxury utilization)
    budgetScore = 0.8 + 0.2 * (minCost / Math.max(1, prefs.budget));
  } else {
    // Over budget: score decays rapidly down to 0
    const excess = minCost - prefs.budget;
    budgetScore = Math.max(0, 1.0 - (excess / Math.max(50, prefs.budget)));
  }

  // 3. Time Available Match (Free Time)
  let durationInHours = 0;
  if (rec.duration.includes('day')) {
    const dayMatch = rec.duration.match(/\d+/);
    durationInHours = dayMatch ? parseInt(dayMatch[0]) * 24 : 24;
  } else {
    const hourMatch = rec.duration.match(/\d+/);
    durationInHours = hourMatch ? parseInt(hourMatch[0]) : 4;
  }

  const totalDurationMinutes = (durationInHours * 60) + rec.travelTimeMinutes;
  const totalDurationHours = totalDurationMinutes / 60;

  // Normalized Time score
  let timeScore = 0;
  if (totalDurationHours <= prefs.time) {
    // High score for fitting in available time; higher for utilizing the time well (perfect fit)
    timeScore = 0.8 + 0.2 * (totalDurationHours / Math.max(1, prefs.time));
  } else {
    // Over time: score decays rapidly down to 0
    const excessHours = totalDurationHours - prefs.time;
    timeScore = Math.max(0, 1.0 - (excessHours / Math.max(4, prefs.time)));
  }

  // Intelligent Multi-Factor Combination Score (Weighted Sum)
  // This ensures changing budget or time instantly and dynamically realigns recommendations!
  const combinedScore = (vibeScore * 0.4) + (budgetScore * 0.3) + (timeScore * 0.3);
  score += combinedScore * 200; // Base contribution up to 200 points


  // 4. Heuristic for User-Selected Preference (Time of Day)
  const hasEveningCat = recCats.includes(Category.CLUBBING) || recCats.includes(Category.GASTRONOMY);
  if (prefs.timeOfDay === 'Evening' && hasEveningCat) {
    score += 40;
  }
  const hasWorkingHourMatch = !recCats.includes(Category.CLUBBING);
  if (prefs.timeOfDay === 'Working hours' && hasWorkingHourMatch) {
    score += 20;
  }

  // 5. Ambient Smart Defaults & Contextual Intelligence
  const isOutdoor = isOutdoorRecommendation(rec);
  
  // A. Weather-Driven Suitability
  const weather = prefs.currentWeather || 'Sunny';
  if (weather === 'Sunny') {
    if (isOutdoor) {
      score += 35; // Sun-drenched open air boost
    } else {
      score -= 5;
    }
  } else if (weather === 'Rainy') {
    if (isOutdoor) {
      score -= 50; // Severe rain outdoor penalty
    } else {
      score += 45; // Cozy indoor refuge boost
    }
  } else if (weather === 'Snowy') {
    // Boost winter attractions (e.g. Kopaonik mountain resort)
    const isWinterResort = rec.title.toLowerCase().includes('kopaonik') || rec.location.toLowerCase().includes('kopaonik');
    if (isWinterResort) {
      score += 65;
    } else if (isOutdoor) {
      score -= 35; // Standard cold outdoor penalty
    } else {
      score += 30; // Warm cozy indoor spa/food boost
    }
  } else if (weather === 'Cloudy') {
    score += 15; // Balanced general boost
  }

  // B. Day of the Week Context
  const day = prefs.currentDayOfWeek || 'Tuesday';
  const isWeekend = ['Friday', 'Saturday', 'Sunday'].includes(day);
  if (isWeekend) {
    // Weekend matches high-investment, nightlife, adventure or nature excursions
    if (recCats.includes(Category.CLUBBING) || recCats.includes(Category.TRAVEL) || recCats.includes(Category.NATURE) || totalDurationHours > 4) {
      score += 30;
    }
  } else {
    // Weekdays match historic center exploration, culinary evenings, or quick wellbeing rituals
    if (recCats.includes(Category.HISTORY) || recCats.includes(Category.WELLBEING) || (recCats.includes(Category.GASTRONOMY) && totalDurationHours <= 3)) {
      score += 25;
    }
  }

  // C. Current Hour of Day Context
  // Get active hour from user pref if provided, otherwise fallback to system hours
  let activeHour = new Date().getHours();
  if (prefs.currentTimeMinutes !== undefined) {
    activeHour = Math.floor(prefs.currentTimeMinutes / 60);
  } else if (prefs.timeOfDay === 'Evening') {
    activeHour = 20;
  } else if (prefs.timeOfDay === 'Working hours') {
    activeHour = 14;
  }

  // Sunrise/Morning Weighting (5:00 - 10:00)
  if (activeHour >= 5 && activeHour < 11) {
    if (isOutdoor && (rec.title.toLowerCase().includes('viewpoint') || rec.location.toLowerCase().includes('tara') || rec.title.toLowerCase().includes('fortress'))) {
      score += 25;
    }
    if (recCats.includes(Category.WELLBEING)) {
      score += 15;
    }
  }

  // Midday Heat Weighting (11:00 - 16:00)
  if (activeHour >= 11 && activeHour < 16) {
    if (!isOutdoor && (recCats.includes(Category.HISTORY) || recCats.includes(Category.WELLBEING) || recCats.includes(Category.MEDICAL))) {
      score += 20;
    } else if (isOutdoor) {
      score -= 15;
    }
  }

  // Sunset/Twilight Weighting (17:00 - 20:30)
  if (activeHour >= 17 && activeHour <= 20) {
    if (isOutdoor && (rec.title.toLowerCase().includes('sunset') || rec.title.toLowerCase().includes('kayak') || rec.location.toLowerCase().includes('riverfront') || rec.title.toLowerCase().includes('fortress'))) {
      score += 35;
    }
  }

  // Late-Night Priority (21:00 - 4:00)
  if (activeHour >= 21 || activeHour <= 4) {
    if (recCats.includes(Category.CLUBBING) || recCats.includes(Category.GASTRONOMY)) {
      score += 40;
    } else if (isOutdoor && !recCats.includes(Category.CLUBBING)) {
      score -= 30; // Day-centric outdoor spots penalized
    }
  }

  // D. Proximity & Geolocation Coords Context (Inversely proportional score)
  const refCoords = {
    expo: { lat: 44.7176, lng: 20.2794 },
    hotel: { lat: 44.8154, lng: 20.4607 }, // Republic Square center
    zemun: { lat: 44.8415, lng: 20.4136 },
    none: null
  };

  const refKey = prefs.proximityReference || 'none';
  const selectedRef = refCoords[refKey];
  const recCoords = rec.coordinates || { lat: 44.8154, lng: 20.4607 }; // fallback

  if (selectedRef) {
    const distanceKm = calculateDistance(selectedRef.lat, selectedRef.lng, recCoords.lat, recCoords.lng);
    
    // Proximity boost (closer gets more score, up to +50 points)
    const proximityBoost = Math.max(0, 50 - distanceKm * 2);
    score += proximityBoost;

    // E. Walking Distance Heuristic
    if (prefs.maxWalkingDistanceKm !== undefined && prefs.maxWalkingDistanceKm > 0) {
      if (distanceKm <= prefs.maxWalkingDistanceKm) {
        score += 30; // Within walking preference boundary boost
      } else {
        // Exceeds walking preference: we don't filter out (Never remove), instead we heavily penalize
        // to push it to the bottom
        score -= 150;
      }
    }
  }

  // 6. Editorial priority / featured boost (Small support)
  const priorityIds = ['1', '9', '12', '81'];
  if (priorityIds.includes(rec.id)) {
    score += 5; // small editorial boost
  }

  return score;
}

export function getRankedRecommendations(recs: Recommendation[], prefs: UserPreferences): Recommendation[] {
  const priorityIds = ['1', '9', '12', '81'];

  // Check if profile is completely default (before user starts defining his/her profile)
  const hasNoRatings = !prefs.ratings || Object.keys(prefs.ratings).length === 0;
  const hasNoImplicitTastes = !prefs.implicitTastes || Object.keys(prefs.implicitTastes).length === 0;
  const isDefaultBudgetAndTime = prefs.budget === 100 && prefs.time === 24;
  
  const isDefault = hasNoRatings && hasNoImplicitTastes && isDefaultBudgetAndTime;

  if (isDefault) {
    const targetIds = ['1', '9', '12'];
    const targetRecs: Recommendation[] = [];
    const otherRecs: Recommendation[] = [];
    
    // Maintain the specific default order: Uvac, Sands, Banjska Stena
    for (const id of targetIds) {
      const found = recs.find(r => r.id === id);
      if (found) {
        targetRecs.push(found);
      }
    }
    
    for (const r of recs) {
      if (!targetIds.includes(r.id)) {
        otherRecs.push(r);
      }
    }
    
    // Sort other recommendations using standard rules
    const sortedOthers = [...otherRecs].sort((a, b) => {
      const scoreA = scoreRecommendation(a, prefs);
      const scoreB = scoreRecommendation(b, prefs);
      if (Math.abs(scoreB - scoreA) > 0.001) {
        return scoreB - scoreA;
      }
      const getBadgeWeight = (rec: Recommendation): number => {
        const bType = (rec.badge || '').toLowerCase();
        if (bType === 'platinum') return 3;
        if (bType === 'gold') return 2;
        if (bType === 'silver') return 1;
        return 0;
      };
      const badgeDiff = getBadgeWeight(b) - getBadgeWeight(a);
      if (badgeDiff !== 0) return badgeDiff;
      const isAFeatured = priorityIds.includes(a.id) ? 1 : 0;
      const isBFeatured = priorityIds.includes(b.id) ? 1 : 0;
      return isBFeatured - isAFeatured;
    });
    
    return [...targetRecs, ...sortedOthers];
  }

  return [...recs].sort((a, b) => {
    // 1. Primary: Profile and Preference Scoring (determined by the user's Mood Orb settings)
    const scoreA = scoreRecommendation(a, prefs);
    const scoreB = scoreRecommendation(b, prefs);

    if (Math.abs(scoreB - scoreA) > 0.001) {
      return scoreB - scoreA; // Best daily concierge profile match first
    }

    // 2. Secondary: Badge Tier Sorting (Platinum -> Gold -> Silver -> None as a quality tie-breaker)
    const getBadgeWeight = (rec: Recommendation): number => {
      const bType = (rec.badge || '').toLowerCase();
      if (bType === 'platinum') return 3;
      if (bType === 'gold') return 2;
      if (bType === 'silver') return 1;
      return 0;
    };

    const badgeDiff = getBadgeWeight(b) - getBadgeWeight(a);
    if (badgeDiff !== 0) {
      return badgeDiff;
    }

    // 3. Tertiary: Editorial Priority Tie-Breaker
    const isAFeatured = priorityIds.includes(a.id) ? 1 : 0;
    const isBFeatured = priorityIds.includes(b.id) ? 1 : 0;
    return isBFeatured - isAFeatured;
  });
}
