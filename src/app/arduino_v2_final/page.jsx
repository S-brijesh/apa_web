"use client";
import TimerComponent from "@/components/TimerComponent";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ArduinoPage() {
  const [port, setPort] = useState(null);
  const [reader, setReader] = useState(null);
  const [writer, setWriter] = useState(null);
  const [data, setData] = useState("");
  const [plotData, setPlotData] = useState([]);
  const [isReading, setIsReading] = useState(false);
  const [dataRate, setDataRate] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [yAxisRange1, setYAxisRange1] = useState({ min: 0, max: 100 });
  const [yAxisRange2, setYAxisRange2] = useState({ min: 0, max: 100 });
  const [autoZoom1, setAutoZoom1] = useState(true);
  const [autoZoom2, setAutoZoom2] = useState(true);
  const [lastDataReceived, setLastDataReceived] = useState(Date.now());
  const [requestMode, setRequestMode] = useState("smart"); 
  const [isRecording, setIsRecording] = useState(false);

  // Recording data storage
  const recordingDataRef = useRef({
    value1: [],
    value2: [],
    timestamp: []
  });

  const handleRecordingChange = (status) => {
    setIsRecording(status); 
    
    if (status) {
      // Start recording - clear previous data
      recordingDataRef.current = {
        value1: [],
        value2: [],
        timestamp: []
      };
      console.log("Recording started - data collection initialized");
    } else {
      // Stop recording - save data to file
      saveRecordingData();
      console.log("Recording stopped - saving data");
    }
  };

  // Function to save recorded data as JSON file
  const saveRecordingData = () => {
    const recordedData = recordingDataRef.current;
    
    // Check if we have any data to save
    if (recordedData.value1.length === 0) {
      console.log("No data to save");
      return;
    }

    // Create JSON data
    const jsonData = {
      recordingInfo: {
        totalDataPoints: recordedData.value1.length,
        recordingDate: new Date().toISOString(),
        deviceType: "Arduino",
        dataFormat: "value1: Hand sensor, value2: Leg sensor, timestamp: Arduino timestamp"
      },
      data: {
        value1: recordedData.value1,
        value2: recordedData.value2,
        timestamp: recordedData.timestamp
      }
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with timestamp
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    link.download = `arduino_recording_${dateStr}_${timeStr}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`Data saved: ${recordedData.value1.length} data points`);
  };

  // Use refs for performance-critical data to avoid re-renders
  const plotDataRef = useRef([]);
  const dataBufferRef = useRef("");
  const lastRateUpdateRef = useRef(Date.now());
  const dataCountRef = useRef(0);
  const lastScaleUpdateRef = useRef(Date.now());
  const readLoopRef = useRef(null);
  const autoRequestIntervalRef = useRef(null);

  const [maxPoints, setMaxPoints] = useState(3500);

  // Calculate dynamic Y-axis range with improved amplitude management
  const calculateYAxisRange = useCallback((data, valueKey) => {
    if (data.length === 0) return { min: 0, max: 100 };

    // Adaptive window size based on total data points
    let windowSize;

    if (data.length <= 20) {
      windowSize = data.length; // Use all points for small datasets
    } else if (data.length <= 50) {
      windowSize = Math.max(20, Math.floor(data.length * 0.8)); // 80% of points
    } else if (data.length <= 100) {
      windowSize = 100; // Fixed window for medium datasets
    } else {
      windowSize = 1000; // Larger window for big datasets
    }

    const recentData = data.slice(-windowSize);
    const values = recentData
      .map((d) => d[valueKey])
      .filter((v) => v !== undefined && !isNaN(v));

    if (values.length === 0) return { min: 0, max: 100 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Dynamic padding based on data characteristics
    let padding;
    if (range < 5) {
      // Very small range - use fixed padding
      padding = 5;
    } else if (range < 20) {
      // Small range - use 30% padding
      padding = range * 0.3;
    } else if (range < 50) {
      // Medium range - use 20% padding
      padding = range * 0.2;
    } else {
      // Large range - use 15% padding
      padding = range * 0.15;
    }

    // Ensure minimum range for visibility
    const finalMin = Math.max(0, Math.floor(min - padding));
    const finalMax = Math.ceil(max + padding);

    // Ensure minimum visible range
    if (finalMax - finalMin < 10) {
      const center = (finalMax + finalMin) / 2;
      return {
        min: Math.max(0, Math.floor(center - 5)),
        max: Math.ceil(center + 5),
      };
    }

    return {
      min: finalMin,
      max: finalMax,
    };
  }, []);

  // Optimized data parsing with minimal string operations
  const parseIncomingData = useCallback(
    (chunk) => {
      dataBufferRef.current += chunk;
      const lines = dataBufferRef.current.split("\n");

      // Keep the last incomplete line in buffer
      dataBufferRef.current = lines.pop() || "";

      const newDataPoints = [];
      const currentTime = Date.now();

      for (const line of lines) {
        if (line.includes("$") && line.includes("&")) {
          const clean = line.trim();

          // Update display data (throttled to prevent UI lag)
          if (currentTime - lastUpdateTime > 100) {
            // Update display every 100ms max
            setData((prev) => (prev + "\n" + clean).slice(-2000)); // Keep last 2000 chars
            setLastUpdateTime(currentTime);
          }

          // Fast regex parsing
          const match = clean.match(/\$(\d+)&(\d+)#(\d+)/);
          if (match) {
            const timestamp = parseInt(match[3], 10);
            const value1 = parseInt(match[1], 10);
            const value2 = parseInt(match[2], 10);

            newDataPoints.push({
              timestamp,
              value1,
              value2,
            });

            // If recording is active, store the data
            if (isRecording) {
              recordingDataRef.current.value1.push(value1);
              recordingDataRef.current.value2.push(value2);
              recordingDataRef.current.timestamp.push(timestamp);
            }

            dataCountRef.current++;
          }
        }
      }

      // Batch update plot data for better performance - adaptive data retention
      if (newDataPoints.length > 0) {
        plotDataRef.current = [...plotDataRef.current, ...newDataPoints].slice(
          -maxPoints
        );
        setPlotData([...plotDataRef.current]); // Trigger re-render with new array reference

        // Update Y-axis scaling in real-time with adaptive frequency
        const scaleUpdateInterval = plotDataRef.current.length > 50 ? 150 : 300; // Faster updates for more data
        if (currentTime - lastScaleUpdateRef.current > scaleUpdateInterval) {
          if (autoZoom1) {
            const range1 = calculateYAxisRange(plotDataRef.current, "value1");
            setYAxisRange1((prevRange) => {
              // Smoother transitions - only update if there's a meaningful change
              const minDiff = Math.abs(prevRange.min - range1.min);
              const maxDiff = Math.abs(prevRange.max - range1.max);
              const threshold = plotDataRef.current.length > 30 ? 2 : 1; // Adaptive threshold

              if (minDiff > threshold || maxDiff > threshold) {
                return range1;
              }
              return prevRange;
            });
          }

          if (autoZoom2) {
            const range2 = calculateYAxisRange(plotDataRef.current, "value2");
            setYAxisRange2((prevRange) => {
              const minDiff = Math.abs(prevRange.min - range2.min);
              const maxDiff = Math.abs(prevRange.max - range2.max);
              const threshold = plotDataRef.current.length > 30 ? 2 : 1;

              if (minDiff > threshold || maxDiff > threshold) {
                return range2;
              }
              return prevRange;
            });
          }

          lastScaleUpdateRef.current = currentTime;
        }
      }

      // Update data rate calculation and track last data received
      if (currentTime - lastRateUpdateRef.current > 1000) {
        setDataRate(dataCountRef.current);
        if (dataCountRef.current > 0) {
          setLastDataReceived(currentTime);
        }
        dataCountRef.current = 0;
        lastRateUpdateRef.current = currentTime;
      }
    },
    [lastUpdateTime, autoZoom1, autoZoom2, calculateYAxisRange, isRecording]
  );

  // Optimized port reading with proper error handling
  const listenToPort = useCallback(
    async (reader) => {
      const readLoop = async () => {
        try {
          while (isReading && reader) {
            const { value, done } = await reader.read();
            if (done) break;

            if (value) {
              parseIncomingData(value);
            }
          }
        } catch (err) {
          console.log("Read loop stopped:", err.message);
          // Don't throw error, just exit gracefully
        }
      };

      readLoopRef.current = readLoop();
      return readLoopRef.current;
    },
    [parseIncomingData, isReading]
  );

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Smart request data function with data flow monitoring
  const requestData = useCallback(async () => {
    if (writer && isReading) {
      try {
        await writer.write("$");
        console.log("Data request sent");
      } catch (error) {
        console.error("Error sending data request:", error);
      }
    }
  }, [writer, isReading]);

  // Start intelligent data requesting with multiple modes
  const startAutoRequest = useCallback(() => {
    if (autoRequestIntervalRef.current) {
      clearInterval(autoRequestIntervalRef.current);
    }

    // Send initial request immediately
    requestData();

    if (requestMode === "smart") {
      // Smart mode: Only request when no data is flowing
      let consecutiveNoDataCount = 0;

      autoRequestIntervalRef.current = setInterval(() => {
        const timeSinceLastData = Date.now() - lastDataReceived;

        if (timeSinceLastData > 4000) {
          // No data for 4 seconds
          consecutiveNoDataCount++;
          if (consecutiveNoDataCount >= 1) {
            // Request after 1 check with no data
            console.log(`No data for ${timeSinceLastData}ms - sending request`);
            requestData();
            consecutiveNoDataCount = 0;
          }
        } else {
          consecutiveNoDataCount = 0; // Reset if we have recent data
        }
      }, 3000); // Check every 3 seconds
    } else if (requestMode === "continuous") {
      // Continuous mode: Regular requests (use sparingly)
      autoRequestIntervalRef.current = setInterval(() => {
        requestData();
      }, 5000); // Every 5 seconds to be safer
    }
    // Manual mode: No automatic requests

    console.log(`Auto data request started in ${requestMode} mode`);
  }, [requestData, requestMode, lastDataReceived]);

  // Stop automatic data requesting
  const stopAutoRequest = useCallback(() => {
    if (autoRequestIntervalRef.current) {
      clearInterval(autoRequestIntervalRef.current);
      autoRequestIntervalRef.current = null;
      console.log("Auto data request stopped");
    }
  }, []);

  const connectToPort = async () => {
    try {
      console.log("Requesting serial port...");
      const selectedPort = await navigator.serial.requestPort();

      console.log("Opening port...", selectedPort);
      // Optimized serial settings for real-time performance
      await selectedPort.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      });

      console.log("Setting up streams...");
      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = selectedPort.readable.pipeTo(
        textDecoder.writable
      );
      const reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(
        selectedPort.writable
      );
      const writer = textEncoder.writable.getWriter();

      setPort(selectedPort);
      setReader(reader);
      setWriter(writer);
      setIsReading(true);

      // Reset counters
      plotDataRef.current = [];
      dataBufferRef.current = "";
      dataCountRef.current = 0;
      lastRateUpdateRef.current = Date.now();

      console.log("Connection established successfully");

      // Wait a bit for Arduino to be ready, then start auto requesting
      await sleep(1000);

      // Start automatic data requesting after connection is stable
      setTimeout(() => {
        if (writer && isReading) {
          startAutoRequest();
        }
      }, 500);
    } catch (error) {
      console.error("Connection failed:", error);
      // Reset state on connection failure
      setPort(null);
      setReader(null);
      setWriter(null);
      setIsReading(false);

      // Show user-friendly error message
      if (error.name === "InvalidStateError") {
        alert(
          "Port is already in use. Please wait a moment and try again, or unplug and reconnect your Arduino."
        );
      }
    }
  };

  // Auto-start reading when connection is established
  useEffect(() => {
    if (reader && isReading) {
      listenToPort(reader);
    }
  }, [reader, isReading, listenToPort]);

  // Start auto request when writer becomes available
  useEffect(() => {
    if (writer && isReading && !autoRequestIntervalRef.current) {
      const timer = setTimeout(() => {
        startAutoRequest();
      }, 1000); // Wait 1 second after writer is ready

      return () => clearTimeout(timer);
    }
  }, [writer, isReading, startAutoRequest]);

  const stopCommunication = async () => {
    console.log("Starting disconnect process...");

    // If recording is active, stop it and save data
    if (isRecording) {
      handleRecordingChange(false);
    }

    // Step 1: Stop auto requesting
    stopAutoRequest();

    // Step 2: Stop the reading loop
    setIsReading(false);

    // Wait for any pending reads to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Step 3: Send stop command if writer is available
      if (writer) {
        try {
          await writer.write("D");
          console.log("Stop command sent");
        } catch (e) {
          console.log("Error sending stop command:", e.message);
        }
      }

      // Step 4: Release writer lock and close
      if (writer) {
        try {
          await writer.close();
          console.log("Writer closed");
        } catch (e) {
          console.log("Writer close error:", e.message);
        }
      }

      // Step 5: Cancel and release reader
      if (reader) {
        try {
          await reader.cancel();
          console.log("Reader cancelled");
        } catch (e) {
          console.log("Reader cancel error:", e.message);
        }
      }

      // Step 6: Wait for streams to fully close
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Step 7: Close the port
      if (port) {
        try {
          await port.close();
          console.log("Port closed successfully");
        } catch (e) {
          console.log("Port close error:", e.message);
        }
      }
    } catch (error) {
      console.error("Error during disconnect:", error);
    } finally {
      // Step 8: Reset all state regardless of errors
      setReader(null);
      setWriter(null);
      setPort(null);
      setIsReading(false);
      readLoopRef.current = null;
      console.log("Disconnect completed - all states reset");
    }
  };

  const clearData = () => {
    setData("");
    setPlotData([]);
    plotDataRef.current = [];
    dataBufferRef.current = "";
    dataCountRef.current = 0;
    // Reset zoom ranges
    setYAxisRange1({ min: 0, max: 100 });
    setYAxisRange2({ min: 0, max: 100 });
    // Clear recording data as well
    recordingDataRef.current = {
      value1: [],
      value2: [],
      timestamp: []
    };
  };

  const resetZoom1 = () => {
    if (plotDataRef.current.length > 0) {
      const range1 = calculateYAxisRange(plotDataRef.current, "value1");
      setYAxisRange1(range1);
    } else {
      setYAxisRange1({ min: 0, max: 100 });
    }
  };

  const resetZoom2 = () => {
    if (plotDataRef.current.length > 0) {
      const range2 = calculateYAxisRange(plotDataRef.current, "value2");
      setYAxisRange2(range2);
    } else {
      setYAxisRange2({ min: 0, max: 100 });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRequest();
      // If recording is active when component unmounts, save the data
      if (isRecording) {
        saveRecordingData();
      }
    };
  }, [stopAutoRequest, isRecording]);

  return (
    <div className=" bg-gray-50 min-h-screen max-h-full ">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-1 ">
          <h1 className="text-2xl font-bold mb-4 text-gray-800"></h1>

          {/* Main Layout: Left side for graphs, Right side for controls */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Section - Graphs */}
            <div className="flex-1">
              {/* Graph 1 */}
              <div className="bg-white rounded-lg border shadow-sm p-4 ">
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        domain={["dataMin", "dataMax"]}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        domain={
                          autoZoom1
                            ? [yAxisRange1.min, yAxisRange1.max]
                            : ["dataMin", "dataMax"]
                        }
                        tickFormatter={(value) => value.toFixed(0)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name) => [value.toFixed(0), name]}
                      />
                      
                      <Line
                        type="monotone"
                        dataKey="value1"
                        stroke="#3b82f6"
                        name="Hand"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Graph 2 */}
              <div className="bg-white rounded-lg border shadow-sm p-4">
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plotData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        domain={["dataMin", "dataMax"]}
                      />
                      <YAxis
                        stroke="#666"
                        tick={{ fontSize: 12 }}
                        domain={
                          autoZoom2
                            ? [yAxisRange2.min, yAxisRange2.max]
                            : ["dataMin", "dataMax"]
                        }
                        tickFormatter={(value) => value.toFixed(0)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #dee2e6",
                          borderRadius: "8px",
                        }}
                        formatter={(value, name) => [value.toFixed(0), name]}
                      />
                      
                      <Line
                        type="monotone"
                        dataKey="value2"
                        stroke="#10b981"
                        name="Leg"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Section - Controls */}
            <div className="w-full lg:w-60 flex flex-col">
              <div className="bg-white rounded-lg border shadow-sm p-4 h-full">
                {/* Connection Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isReading ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-black">
                      Status: {isReading ? "Connected" : "Disconnected"}
                    </span>
                  </div>

                  {/* Recording Status */}
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-red-600 font-medium">
                        Recording... ({recordingDataRef.current.value1.length} points)
                      </span>
                    </div>
                  )}

                  {!port ? (
                    <button
                      onClick={connectToPort}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                    >
                      Connect
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={stopCommunication}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                      >
                        Disconnect
                      </button>
                      <button
                        onClick={clearData}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                      >
                        Clear Data
                      </button>
                    </div>
                  )}
                </div>

                {/* Space for additional components */}
                {port && (
                  <div className="mt-1 pt-6 border-t border-gray-200">
                    <TimerComponent onRecordingChange={handleRecordingChange} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}