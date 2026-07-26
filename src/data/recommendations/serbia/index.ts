/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Recommendation } from '../../../types';
import { natureRecommendations } from './nature';
import { historyRecommendations } from './history';
import { gastronomyRecommendations } from './gastronomy';
import { travelRecommendations } from './travel';
import { wellbeingRecommendations } from './wellbeing';
import { medicalRecommendations } from './medical';
import { clubbingRecommendations } from './clubbing';

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  ...natureRecommendations,
  ...historyRecommendations,
  ...gastronomyRecommendations,
  ...travelRecommendations,
  ...wellbeingRecommendations,
  ...medicalRecommendations,
  ...clubbingRecommendations
];
