import { useState, useEffect } from "react";

export default function TimerComponent() {
  const [milliseconds, setMilliseconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(() => {
        setMilliseconds((prev) => prev + 100); // increment by 100ms
      }, 100);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
  };

  const generateReport = () => {
    setMilliseconds(0);
    setIsRunning(false);
    console.log("Generate report clicked");
  };

  const formatTime = () => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    const ms = (milliseconds % 1000).toString().padStart(3, "0").slice(0, 2); // show two digits

    return `${mins}:${secs}:${ms}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 font-sans">
      {/* Control Panel */}
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="flex flex-col space-y-2">
          <button
            onClick={startTimer}
            className=" text-indigo-700 shadow-md py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Start timer
          </button>

          <button
            onClick={stopTimer}
            className=" text-indigo-700 shadow-md py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Stop timer
          </button>

          <button
            onClick={generateReport}
            className="bg-gray-100 shadow-md text-indigo-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Generate report
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="border border-gray-300 rounded-lg p-4">
        <div className="text-center">
          <div className="text-indigo-700 font-medium text-lg mb-2">Timer</div>
          <div className="text-xl text-black font-mono tracking-wider">
            {formatTime()}
          </div>
        </div>
      </div>
    </div>
  );
}
