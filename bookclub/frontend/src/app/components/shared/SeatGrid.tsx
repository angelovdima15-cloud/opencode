import { motion } from "motion/react";
import { PCSpec, Zone } from "../../data/mockClubs";
import { Monitor, Lock } from "lucide-react";

interface SeatGridProps {
  pcs: PCSpec[];
  selectedZone: Zone | null;
  selectedSeatId: string;
  onSelectSeat: (pc: PCSpec) => void;
}

export function SeatGrid({ pcs, selectedZone, selectedSeatId, onSelectSeat }: SeatGridProps) {
  const filtered = selectedZone ? pcs.filter((p) => p.zone === selectedZone) : pcs;

  const grouped: Record<number, PCSpec[]> = {};
  filtered.forEach((pc) => {
    if (!grouped[pc.row]) grouped[pc.row] = [];
    grouped[pc.row].push(pc);
  });

  const zoneColors: Record<Zone, string> = {
    VIP: "#7C3AED",
    Pro: "#06B6D4",
    Standard: "#8888AA",
  };

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(grouped).map(([row, seats]) => {
        const zone = seats[0].zone;
        const color = zoneColors[zone];
        return (
          <div key={row}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold" style={{ color: color, opacity: 0.8 }}>
                {zone} Zone — Row {parseInt(row) + 1}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {seats.map((pc) => {
                const isSelected = selectedSeatId === pc.id;
                const isOccupied = pc.status === "occupied" || pc.status === "maintenance";

                return (
                  <motion.button
                    key={pc.id}
                    whileTap={isOccupied ? {} : { scale: 0.9 }}
                    onClick={() => !isOccupied && onSelectSeat(pc)}
                    disabled={isOccupied}
                    className="relative flex flex-col items-center justify-center rounded-xl"
                    style={{
                      width: "54px",
                      height: "54px",
                      background: isSelected
                        ? `rgba(124, 58, 237, 0.3)`
                        : isOccupied
                        ? "rgba(239, 68, 68, 0.1)"
                        : `rgba(${zone === "VIP" ? "124, 58, 237" : zone === "Pro" ? "6, 182, 212" : "136, 136, 170"}, 0.1)`,
                      border: isSelected
                        ? `2px solid #7C3AED`
                        : isOccupied
                        ? "1px solid rgba(239,68,68,0.3)"
                        : `1px solid ${color}40`,
                      boxShadow: isSelected ? `0 0 12px rgba(124, 58, 237, 0.5)` : "none",
                      cursor: isOccupied ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {isOccupied ? (
                      <Lock size={16} color="rgba(239,68,68,0.7)" />
                    ) : (
                      <Monitor
                        size={16}
                        color={isSelected ? "#A78BFA" : color}
                        style={{ opacity: isOccupied ? 0.4 : 1 }}
                      />
                    )}
                    <span
                      className="text-[10px] mt-0.5 font-semibold"
                      style={{ color: isSelected ? "#A78BFA" : isOccupied ? "#F87171" : color, opacity: 0.9 }}
                    >
                      {pc.seatNumber}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                        style={{ background: "#7C3AED", boxShadow: "0 0 6px #7C3AED" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-4 mt-1">
        {[
          { color: "#7C3AED", label: "Available" },
          { color: "#7C3AED", label: "Selected", selected: true },
          { color: "#EF4444", label: "Occupied" },
        ].map(({ color, label, selected }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded"
              style={{
                background: selected ? "rgba(124,58,237,0.3)" : label === "Occupied" ? "rgba(239,68,68,0.1)" : "rgba(124,58,237,0.1)",
                border: selected ? `2px solid ${color}` : `1px solid ${color}40`,
              }}
            />
            <span className="text-[11px]" style={{ color: "#8888AA" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
