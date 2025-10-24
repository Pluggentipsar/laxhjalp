import { motion } from 'framer-motion';
import type { AgeGroup } from '../../types';
import { AGE_GROUP_LABELS } from '../../data/subjectHubs';

interface AgeGroupSelectorProps {
  selectedAgeGroup: AgeGroup;
  onSelect: (ageGroup: AgeGroup) => void;
  userAgeGroup: AgeGroup;
}

const AGE_GROUPS: AgeGroup[] = ['1-3', '4-6', '7-9'];

export function AgeGroupSelector({
  selectedAgeGroup,
  onSelect,
  userAgeGroup,
}: AgeGroupSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {AGE_GROUPS.map((ageGroup) => {
        const isSelected = selectedAgeGroup === ageGroup;
        const isUserGroup = userAgeGroup === ageGroup;

        return (
          <motion.button
            key={ageGroup}
            onClick={() => onSelect(ageGroup)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${
                isSelected
                  ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {AGE_GROUP_LABELS[ageGroup]}
            {isUserGroup && (
              <span className="ml-1.5 text-xs opacity-75">
                {isSelected ? '(din)' : '(din)'}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
