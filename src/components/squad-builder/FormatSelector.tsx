import React from 'react';
import {
  GameFormat,
  GAME_FORMAT_CONFIG,
  GAME_FORMATS,
} from '../../constants/squad.constants';

interface FormatSelectorProps {
  value: GameFormat;
  onChange: (format: GameFormat) => void;
  disabled?: boolean;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex gap-2">
      {GAME_FORMATS.map((format) => {
        const config = GAME_FORMAT_CONFIG[format];
        const isSelected = value === format;

        return (
          <button
            key={format}
            onClick={() => onChange(format)}
            disabled={disabled}
            className={`
              flex-1 p-3 rounded-lg border-2 transition-all text-left
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div
              className={`text-lg font-bold ${
                isSelected ? 'text-blue-600' : 'text-gray-800'
              }`}
            >
              {config.label}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {config.totalPlayers} players
            </div>
            <div className="text-xs text-gray-400">{config.recommendedAges}</div>
          </button>
        );
      })}
    </div>
  );
};

export default FormatSelector;
