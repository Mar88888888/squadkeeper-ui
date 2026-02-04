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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div
              className={`text-lg font-bold ${
                isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'
              }`}
            >
              {config.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {config.totalPlayers} players
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{config.recommendedAges}</div>
          </button>
        );
      })}
    </div>
  );
};

export default FormatSelector;
