import { communityTablesReady } from "@/lib/learn/community/db";
import { peerState } from "@/lib/learn/community/peer";
import PeerReviewPanel from "./PeerReviewPanel";

// Server wrapper for the capstone page: shown once the learner has submitted.
// Renders nothing if the community tables are unavailable.
export default async function PeerReviewSection({
  studentId,
  capstone,
  rubric,
}: {
  studentId: string;
  capstone: { id: string; trackId: string };
  /** The capstone's rubric in the learner's language. */
  rubric: Array<{ criterion: string; description?: string | null }>;
}) {
  if (!(await communityTablesReady())) return null;
  try {
    const state = await peerState(studentId, capstone);
    if (!state.submissionId) return null;
    return (
      <PeerReviewPanel
        capstoneId={capstone.id}
        state={state}
        rubric={rubric.map((r) => ({ criterion: r.criterion, description: r.description ?? null }))}
      />
    );
  } catch (err) {
    console.error("[community] peer review", err);
    return null;
  }
}
