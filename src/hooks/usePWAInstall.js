import { usePWAInstall } from './hooks/usePWAInstall';

function App() {
  const { installPrompt, onClickInstall } = usePWAInstall();

  return (
    <div>
      {installPrompt && (
        <button onClick={onClickInstall}>Install App</button>
      )}
    </div>
  );
}