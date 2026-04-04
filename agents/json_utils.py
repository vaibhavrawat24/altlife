"""Utilities for safely parsing JSON from LLM responses."""
import json
from typing import Any


def _find_balanced_json_object(text: str) -> str | None:
    """
    Return first balanced JSON object substring from text.
    Handles braces inside quoted strings.
    """
    start = text.find("{")
    if start < 0:
        return None

    in_string = False
    escape = False
    depth = 0

    for i in range(start, len(text)):
        ch = text[i]

        if escape:
            escape = False
            continue

        if ch == "\\":
            if in_string:
                escape = True
            continue

        if ch == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start:i + 1]

    return None


def extract_json_from_response(raw: str, context: str = "") -> dict[str, Any]:
    """
    Robustly extract and parse JSON from LLM responses.
    
    Handles:
    - Markdown code blocks (```json...```)
    - JSON embedded in text  
    - Whitespace and formatting issues
    - Leading/trailing whitespace and control characters
    - Returns empty dict on failure with debug info
    
    Args:
        raw: The raw LLM response text
        context: Optional context for debugging (agent name, etc)
    
    Returns:
        Parsed JSON dict, or empty dict {"error": "message"} on failure
    """
    original = raw
    
    # First, strip ALL whitespace and control characters from start/end
    # This handles cases where there's a newline before the JSON starts
    raw = raw.strip()
    # Also remove any control characters
    raw = ''.join(char for char in raw if ord(char) >= 32 or char in '\t\n\r')
    raw = raw.strip()
    
    if not raw:
        print(f"[{context}] ERROR: Empty response after stripping")
        return {"error": "Empty response"}
    
    # Check if this looks like partial JSON (e.g., just a string)
    if raw.startswith('"') and not raw.startswith('"{'):
        print(f"[{context}] ERROR: Response appears to be just a string, not JSON object")
        print(f"  First 100 chars: {repr(raw[:100])}")
        return {"error": "Response is a string, not JSON object"}
    
    # Try to extract JSON from markdown code blocks
    if "```" in raw:
        parts = raw.split("```")
        if len(parts) >= 2:
            for part in parts[1:]:
                part = part.strip()
                if part.startswith("json"):
                    raw = part[4:].strip()
                    break
                elif "{" in part:
                    raw = part.strip()
                    break
    
    # Find JSON object (balanced, quote-aware) if embedded in text
    raw = raw.strip()
    balanced = _find_balanced_json_object(raw)
    if not balanced:
        print(f"[{context}] ERROR: Could not find balanced JSON object")
        print(f"  Tail (last 400 chars repr): {repr(raw[-400:])}")
        return {"error": "Could not find balanced JSON object (likely truncated model output)"}
    raw = balanced
    
    try:
        parsed = json.loads(raw.strip())
        print(f"[{context}] Successfully parsed JSON with keys: {list(parsed.keys())}")
        return parsed
    except json.JSONDecodeError as e:
        print(f"[{context}] ERROR: Failed to parse JSON: {e}")
        print(f"  Error at line {e.lineno}, column {e.colno}: {e.msg}")
        print(f"  Raw (first 500 chars repr): {repr(raw[:500])}")
        print(f"  Original (first 500 chars repr): {repr(original[:500])}")
        return {"error": f"JSON parse error: {e.msg}"}
