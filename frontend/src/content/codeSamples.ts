// Curated source samples surfaced inside the in-portfolio VS Code (Task 16).
// These are hand-written excerpts that mirror the real work described in
// profile.projects — the actual bug/fix and integration stories, trimmed to
// a readable single-screen snippet each. Registered into the VFS by
// filesystem.ts so they appear under ~/Projects/<id>/ next to each README.md.

export type SampleLanguage = "python" | "diff" | "typescript" | "javascript";

export interface CodeSample {
  path: string;
  language: SampleLanguage;
  code: string;
}

// ~/Projects/deep-emotion/fix_dropout.diff
const deepEmotionDiff = `commit 7f3a1c2  fix(model): gate dropout on train/eval mode

The reference implementation called F.dropout via the functional API
without passing training=self.training. nn.Module.eval() only flips the
flag on *module* dropout layers (nn.Dropout), so the functional call kept
zeroing activations at evaluation time. On FER2013 this held test accuracy
at a ~50% plateau. Threading training=self.training through both calls lets
dropout switch off during eval and reproduces the paper's result: ~50% -> ~70%.

--- a/deep_emotion/model.py
+++ b/deep_emotion/model.py
@@ -41,17 +41,17 @@ class DeepEmotion(nn.Module):
     def forward(self, x):
         # spatial transformer localizes the face before classification
         x = self.stn(x)

         x = F.relu(self.conv1(x))
         x = self.conv2(x)
         x = F.relu(F.max_pool2d(x, 2))
-        x = F.dropout(x, p=0.5)
+        x = F.dropout(x, p=0.5, training=self.training)

         x = F.relu(self.conv3(x))
         x = self.conv4(x)
         x = F.relu(F.max_pool2d(x, 2))
-        x = F.dropout(x, p=0.5)
+        x = F.dropout(x, p=0.5, training=self.training)

         x = x.view(-1, 810)
         x = F.relu(self.fc1(x))
         x = self.fc2(x)
         return x
`;

// ~/Projects/twin/twin.py
const twinPy = `#!/usr/bin/env python3
"""twin - turn plain English into a shell command you approve before it runs."""
import argparse
import subprocess
import sys

import ollama

MODEL = "gemma3"
SYSTEM = (
    "You translate a user's request into a single POSIX shell command. "
    "Reply with ONLY the command - no markdown, no backticks, no explanation."
)


def to_command(prompt: str) -> str:
    resp = ollama.chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt},
        ],
    )
    return resp["message"]["content"].strip().strip("\`")


def main() -> int:
    parser = argparse.ArgumentParser(prog="twin", description="natural language -> shell")
    parser.add_argument("prompt", nargs="+", help="what you want to do, in English")
    parser.add_argument("-y", "--yes", action="store_true", help="skip confirmation")
    args = parser.parse_args()

    command = to_command(" ".join(args.prompt))
    print(f"\\033[36m$ {command}\\033[0m")

    if not args.yes:
        if input("run it? [y/N] ").strip().lower() not in {"y", "yes"}:
            print("aborted.")
            return 1

    return subprocess.run(command, shell=True).returncode


if __name__ == "__main__":
    sys.exit(main())
`;

// ~/Projects/agri-pro/FieldMap.jsx
const fieldMapJsx = `import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Draw / edit farm field boundaries and report the enclosed area live.
export default function FieldMap({ farm, onSave }) {
  const container = useRef(null);
  const drawRef = useRef(null);
  const [hectares, setHectares] = useState(0);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: farm.center,
      zoom: 15,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
    });
    map.addControl(draw);
    drawRef.current = draw;

    const recompute = () => {
      const { features } = draw.getAll();
      const area = features.reduce((sum, f) => sum + turf.area(f), 0);
      setHectares(area / 10_000); // m^2 -> hectares
    };

    map.on("draw.create", recompute);
    map.on("draw.update", recompute);
    map.on("draw.delete", recompute);

    return () => map.remove();
  }, [farm.center]);

  return (
    <div className="field-map">
      <div ref={container} className="field-map__canvas" />
      <footer className="field-map__hud">
        <span>{hectares.toFixed(2)} ha</span>
        <button onClick={() => onSave(drawRef.current.getAll())}>Save boundaries</button>
      </footer>
    </div>
  );
}
`;

export const samples: CodeSample[] = [
  { path: "~/Projects/deep-emotion/fix_dropout.diff", language: "diff", code: deepEmotionDiff },
  { path: "~/Projects/twin/twin.py", language: "python", code: twinPy },
  { path: "~/Projects/agri-pro/FieldMap.jsx", language: "javascript", code: fieldMapJsx },
];
