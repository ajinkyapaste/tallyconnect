import json

transcript_path = r"C:\Users\User\.gemini\antigravity-ide\brain\76c5a1ca-66b8-426a-ad5c-b61643a95aa1\.system_generated\logs\transcript.jsonl"
with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                print("USER INPUT:", data.get("content"))
        except Exception:
            pass
