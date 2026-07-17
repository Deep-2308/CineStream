import PageTransition from '../components/common/PageTransition.jsx';

export default function OnboardingPage() {
  return (
    <PageTransition>
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-xl">
          <h1 className="mb-4 text-4xl font-bold text-txt">Welcome to CineStream</h1>
          <p className="text-lg text-txt-muted mb-8">
            This is a placeholder for the onboarding flow. You'll set up your preferences and avatar here in Phase 16.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
