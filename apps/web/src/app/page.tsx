import DashboardClient from './components/DashboardClient';
import AuthGate from './components/AuthGate';

export default function HomePage() {
  return (
    <AuthGate>
      <DashboardClient />
    </AuthGate>
  );
}