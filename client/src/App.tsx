import AuthView from '@/AuthView';
import { useApiContext } from '@/contexts/api-context';
import MainView from '@/MainView';

function App() {
  const { key } = useApiContext();

  if (!key) return <AuthView />;
  return <MainView />;
}

export default App;
