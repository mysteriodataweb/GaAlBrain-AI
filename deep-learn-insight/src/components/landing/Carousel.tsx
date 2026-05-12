import { UploadCard } from "./cards/UploadCard";
import { CodeCard } from "./cards/CodeCard";
import { MapCard } from "./cards/MapCard";
import { PeerCard } from "./cards/PeerCard";
import { TeacherCard } from "./cards/TeacherCard";
import { ProgressCard } from "./cards/ProgressCard";

const cards = [UploadCard, CodeCard, MapCard, PeerCard, TeacherCard, ProgressCard];

export function Carousel() {
  // duplicate set for seamless loop
  const items = [...cards, ...cards];
  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
      }}
    >
      <div className="flex gap-4 animate-scroll-left py-4">
        {items.map((Card, i) => (
          <div
            key={i}
            className="flex-shrink-0 p-5"
            style={{
              width: 260,
              height: 320,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.09)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              fontSize: 13,
            }}
          >
            <Card />
          </div>
        ))}
      </div>
    </div>
  );
}
