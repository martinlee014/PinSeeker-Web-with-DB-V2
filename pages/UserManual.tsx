
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserManual = () => {
  const navigate = useNavigate();

  const Section = ({ title, items }: { title: string, items: string[] }) => (
    <div className="mb-6">
      <h3 className="text-green-400 font-bold text-lg mb-3 border-b border-gray-800 pb-2">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-3 text-gray-300 text-sm leading-relaxed">
            <span className="text-green-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="p-4 pb-20">
       <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-lg">
          <ChevronLeft className="text-white" />
        </button>
        <h1 className="text-2xl font-bold text-white">User Manual</h1>
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
        <p className="text-gray-400 mb-6 italic">
          Welcome to PinSeeker! This app helps you track your golf rounds and analyze your performance with professional-grade dispersion data.
        </p>

        <Section 
          title="HDCP & Skill Modeling (Auto-Bag)"
          items={[
            '**New:** If you are unsure of your exact dispersion data, tap the "HDCP" button on the Dashboard.',
            'Enter your current handicap and choose to "Auto-Configure Bag."',
            'PinSeeker will generate a logically consistent 14-club bag with Carry distances and Scatter patterns (width/depth) tuned to your skill level.',
            'Higher handicaps will show larger ellipses to help you plan for more realistic "miss" scenarios.'
          ]}
        />

        <Section 
          title="Measurement Mode (Rangefinder)"
          items={[
            'Tap the Ruler icon (top right) to enter measurement mode.',
            'Tap the "MY LOC" button at the bottom to instantly snap the measurement start point to your current GPS position.',
            'Tap anywhere else on the map to measure from your current ball position to that specific point (layup point).',
            'The dashboard displays two distances: "From You" (Start to Target) and "To Pin" (Target to Green).'
          ]}
        />

        <Section 
          title="Recording Shots & GPS"
          items={[
            '**Record Shot:** Walk to your ball and tap the GPS button (bottom right) to save the shot landing spot.',
            '**Smart Tee-Off:** Long-press the "TEE OFF" button (3s) to start the hole from your exact current GPS location (useful if playing from a different tee box).',
            '**Manual Drop:** Long-press anywhere on the map to manually drop your ball location without GPS.',
            '**Undo:** Long-press any yellow shot marker on the map during a round to delete that shot.'
          ]}
        />

        <Section 
          title="Round Analysis & Statistics"
          items={[
            '**Split Stats:** View performance broken down by Front 9, Back 9, and Total.',
            '**Traditional Card:** Switch to the "Detailed Scorecard" tab for a classic grid view of Par, Score, and Putts.',
            '**Advanced Metrics:** Analyze Greens in Regulation (GIR), Average Putts, and Scrambling efficiency.',
            '**Hole Review:** Tap any hole row in the overview to replay shots from that specific hole.'
          ]}
        />

        <Section 
          title="Annotation Tools"
          items={[
            'Tap the Pen icon (top right) to toggle Annotation Mode.',
            '**Toolbar:** Select Text (T), Flag (Pin), or Draw (Highlighter).',
            '**Draw:** Tap points to create a path, then tap "Finish Line" to save.',
            '**Delete:** Select the Eraser (Red Icon) from the toolbar and tap any annotation to delete it instantly.'
          ]}
        />

        <Section 
          title="Wind Vane"
          items={[
             'Tap the Wind icon to open the compass overlay.',
             'Drag the ring to align the arrow with the current wind direction.',
             'The map will automatically adjust your predicted landing spot based on headwind or crosswind components.'
          ]}
        />

        <Section 
          title="Course & Club Management"
          items={[
            'Go to Settings > Course Database to view or add new custom courses.',
            'Go to Settings > Club Management to manually fine-tune individual clubs if you have launch monitor data.',
            'The blue ellipse on the map represents your statistical landing zone—always try to keep the whole ellipse in the safe zone!'
          ]}
        />
      </div>
    </div>
  );
};

export default UserManual;
