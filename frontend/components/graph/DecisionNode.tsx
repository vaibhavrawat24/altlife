"use client";
import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";

export interface DecisionNodeData {
  label: string;
  phase: string;
}

function DecisionNode({ data }: NodeProps<DecisionNodeData>) {
  const { label, phase } = data;
  const isSynthesizing = phase === "synthesizing";
  const isComplete = phase === "complete";

  return (
    <>
      <Handle type="source" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      <motion.div
        className="flex items-center justify-center"
        style={{ width: 110, height: 110 }}
        animate={
          isSynthesizing
            ? { boxShadow: ["0 0 0px #5b45e044", "0 0 40px #5b45e088", "0 0 0px #5b45e044"] }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div
          className="w-[110px] h-[110px] rounded-full flex flex-col items-center justify-center border-2 transition-all duration-700"
          style={{
            background: isComplete
              ? "linear-gradient(135deg, #ede9ff, #f5f3ff)"
              : "linear-gradient(135deg, #f0eeff, #faf8ff)",
            borderColor: isComplete ? "#5b45e0" : "#c7bfff",
            boxShadow: isComplete ? "0 0 30px #5b45e044" : "none",
          }}
        >
          <span className="text-2xl mb-1">{isComplete ? "✦" : "◎"}</span>
          <span
            className="text-[10px] font-semibold text-center px-2 leading-tight"
            style={{ color: "#5b45e0" }}
          >
            {label.length > 30 ? label.slice(0, 28) + "…" : label}
          </span>
        </div>
      </motion.div>
    </>
  );
}

export default memo(DecisionNode);
