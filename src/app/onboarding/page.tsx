'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DisciplineSelector } from '@/components/onboarding/DisciplineSelector';
import { GoalWizard } from '@/components/onboarding/GoalWizard';
import { ProfileSetup } from '@/components/onboarding/ProfileSetup';
import { useToast } from '@/contexts/ToastContext';

type Step = 'welcome' | 'profile' | 'disciplines' | 'goal' | 'complete';

interface OnboardingData {
  firstName: string;
  lastName: string;
  experienceLevel: string;
  selectedDisciplines: string[];
  goal: {
    title: string;
    type: string;
    targetValue?: number;
    unit?: string;
    targetDate?: string;
  } | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    experienceLevel: '',
    selectedDisciplines: [],
    goal: null,
  });

  const steps: Step[] = ['welcome', 'profile', 'disciplines', 'goal', 'complete'];
  const currentIndex = steps.indexOf(currentStep);

  const goNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleProfileComplete = (profile: { firstName: string; lastName: string; experienceLevel: string }) => {
    setData((prev) => ({ ...prev, ...profile }));
    goNext();
  };

  const handleDisciplinesSelected = (disciplines: string[]) => {
    setData((prev) => ({ ...prev, selectedDisciplines: disciplines }));
    goNext();
  };

  const handleGoalCreated = (goal: OnboardingData['goal']) => {
    setData((prev) => ({ ...prev, goal }));
    goNext();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Save profile
      const profileRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          experienceLevel: data.experienceLevel,
          disciplines: data.selectedDisciplines,
          onboardingComplete: true,
        }),
      });

      if (!profileRes.ok) {
        throw new Error('Failed to save profile');
      }

      // Create goal if provided
      if (data.goal) {
        const goalRes = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.goal.title,
            type: data.goal.type,
            targetValue: data.goal.targetValue,
            unit: data.goal.unit,
            targetDate: data.goal.targetDate,
            status: 'IN_PROGRESS',
          }),
        });

        if (!goalRes.ok) {
          console.error('Failed to create goal, but continuing...');
        }
      }

      success('Welcome to Corner!', 'Your profile has been set up successfully.');
      router.push('/my/training');
    } catch (err) {
      error('Error', 'Failed to complete setup. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🥊</div>
            <h1 className="text-4xl font-bold text-white">Welcome to Corner</h1>
            <p className="text-xl text-gray-400 max-w-md mx-auto">
              Your journey to becoming a better fighter starts here. Let's set up your training profile.
            </p>
            <div className="pt-8">
              <Button size="lg" onClick={goNext}>
                Get Started
              </Button>
            </div>
          </div>
        );

      case 'profile':
        return (
          <ProfileSetup
            initialData={{
              firstName: data.firstName,
              lastName: data.lastName,
              experienceLevel: data.experienceLevel,
            }}
            onComplete={handleProfileComplete}
            onBack={goBack}
          />
        );

      case 'disciplines':
        return (
          <DisciplineSelector
            selectedDisciplines={data.selectedDisciplines}
            onComplete={handleDisciplinesSelected}
            onBack={goBack}
          />
        );

      case 'goal':
        return (
          <GoalWizard
            disciplines={data.selectedDisciplines}
            onComplete={handleGoalCreated}
            onSkip={goNext}
            onBack={goBack}
          />
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">✨</div>
            <h1 className="text-4xl font-bold text-white">You're All Set!</h1>
            <p className="text-xl text-gray-400 max-w-md mx-auto">
              Your training profile is ready. Time to start your journey.
            </p>
            <div className="bg-gray-800 rounded-lg p-6 text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Name</span>
                <span className="text-white font-medium">
                  {data.firstName} {data.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Experience</span>
                <span className="text-white font-medium">{data.experienceLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Disciplines</span>
                <span className="text-white font-medium">{data.selectedDisciplines.length} selected</span>
              </div>
              {data.goal && (
                <div className="flex justify-between">
                  <span className="text-gray-400">First Goal</span>
                  <span className="text-accent font-medium">{data.goal.title}</span>
                </div>
              )}
            </div>
            <div className="pt-8">
              <Button size="lg" onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? 'Setting up...' : 'Start Training'}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex justify-center gap-2">
              {['profile', 'disciplines', 'goal'].map((step, index) => (
                <div
                  key={step}
                  className={`h-2 w-16 rounded-full transition-colors ${
                    steps.indexOf(currentStep) > steps.indexOf(step as Step)
                      ? 'bg-accent'
                      : step === currentStep
                      ? 'bg-accent/50'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-500">
              Step {currentIndex} of 4
            </div>
          </div>
        )}

        <Card className="p-8">{renderStep()}</Card>
      </div>
    </div>
  );
}
