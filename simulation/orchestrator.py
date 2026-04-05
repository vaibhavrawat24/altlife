import asyncio
import json
import math
from typing import AsyncGenerator, Any, List, Dict

from agents.extractor import extract_profile
from agents.world_builder import build_world
from agents.actor import run_actor
from agents.synthesizer import synthesize
from agents.reality_check import run_reality_check, format_reality_for_actors
from services.search import search_facts, format_facts_for_prompt
from models.schemas import ExtractedProfile


def _profile_summary(profile: ExtractedProfile) -> str:
    parts = []
    if profile.age:                 parts.append(f"Age: {profile.age}")
    if profile.profession:          parts.append(f"Current situation: {profile.profession}")
    if profile.location:            parts.append(f"Location: {profile.location}")
    if profile.financial_runway:    parts.append(f"Financial runway: {profile.financial_runway}")
    if profile.support_system:      parts.append(f"Support: {profile.support_system}")
    if profile.risk_tolerance:      parts.append(f"Risk tolerance: {profile.risk_tolerance}")
    if profile.constraints:         parts.append(f"Constraints: {', '.join(profile.constraints)}")
    if profile.key_assets:          parts.append(f"Assets: {', '.join(profile.key_assets)}")
    if profile.next_chapter:        parts.append(f"Plan after decision: {profile.next_chapter}")
    if profile.next_chapter_detail: parts.append(f"Next chapter detail: {profile.next_chapter_detail}")
    return ". ".join(parts)


def _flatten_actors(world: dict) -> List[Dict]:
    """Flatten primaries + sub-agents into one list, preserving parent reference."""
    flat = []
    for primary in world.get("primary_actors", []):
        flat.append({**primary, "parent_id": None, "is_primary": True})
        for sub in primary.get("sub_agents", []):
            flat.append({
                **sub,
                "parent_id": primary["id"],
                "color": primary.get("color", "#6366f1") + "bb",
                "is_primary": False,
                "motivation": sub.get("motivation", primary.get("motivation", "")),
            })
    return flat


def _build_graph_nodes(world: dict) -> List[Dict]:
    """Build initial node list for frontend graph — positions set by frontend."""
    nodes = []
    primaries = world.get("primary_actors", [])
    n = len(primaries)

    for i, primary in enumerate(primaries):
        angle = (i / n) * 2 * math.pi - math.pi / 2
        px = 420 + 260 * math.cos(angle)
        py = 320 + 220 * math.sin(angle)
        nodes.append({
            "id": primary["id"],
            "label": primary["name"],
            "role": primary["role"],
            "color": primary.get("color", "#6366f1"),
            "is_primary": True,
            "parent_id": None,
            "x": round(px),
            "y": round(py),
            "stance": "",
            "events": [],
            "status": "pending",
        })

        subs = primary.get("sub_agents", [])
        ns = len(subs)
        for j, sub in enumerate(subs):
            spread = 0.45
            sub_angle = angle + (j - (ns - 1) / 2) * spread
            sx = px + 130 * math.cos(sub_angle)
            sy = py + 130 * math.sin(sub_angle)
            nodes.append({
                "id": sub["id"],
                "label": sub["name"],
                "role": sub["role"],
                "color": primary.get("color", "#6366f1"),
                "is_primary": False,
                "parent_id": primary["id"],
                "x": round(sx),
                "y": round(sy),
                "stance": "",
                "events": [],
                "status": "pending",
            })

    return nodes


def _build_graph_edges(world: dict, all_actors: List[Dict]) -> List[Dict]:
    """Build edges: parent→child + explicit relationships from world builder."""
    edges = []
    # Parent → child edges
    for actor in all_actors:
        if actor.get("parent_id"):
            edges.append({
                "id": f"{actor['parent_id']}__{actor['id']}",
                "source": actor["parent_id"],
                "target": actor["id"],
                "type": "hierarchy",
            })
    # Explicit relationship edges from world builder
    for rel in world.get("relationships", []):
        edges.append({
            "id": f"{rel['source']}__{rel['target']}",
            "source": rel["source"],
            "target": rel["target"],
            "label": rel.get("label", ""),
            "type": rel.get("type", "interaction"),
        })
    return edges


class SimulationOrchestrator:
    def __init__(self, profile_text: str, decision: str):
        self.profile_text = profile_text
        self.decision = decision

    async def run_streaming(self) -> AsyncGenerator[str, None]:
        try:
            # 1. Extract profile
            profile = await extract_profile(self.profile_text, self.decision)
            yield self._emit("profile_extracted", profile.model_dump())

            profile_summary = _profile_summary(profile)

            # 2. Reality check — search current world facts BEFORE building the world
            reality = await run_reality_check(self.decision, profile_summary)
            yield self._emit("reality_checked", {
                "severity": reality.get("severity", "low"),
                "severity_reason": reality.get("severity_reason", ""),
                "hard_constraints": reality.get("hard_constraints", []),
                "risk_flags": reality.get("risk_flags", {}),
                "domain_flags": reality.get("domain_flags", []),
                "facts_found": reality.get("facts_found", 0),
            })

            reality_text = format_reality_for_actors(reality)

            # 3. Build 2-tier world — pass reality so it can spawn appropriate actors
            print("[SimulationOrchestrator] Building world...")
            world = await build_world(profile, self.decision, reality)
            print(f"[SimulationOrchestrator] World built. Keys: {list(world.keys()) if isinstance(world, dict) else type(world)}")
            
            # Validate world structure
            if not isinstance(world, dict):
                raise ValueError(f"build_world returned non-dict: {type(world)}")
            if "primary_actors" not in world:
                raise ValueError(f"build_world returned world without 'primary_actors' key. Keys: {list(world.keys())}")
            if not isinstance(world.get("primary_actors"), list):
                raise ValueError(f"primary_actors is not a list: {type(world.get('primary_actors'))}")
            
            all_actors = _flatten_actors(world)
            graph_nodes = _build_graph_nodes(world)
            graph_edges = _build_graph_edges(world, all_actors)

            yield self._emit("graph_ready", {
                "nodes": graph_nodes,
                "edges": graph_edges,
                "domain": profile.decision_domain,
            })

            # 4. Additional actor-specific searches (on top of reality check)
            all_queries = []
            for primary in world.get("primary_actors", []):
                all_queries.extend(primary.get("search_queries", [])[:1])
            facts = await search_facts(all_queries[:4])
            facts_text = format_facts_for_prompt(facts)
            # Merge reality constraints + actor facts into one context block
            combined_facts = "\n\n".join(filter(None, [reality_text, facts_text]))

            # 4. Run ALL actors — max 3 concurrent to stay within GitHub Models rate limit
            semaphore = asyncio.Semaphore(3)

            async def run_with_semaphore(actor):
                async with semaphore:
                    return await run_actor(actor, all_actors, profile_summary, self.decision, combined_facts)

            tasks = [run_with_semaphore(actor) for actor in all_actors]
            results = await asyncio.gather(*tasks)

            # Stream each result + derived interaction edges
            all_actor_data = []
            interaction_edges = []
            for actor, result in zip(all_actors, results):
                all_actor_data.append(result)
                events = result.get("events", [])

                # Collect interaction edges from events
                for ev in events:
                    target = ev.get("interacts_with")
                    if target and target != actor["id"]:
                        edge_id = f"interaction__{actor['id']}__{target}__{ev['month']}"
                        interaction_edges.append({
                            "id": edge_id,
                            "source": actor["id"],
                            "target": target,
                            "type": "interaction",
                            "month": ev["month"],
                        })

                yield self._emit("actor_complete", {
                    "actor_id": actor["id"],
                    "actor_name": actor["name"],
                    "is_primary": actor.get("is_primary", False),
                    "stance": result.get("stance", ""),
                    "events": events,
                    "interaction_edges": [
                        e for e in interaction_edges
                        if e["source"] == actor["id"]
                    ],
                })

            # Emit all interaction edges at once
            if interaction_edges:
                yield self._emit("interaction_edges", {"edges": interaction_edges})

            # 5. Merge timeline
            merged = []
            for actor_data in all_actor_data:
                for ev in actor_data.get("events", []):
                    merged.append({**ev, "actor": actor_data.get("actor", ""), "actor_id": actor_data.get("actor_id", "")})
            merged.sort(key=lambda e: e.get("month", 99))
            yield self._emit("timeline_ready", {"events": merged})

            # 6. Synthesize
            synthesis = await synthesize(all_actor_data, profile_summary, self.decision)
            yield self._emit("synthesis_complete", synthesis)
        except Exception as e:
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            print("[SimulationOrchestrator] ERROR during simulation")
            print(error_msg)
            yield self._emit("error", {"message": str(e), "details": error_msg})

    def _emit(self, event_type: str, data: Any) -> str:
        return json.dumps({"type": event_type, "data": data})
