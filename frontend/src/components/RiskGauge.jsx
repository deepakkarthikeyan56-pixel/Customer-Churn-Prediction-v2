import React from 'react';

export const RiskGauge = ({ probability = 0, size = 180 }) => {
  const cleanProb = Math.min(Math.max(Number(probability) || 0, 0), 100);
  
  // Calculate SVG arc parameters (half circle gauge from 180 deg to 360 deg)
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circumference
  const strokeDashoffset = circumference - (cleanProb / 100) * circumference;

  let color = '#10b981'; // Emerald (<35%)
  let statusText = 'Low Risk';
  let glowColor = 'rgba(16, 185, 129, 0.3)';

  if (cleanProb >= 65) {
    color = '#f43f5e'; // Rose
    statusText = 'High Churn Risk';
    glowColor = 'rgba(244, 63, 94, 0.4)';
  } else if (cleanProb >= 35) {
    color = '#f59e0b'; // Amber
    statusText = 'Medium Churn Risk';
    glowColor = 'rgba(245, 158, 11, 0.35)';
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} className="overflow-visible">
          {/* Background track */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active progress arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${glowColor})`
            }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white">
            {cleanProb.toFixed(1)}%
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
};
