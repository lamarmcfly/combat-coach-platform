'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface WeightCutCalculatorProps {
  currentWeight: number | null;
  targetWeight: number | null;
  targetDate: string | null;
}

export function WeightCutCalculator({
  currentWeight,
  targetWeight,
  targetDate,
}: WeightCutCalculatorProps) {
  const [safetyInfo, setSafetyInfo] = useState<{
    daysRemaining: number;
    totalToCut: number;
    weeklyRate: number;
    percentBodyWeight: number;
    safetyLevel: 'safe' | 'moderate' | 'aggressive' | 'dangerous';
    recommendation: string;
    waterCutPortion: number;
    dietCutPortion: number;
  } | null>(null);

  useEffect(() => {
    if (!currentWeight || !targetWeight) return;

    const totalToCut = currentWeight - targetWeight;

    let daysRemaining = 30; // Default
    if (targetDate) {
      const target = new Date(targetDate);
      const now = new Date();
      daysRemaining = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const weeksRemaining = Math.max(1, daysRemaining / 7);
    const weeklyRate = totalToCut / weeksRemaining;
    const percentBodyWeight = (totalToCut / currentWeight) * 100;

    // Calculate water vs diet portions
    // Generally, up to 3-5% can be water cut in final days
    const maxWaterCut = currentWeight * 0.05; // 5% max water cut
    const waterCutPortion = Math.min(maxWaterCut, totalToCut * 0.3); // 30% or max safe
    const dietCutPortion = totalToCut - waterCutPortion;

    // Determine safety level
    let safetyLevel: 'safe' | 'moderate' | 'aggressive' | 'dangerous';
    let recommendation: string;

    if (weeklyRate <= 1) {
      safetyLevel = 'safe';
      recommendation = 'This is a healthy, sustainable rate of weight loss. Focus on clean eating and consistent training.';
    } else if (weeklyRate <= 2) {
      safetyLevel = 'moderate';
      recommendation = 'This rate requires dedication. Reduce carbs gradually and increase cardio. Monitor energy levels.';
    } else if (weeklyRate <= 3) {
      safetyLevel = 'aggressive';
      recommendation = 'This is an aggressive cut. Consider consulting a nutritionist. Plan water cut carefully for final 24-48 hours.';
    } else {
      safetyLevel = 'dangerous';
      recommendation = 'This cut rate is potentially dangerous. Consider moving up a weight class or extending your timeline.';
    }

    setSafetyInfo({
      daysRemaining,
      totalToCut,
      weeklyRate,
      percentBodyWeight,
      safetyLevel,
      recommendation,
      waterCutPortion,
      dietCutPortion,
    });
  }, [currentWeight, targetWeight, targetDate]);

  if (!currentWeight || !targetWeight) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-gray-400">
            Set a weight goal to see your cut planning calculator.
          </p>
        </div>
      </Card>
    );
  }

  if (!safetyInfo) return null;

  const safetyColors = {
    safe: 'bg-green-500/10 border-green-500/30 text-green-400',
    moderate: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    aggressive: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    dangerous: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const safetyBadges = {
    safe: 'success' as const,
    moderate: 'warning' as const,
    aggressive: 'warning' as const,
    dangerous: 'error' as const,
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Weight Cut Plan</h3>
          <Badge variant={safetyBadges[safetyInfo.safetyLevel]}>
            {safetyInfo.safetyLevel.charAt(0).toUpperCase() + safetyInfo.safetyLevel.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Total to Cut</p>
            <p className="text-xl font-bold text-white">{safetyInfo.totalToCut.toFixed(1)} lbs</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Days Left</p>
            <p className="text-xl font-bold text-white">{safetyInfo.daysRemaining}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Weekly Rate</p>
            <p className="text-xl font-bold text-white">{safetyInfo.weeklyRate.toFixed(1)} lbs</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">% Body Weight</p>
            <p className="text-xl font-bold text-white">{safetyInfo.percentBodyWeight.toFixed(1)}%</p>
          </div>
        </div>

        {/* Strategy breakdown */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Suggested Breakdown</h4>
          <div className="flex gap-2">
            <div className="flex-1 bg-blue-900/30 border border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-400 uppercase">Diet Phase</p>
              <p className="text-lg font-bold text-white">{safetyInfo.dietCutPortion.toFixed(1)} lbs</p>
              <p className="text-xs text-gray-500">Gradual calorie deficit</p>
            </div>
            <div className="flex-1 bg-cyan-900/30 border border-cyan-800 rounded-lg p-3">
              <p className="text-xs text-cyan-400 uppercase">Water Cut</p>
              <p className="text-lg font-bold text-white">{safetyInfo.waterCutPortion.toFixed(1)} lbs</p>
              <p className="text-xs text-gray-500">Final 24-48 hours</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className={`rounded-lg border p-4 ${safetyColors[safetyInfo.safetyLevel]}`}>
          <div className="flex gap-3">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium">Recommendation</h4>
              <p className="mt-1 text-sm opacity-90">{safetyInfo.recommendation}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips */}
      <Card>
        <h4 className="font-medium text-white mb-3">Safe Weight Cut Tips</h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Start your cut 4-6 weeks out for best results</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Aim to lose no more than 1-2 lbs per week through diet</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Water loading (increasing water intake before cutting) can help</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Never cut more than 8% body weight through water</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent">•</span>
            <span>Have a proper rehydration plan after weigh-ins</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
