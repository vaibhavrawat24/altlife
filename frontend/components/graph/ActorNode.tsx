"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";

export interface ActorNodeData {
  label: string;
  role: string;
  color: string;
  is_primary: boolean;
  status: "pending" | "active" | "done";
  stance: string;
  eventCount: number;
  onClick: () => void;
}

function ActorNode({ data }: NodeProps<ActorNodeData>) {
  const { label, color, is_primary, status, eventCount, onClick } = data;

  const isDone = status === "done";
  const isPending = status === "pending";

  const size = is_primary ? 72 : 52;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <motion.div
        onClick={onClick}
        animate={
          isDone
            ? { scale: 1 }
            : isPending
            ? { scale: 1 }
            : { scale: [1, 1.06, 1] }
        }
        transition={{ duration: 1.6, repeat: isPending ? 0 : Infinity, ease: "easeInOut" }}
        style={{ width: size, height: size, cursor: "pointer" }}
        className="relative flex items-center justify-center select-none"
      >
        {/* Pulse ring when active */}
        {!isPending && !isDone && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${color}` }}
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        )}

        {/* Node circle */}
        <div
          className="rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500"
          style={{
            width: size,
            height: size,
            background: isDone ? `${color}20` : isPending ? "#f5f4f0" : `${color}12`,
            borderColor: isDone ? color : isPending ? "#e0ddd6" : `${color}88`,
            boxShadow: isDone ? `0 0 20px ${color}44` : "none",
          }}
        >
          {isDone ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-sm font-bold" style={{ color }}>✓</span>
              {eventCount > 0 && (
                <span className="text-[9px] font-semibold" style={{ color }}>
                  {eventCount} events
                </span>
              )}
            </div>
          ) : (
            <div
              className="rounded-full"
              style={{
                width: is_primary ? 10 : 7,
                height: is_primary ? 10 : 7,
                background: isPending ? "#ccc" : color,
              }}
            />
          )}
        </div>

        {/* Label below node */}
        <div
          className="absolute text-center pointer-events-none"
          style={{ top: size + 6, left: "50%", transform: "translateX(-50%)", width: 90 }}
        >
          <span
            className="text-[11px] font-semibold leading-tight block"
            style={{ color: isDone ? color : isPending ? "#b0ac9f" : color }}
          >
            {label}
          </span>
        </div>
      </motion.div>
    </>
  );
}

export default memo(ActorNode);
