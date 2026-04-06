import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { useChildStore } from '../store';
import { useSettingsStore } from '../store';
import { calculateAgeBand, formatAge } from '../lib/dateUtils';
import { AGE_BAND_LABELS, AGE_BAND_FOCUS } from '../types';
import type { AgeBand } from '../types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const addChild = useChildStore((s) => s.addChild);
  const setOnboardingComplete = useSettingsStore((s) => s.setOnboardingComplete);

  const [step, setStep] = useState<'welcome' | 'profile'>('welcome');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');

  const ageBand: AgeBand | null = dob ? calculateAgeBand(dob) : null;

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your child\'s name');
      return;
    }
    if (!dob) {
      setError('Please enter date of birth');
      return;
    }
    if (!ageBand) return;

    const child = {
      id: nanoid(),
      name: name.trim(),
      dateOfBirth: dob,
      ageBand,
      preferences: [],
      sensitivities: [],
      languageEnvironment: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addChild(child);
    setOnboardingComplete(true);
    navigate('/');
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold text-surface-800 mb-2">NurtureOS</h1>
          <p className="text-base text-surface-500 mb-1">
            Your Montessori Home System
          </p>
          <p className="text-sm text-surface-400 mb-8">
            Simple, consistent, effective learning for ages 2–6.
            No expertise required.
          </p>
          <Button size="lg" fullWidth onClick={() => setStep('profile')}>
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-surface-800 mb-1">Add Your Child</h1>
          <p className="text-sm text-surface-500">
            We'll personalize activities based on their age.
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Child's Name"
            placeholder="e.g. Aarav"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
          />

          <Input
            label="Date of Birth"
            type="date"
            value={dob}
            onChange={(e) => { setDob(e.target.value); setError(''); }}
            max={new Date().toISOString().split('T')[0]}
          />

          {ageBand && (
            <div className="rounded-lg bg-primary-50 border border-primary-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-primary-700">
                  {AGE_BAND_LABELS[ageBand]}
                </span>
                {dob && (
                  <span className="text-xs text-primary-500">
                    ({formatAge(dob)})
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {AGE_BAND_FOCUS[ageBand].map((focus) => (
                  <div key={focus} className="flex items-center gap-2 text-xs text-primary-600">
                    <span className="w-1 h-1 rounded-full bg-primary-400" />
                    {focus}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <Button fullWidth size="lg" onClick={handleSubmit} disabled={!name || !dob}>
            Start Learning Journey
          </Button>

          <button
            onClick={() => setStep('welcome')}
            className="w-full text-center text-sm text-surface-400 hover:text-surface-600"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
