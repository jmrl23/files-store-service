import { Auth } from '@/app/auth';
import { Dashboard } from '@/app/dashboard';
import { useApiContext } from '@/contexts/api-context';

function App() {
  const { key } = useApiContext();

  if (!key) return <Auth />;
  return <Dashboard />;
}

export default App;
