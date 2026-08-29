import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";
import {
  BasicPitch,
  addPitchBendsToNoteEvents,
  noteFramesToTime,
  outputToNotesPoly,
  type NoteEventTime,
} from "@spotify/basic-pitch";

let modelPromise: Promise<tf.GraphModel> | undefined;

/**
 * Plain @tensorflow/tfjs has no `file://` IO handler (that lives in tfjs-node,
 * whose native addon we do not want), so read the model basic-pitch ships and
 * feed it to tfjs from memory.
 */
function loadModel(): Promise<tf.GraphModel> {
  // ponytail: located from cwd because the bundler rewrites import.meta.url /
  // require.resolve to virtual paths. Breaks under output:"standalone" — copy
  // the model dir into the app and point here at it if you go that route.
  const dir = path.join(process.cwd(), "node_modules/@spotify/basic-pitch/model");
  const json = JSON.parse(fs.readFileSync(path.join(dir, "model.json"), "utf8"));
  const weights = fs.readFileSync(path.join(dir, "group1-shard1of1.bin"));
  return tf.loadGraphModel({
    load: async () => ({
      modelTopology: json.modelTopology,
      weightSpecs: json.weightsManifest[0].weights,
      weightData: weights.buffer.slice(
        weights.byteOffset,
        weights.byteOffset + weights.byteLength,
      ),
      format: json.format,
      generatedBy: json.generatedBy,
      convertedBy: json.convertedBy,
    }),
  });
}

/** Transcribe mono 22050Hz audio into note events. */
export async function transcribe(pcm: Float32Array): Promise<NoteEventTime[]> {
  modelPromise ??= loadModel();
  const basicPitch = new BasicPitch(modelPromise);

  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];
  await basicPitch.evaluateModel(
    pcm,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    () => {},
  );

  return noteFramesToTime(
    addPitchBendsToNoteEvents(
      contours,
      outputToNotesPoly(frames, onsets, 0.25, 0.25, 5),
    ),
  );
}
