import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';

const data = [
  {
    parameter: 'Pulse rate',
    unit: 'BPM',
    normal: '<60     60-100     >100',
    value: 72
  },
  {
    parameter: 'Pulse rate variance',
    unit: '-',
    normal: '<10     10-50     >50',
    value: 8
  },
  {
    parameter: '% Pulse rate variance',
    unit: '%',
    normal: '<10     10-50     >50',
    value: 11
  },
  {
    parameter: 'Stiffness index',
    unit: '-',
    normal: '<5       5-10       >10',
    value: 4.5
  },
  {
    parameter: 'Augmentation index',
    unit: '%',
    normal: '<10     10-50     >50',
    value: 54
  },
  {
    parameter: 'Pulse wave velocity',
    unit: 'm/s',
    normal: '<10     10-20     >20',
    value: 4.5
  },
  {
    parameter: 'Ejection duration',
    unit: 'ms',
    normal: '<100   100-300   >300',
    value: 120
  },
  {
    parameter: 'Rel. crest time',
    unit: 's',
    normal: '-',
    value: '-'
  }
];

export default function CardioAnalysisPage() {
  return (
    <div className="min-h-screen bg-white text-indigo-700 font-sans px-8 py-6">
      {/* Top border gradient like in image */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-200 via-indigo-100 to-white mb-4" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center space-x-2 text-lg font-semibold">
            <ArrowLeft className="w-5 h-5" />
            <span>Preview: Cardio Vascular Risk Analysis</span>
          </div>
          <p className="text-sm mt-1">Test report and observations</p>
        </div>
        <button className="flex items-center space-x-1 px-4 py-2 bg-white border border-indigo-200 rounded-lg shadow-sm hover:shadow-md">
          <span>Download</span>
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <table className="w-full text-sm shadow rounded-lg border border-gray-200 overflow-hidden">
        <thead className="bg-indigo-50 text-left">
          <tr className="border-b border-indigo-200 text-indigo-700">
            <th className="py-3 px-4">Parameters</th>
            <th className="px-4">Unit</th>
            <th className="px-4">Normal value</th>
            <th className="px-4">Observed value</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {data.map((item, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-indigo-50/20">
              <td className="py-3 px-4">{item.parameter}</td>
              <td className="px-4">{item.unit}</td>
              <td className="px-4">
                {item.normal !== '-' ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs bg-orange-200 text-black px-2 py-0.5 rounded">{item.normal.split(/\s+/)[0]}</span>
                    <span className="text-xs bg-green-200 text-black px-2 py-0.5 rounded">{item.normal.split(/\s+/)[1]}</span>
                    <span className="text-xs bg-red-200 text-black px-2 py-0.5 rounded">{item.normal.split(/\s+/)[2]}</span>
                  </div>
                ) : (
                  <span>-</span>
                )}
              </td>
              <td className="px-4 font-bold">{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
