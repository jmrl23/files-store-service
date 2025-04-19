import { Button } from '@/components/ui/button';
import { useState } from 'react';

function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <div className='m-4'>
      <p>count: {count}</p>
      <Button onClick={() => setCount((count) => count + 1)}>Click me</Button>
    </div>
  );
}

export default App;
