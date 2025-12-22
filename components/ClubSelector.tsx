import { FC } from 'react';
import { ClubStats } from '../types';

interface ClubSelectorProps {
  clubs: ClubStats[];
  selectedClub: ClubStats;
  onSelect: (club: ClubStats) => void;
  useYards: boolean;
}

const ClubSelector: FC<ClubSelectorProps> = ({ clubs, selectedClub, onSelect, useYards }) => {
  // Logic is now mostly handled by the parent's overlay for styling, 
  // but we keep the select functionality here.
  return (
    <div className="h-full w-full">
      <select 
        className="w-full h-full opacity-0 absolute inset-0 z-10 cursor-pointer"
        value={selectedClub.name}
        onChange={(e) => {
          const club = clubs.find(c => c.name === e.target.value);
          if (club) onSelect(club);
        }}
      >
        {clubs.map(c => {
          const carry = useYards ? c.carry * 1.09361 : c.carry;
          const unit = useYards ? 'yd' : 'm';
          return (
            <option key={c.name} value={c.name} className="bg-gray-900 text-white">
              {c.name} ({Math.round(carry)}{unit})
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default ClubSelector;